use base64::{engine::general_purpose::STANDARD_NO_PAD, Engine as _};
use serde::Serialize;
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};

const SERVICE_NAME: &str = "BiliManga";
const DATABASE_KEY_USER: &str = "encrypted-database-key";
const DATABASE_KEY_BYTES: usize = 32;

#[derive(Debug)]
pub enum SecurityError {
    Random(String),
    SecretStore(String),
    Io(std::io::Error),
}

impl fmt::Display for SecurityError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SecurityError::Random(message) => {
                write!(formatter, "random generation failed: {message}")
            }
            SecurityError::SecretStore(message) => {
                write!(formatter, "secret store failed: {message}")
            }
            SecurityError::Io(error) => write!(formatter, "io failed: {error}"),
        }
    }
}

impl std::error::Error for SecurityError {}

impl From<std::io::Error> for SecurityError {
    fn from(value: std::io::Error) -> Self {
        SecurityError::Io(value)
    }
}

pub trait SecretStore {
    fn get_secret(&self, service: &str, user: &str) -> Result<Option<String>, SecurityError>;
    fn set_secret(&self, service: &str, user: &str, secret: &str) -> Result<(), SecurityError>;
}

pub struct SystemSecretStore;

impl SecretStore for SystemSecretStore {
    fn get_secret(&self, service: &str, user: &str) -> Result<Option<String>, SecurityError> {
        let entry = keyring::Entry::new(service, user)
            .map_err(|error| SecurityError::SecretStore(error.to_string()))?;

        match entry.get_password() {
            Ok(secret) => Ok(Some(secret)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(SecurityError::SecretStore(error.to_string())),
        }
    }

    fn set_secret(&self, service: &str, user: &str, secret: &str) -> Result<(), SecurityError> {
        let entry = keyring::Entry::new(service, user)
            .map_err(|error| SecurityError::SecretStore(error.to_string()))?;
        entry
            .set_password(secret)
            .map_err(|error| SecurityError::SecretStore(error.to_string()))
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
pub struct StorageSecurityStatus {
    pub service_name: &'static str,
    pub database_key_source: &'static str,
    pub database_encryption: &'static str,
    pub cache_export_allowed: bool,
    pub cache_policy: &'static str,
}

pub fn storage_security_status() -> StorageSecurityStatus {
    StorageSecurityStatus {
        service_name: SERVICE_NAME,
        database_key_source: "system-keyring",
        database_encryption: "sqlcipher-required-before-real-account-data",
        cache_export_allowed: false,
        cache_policy: "short-term-capacity-and-expiry-limited",
    }
}

pub fn get_or_create_database_key(store: &impl SecretStore) -> Result<String, SecurityError> {
    if let Some(existing) = store.get_secret(SERVICE_NAME, DATABASE_KEY_USER)? {
        return Ok(existing);
    }

    let mut bytes = [0_u8; DATABASE_KEY_BYTES];
    getrandom::fill(&mut bytes).map_err(|error| SecurityError::Random(error.to_string()))?;
    let encoded = STANDARD_NO_PAD.encode(bytes);
    store.set_secret(SERVICE_NAME, DATABASE_KEY_USER, &encoded)?;
    Ok(encoded)
}

#[cfg(test)]
pub fn ensure_database_key(store: &impl SecretStore) -> Result<(), SecurityError> {
    get_or_create_database_key(store).map(|_| ())
}

pub fn clear_cache_dir(cache_dir: &Path) -> Result<u64, SecurityError> {
    if !cache_dir.exists() {
        return Ok(0);
    }

    let mut removed_bytes = 0;
    for entry in fs::read_dir(cache_dir)? {
        let entry = entry?;
        let path = entry.path();
        removed_bytes += remove_path(&path)?;
    }

    Ok(removed_bytes)
}

fn remove_path(path: &PathBuf) -> Result<u64, SecurityError> {
    let metadata = fs::metadata(path)?;
    if metadata.is_dir() {
        let mut removed_bytes = 0;
        for entry in fs::read_dir(path)? {
            removed_bytes += remove_path(&entry?.path())?;
        }
        fs::remove_dir(path)?;
        Ok(removed_bytes)
    } else {
        let len = metadata.len();
        fs::remove_file(path)?;
        Ok(len)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::RefCell;
    use std::collections::HashMap;
    use std::fs;

    #[derive(Default)]
    struct MemorySecretStore {
        secrets: RefCell<HashMap<String, String>>,
    }

    impl SecretStore for MemorySecretStore {
        fn get_secret(&self, service: &str, user: &str) -> Result<Option<String>, SecurityError> {
            Ok(self
                .secrets
                .borrow()
                .get(&format!("{service}:{user}"))
                .cloned())
        }

        fn set_secret(&self, service: &str, user: &str, secret: &str) -> Result<(), SecurityError> {
            self.secrets
                .borrow_mut()
                .insert(format!("{service}:{user}"), secret.to_string());
            Ok(())
        }
    }

    #[test]
    fn ensure_database_key_creates_one_base64_key_without_returning_it() {
        let store = MemorySecretStore::default();

        ensure_database_key(&store).expect("database key should be created");

        let stored = store
            .get_secret(SERVICE_NAME, DATABASE_KEY_USER)
            .expect("secret lookup should work")
            .expect("secret should exist");
        let decoded = STANDARD_NO_PAD
            .decode(stored.as_bytes())
            .expect("secret should be base64 encoded");
        assert_eq!(decoded.len(), DATABASE_KEY_BYTES);
    }

    #[test]
    fn ensure_database_key_keeps_existing_key_stable() {
        let store = MemorySecretStore::default();
        store
            .set_secret(SERVICE_NAME, DATABASE_KEY_USER, "existing-secret")
            .expect("seed should work");

        ensure_database_key(&store).expect("existing key should be accepted");

        assert_eq!(
            store
                .get_secret(SERVICE_NAME, DATABASE_KEY_USER)
                .expect("secret lookup should work"),
            Some("existing-secret".to_string())
        );
    }

    #[test]
    fn storage_security_status_never_allows_cache_export() {
        let status = storage_security_status();

        assert_eq!(status.database_key_source, "system-keyring");
        assert!(!status.cache_export_allowed);
        assert_eq!(
            status.database_encryption,
            "sqlcipher-required-before-real-account-data"
        );
    }

    #[test]
    fn clear_cache_dir_removes_files_and_reports_removed_bytes() {
        let temp = tempfile::tempdir().expect("temp dir should exist");
        let cache = temp.path().join("cache");
        fs::create_dir(&cache).expect("cache dir should be created");
        fs::write(cache.join("a.bin"), [1_u8, 2, 3]).expect("file should be written");
        fs::create_dir(cache.join("nested")).expect("nested dir should be created");
        fs::write(cache.join("nested").join("b.bin"), [4_u8, 5])
            .expect("nested file should be written");

        let removed = clear_cache_dir(&cache).expect("cache should be cleared");

        assert_eq!(removed, 5);
        assert_eq!(
            fs::read_dir(&cache)
                .expect("cache dir should remain")
                .count(),
            0
        );
    }
}
