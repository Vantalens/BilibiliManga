use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE_NAME: &str = "BiliManga";
const COOKIE_KEY: &str = "bilibili_cookies";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredCookies {
    pub sessdata: String,
    pub bili_jct: String,
    pub dede_user_id: String,
    pub raw_cookie: String,
    pub expires_at: Option<i64>, // Unix timestamp
}

#[derive(Debug)]
pub enum CookieError {
    KeyringError(String),
    NotFound,
    InvalidFormat(String),
    Expired,
}

impl std::fmt::Display for CookieError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CookieError::KeyringError(msg) => write!(f, "Keyring error: {}", msg),
            CookieError::NotFound => write!(f, "No stored cookies found"),
            CookieError::InvalidFormat(msg) => write!(f, "Invalid cookie format: {}", msg),
            CookieError::Expired => write!(f, "Stored cookies have expired"),
        }
    }
}

impl From<keyring::Error> for CookieError {
    fn from(error: keyring::Error) -> Self {
        CookieError::KeyringError(error.to_string())
    }
}

/// Store cookies securely in system keyring
pub fn store_cookies(cookies: &StoredCookies) -> Result<(), CookieError> {
    let entry = Entry::new(SERVICE_NAME, COOKIE_KEY)?;
    let json =
        serde_json::to_string(cookies).map_err(|e| CookieError::InvalidFormat(e.to_string()))?;
    entry.set_password(&json)?;
    Ok(())
}

/// Retrieve cookies from system keyring
pub fn get_cookies() -> Result<StoredCookies, CookieError> {
    let entry = Entry::new(SERVICE_NAME, COOKIE_KEY)?;
    let json = entry.get_password().map_err(|e| match e {
        keyring::Error::NoEntry => CookieError::NotFound,
        other => CookieError::KeyringError(other.to_string()),
    })?;

    let cookies: StoredCookies =
        serde_json::from_str(&json).map_err(|e| CookieError::InvalidFormat(e.to_string()))?;

    // Check expiration if set
    if let Some(expires_at) = cookies.expires_at {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        if now > expires_at {
            return Err(CookieError::Expired);
        }
    }

    Ok(cookies)
}

/// Delete stored cookies from system keyring
pub fn delete_cookies() -> Result<(), CookieError> {
    let entry = Entry::new(SERVICE_NAME, COOKIE_KEY)?;
    entry.delete_credential().map_err(|e| match e {
        keyring::Error::NoEntry => CookieError::NotFound,
        other => CookieError::KeyringError(other.to_string()),
    })?;
    Ok(())
}

/// Parse raw cookie string into structured format
pub fn parse_cookie_string(raw: &str) -> Result<StoredCookies, CookieError> {
    let mut sessdata = None;
    let mut bili_jct = None;
    let mut dede_user_id = None;

    for pair in raw.split(';') {
        let pair = pair.trim();
        if let Some((key, value)) = pair.split_once('=') {
            match key.trim() {
                "SESSDATA" => sessdata = Some(value.trim().to_string()),
                "bili_jct" => bili_jct = Some(value.trim().to_string()),
                "DedeUserID" => dede_user_id = Some(value.trim().to_string()),
                _ => {}
            }
        }
    }

    let sessdata = sessdata.ok_or_else(|| {
        CookieError::InvalidFormat("SESSDATA not found in cookie string".to_string())
    })?;

    Ok(StoredCookies {
        sessdata,
        bili_jct: bili_jct.unwrap_or_default(),
        dede_user_id: dede_user_id.unwrap_or_default(),
        raw_cookie: raw.to_string(),
        expires_at: None, // Will be set when we detect expiration
    })
}

/// Check if cookies are stored
pub fn has_stored_cookies() -> bool {
    matches!(get_cookies(), Ok(_))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_cookie_string() {
        let raw = "SESSDATA=abc123; bili_jct=def456; DedeUserID=789";
        let result = parse_cookie_string(raw);
        assert!(result.is_ok());

        let cookies = result.unwrap();
        assert_eq!(cookies.sessdata, "abc123");
        assert_eq!(cookies.bili_jct, "def456");
        assert_eq!(cookies.dede_user_id, "789");
    }

    #[test]
    fn test_parse_cookie_missing_sessdata() {
        let raw = "bili_jct=def456; DedeUserID=789";
        let result = parse_cookie_string(raw);
        assert!(result.is_err());
    }

    #[test]
    fn test_cookie_roundtrip() {
        let cookies = StoredCookies {
            sessdata: "test_session".to_string(),
            bili_jct: "test_jct".to_string(),
            dede_user_id: "12345".to_string(),
            raw_cookie: "SESSDATA=test_session; bili_jct=test_jct".to_string(),
            expires_at: None,
        };

        // Store
        let store_result = store_cookies(&cookies);
        if store_result.is_err() {
            // Skip test if keyring is not available (e.g., in CI)
            return;
        }

        // Retrieve
        let retrieved = get_cookies().expect("Should retrieve cookies");
        assert_eq!(retrieved.sessdata, cookies.sessdata);
        assert_eq!(retrieved.bili_jct, cookies.bili_jct);

        // Cleanup
        let _ = delete_cookies();
    }
}
