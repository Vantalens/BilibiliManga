use serde::Serialize;
use std::path::{Component, Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

mod api;
mod security;
mod storage;

#[derive(Serialize)]
struct AppStatus {
    app_name: &'static str,
    version: &'static str,
    platform: &'static str,
    content_policy: ContentPolicy,
}

#[derive(Serialize)]
struct ContentPolicy {
    payment_flow: &'static str,
    cache_policy: &'static str,
    export_allowed: bool,
}

#[derive(Serialize)]
struct CacheClearResult {
    removed_bytes: u64,
}

#[derive(Serialize)]
struct CacheStatus {
    entry_count: usize,
    total_bytes: i64,
    expired_count: usize,
    max_bytes: i64,
}

#[derive(Serialize)]
struct CachePruneResult {
    removed_entries: usize,
    removed_bytes: i64,
    remaining_bytes: i64,
}

const IMAGE_CACHE_MAX_BYTES: i64 = 256 * 1024 * 1024;

#[tauri::command]
fn get_app_status() -> AppStatus {
    AppStatus {
        app_name: "BiliManga",
        version: env!("CARGO_PKG_VERSION"),
        platform: std::env::consts::OS,
        content_policy: ContentPolicy {
            payment_flow: "official-web",
            cache_policy: "short-term-non-exportable",
            export_allowed: false,
        },
    }
}

#[tauri::command]
fn official_manga_url() -> &'static str {
    "https://manga.bilibili.com/"
}

#[tauri::command]
fn official_login_url() -> &'static str {
    "https://passport.bilibili.com/login"
}

#[tauri::command]
async fn search_suggestions(
    term: String,
    limit: Option<u8>,
) -> Result<api::SearchSuggestionResult, String> {
    api::search_suggestions(term, limit)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn check_login_status(cookies: String) -> Result<api::LoginCheckResult, String> {
    api::check_login_status(&cookies)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn fetch_purchased_comics(
    page: i32,
    page_size: i32,
    cookies: String,
) -> Result<api::PurchasedComicsResult, String> {
    api::fetch_purchased_comics(page, page_size, &cookies)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn generate_login_qrcode() -> Result<api::QrCodeResult, String> {
    api::generate_qrcode()
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn poll_login_status(qrcode_key: String) -> Result<api::LoginStatus, String> {
    api::poll_login_status(&qrcode_key)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn fetch_user_bookshelf(
    page: i32,
    page_size: i32,
    cookies: String,
) -> Result<api::BookshelfResult, String> {
    api::fetch_bookshelf(page, page_size, &cookies)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn storage_security_status() -> security::StorageSecurityStatus {
    security::storage_security_status()
}

#[tauri::command]
fn initialize_secure_storage(
    app: tauri::AppHandle,
) -> Result<security::StorageSecurityStatus, String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    Ok(security::storage_security_status())
}

#[tauri::command]
fn upsert_library_item(
    app: tauri::AppHandle,
    item: storage::StoredLibraryItem,
) -> Result<(), String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::upsert_library_item(&database_path, &database_key, &item)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn list_library_items(app: tauri::AppHandle) -> Result<Vec<storage::StoredLibraryItem>, String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::list_library_items(&database_path, &database_key).map_err(|error| error.to_string())
}

#[tauri::command]
fn upsert_reading_progress(
    app: tauri::AppHandle,
    progress: storage::StoredReadingProgress,
) -> Result<(), String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::upsert_reading_progress(&database_path, &database_key, &progress)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_reading_progress(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<storage::StoredReadingProgress>, String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::get_reading_progress(&database_path, &database_key, &id)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn upsert_reader_preferences(
    app: tauri::AppHandle,
    preferences: storage::StoredReaderPreferences,
) -> Result<(), String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::upsert_reader_preferences(&database_path, &database_key, &preferences)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_reader_preferences(
    app: tauri::AppHandle,
    id: String,
) -> Result<Option<storage::StoredReaderPreferences>, String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::get_reader_preferences(&database_path, &database_key, &id)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn record_image_cache_entry(
    app: tauri::AppHandle,
    entry: storage::StoredCacheEntry,
) -> Result<(), String> {
    if entry.size_bytes < 0 {
        return Err("cache entry size must be non-negative".to_string());
    }
    safe_cache_path(&image_cache_dir(&app)?, &entry.relative_path)?;
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::upsert_cache_entry(&database_path, &database_key, &entry)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn image_cache_status(app: tauri::AppHandle) -> Result<CacheStatus, String> {
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    let entries = storage::list_cache_entries(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    Ok(build_cache_status(&entries, now_millis()?))
}

#[tauri::command]
fn prune_image_cache(
    app: tauri::AppHandle,
    max_bytes: Option<i64>,
) -> Result<CachePruneResult, String> {
    let limit = max_bytes.unwrap_or(IMAGE_CACHE_MAX_BYTES);
    if limit < 0 {
        return Err("cache limit must be non-negative".to_string());
    }

    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    let entries = storage::list_cache_entries(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    let evict_entries = plan_cache_prune(&entries, now_millis()?, limit);
    let cache_dir = image_cache_dir(&app)?;
    let mut removed_bytes = 0_i64;
    let mut evict_ids = Vec::new();

    for entry in evict_entries {
        removed_bytes += remove_cache_file(&cache_dir, entry).map_err(|error| error.to_string())?;
        evict_ids.push(entry.id.clone());
    }

    storage::delete_cache_entries(&database_path, &database_key, &evict_ids)
        .map_err(|error| error.to_string())?;
    let remaining_bytes = storage::list_cache_entries(&database_path, &database_key)
        .map_err(|error| error.to_string())?
        .into_iter()
        .map(|entry| entry.size_bytes)
        .sum();

    Ok(CachePruneResult {
        removed_entries: evict_ids.len(),
        removed_bytes,
        remaining_bytes,
    })
}

#[tauri::command]
fn clear_image_cache(app: tauri::AppHandle) -> Result<CacheClearResult, String> {
    let cache_dir = image_cache_dir(&app)?;
    let removed_bytes = security::clear_cache_dir(&cache_dir).map_err(|error| error.to_string())?;
    let (database_path, database_key) = encrypted_database_context(&app)?;
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    storage::clear_cache_entries(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    Ok(CacheClearResult { removed_bytes })
}

fn build_cache_status(entries: &[storage::StoredCacheEntry], now: i64) -> CacheStatus {
    CacheStatus {
        entry_count: entries.len(),
        total_bytes: entries.iter().map(|entry| entry.size_bytes).sum(),
        expired_count: entries
            .iter()
            .filter(|entry| entry.expires_at <= now)
            .count(),
        max_bytes: IMAGE_CACHE_MAX_BYTES,
    }
}

fn plan_cache_prune(
    entries: &[storage::StoredCacheEntry],
    now: i64,
    max_bytes: i64,
) -> Vec<&storage::StoredCacheEntry> {
    let mut expired_entries = entries
        .iter()
        .filter(|entry| entry.expires_at <= now)
        .collect::<Vec<_>>();
    expired_entries.sort_by_key(|entry| (entry.expires_at, entry.last_accessed_at));

    let expired_ids = expired_entries
        .iter()
        .map(|entry| entry.id.as_str())
        .collect::<std::collections::HashSet<_>>();
    let retained_entries = entries
        .iter()
        .filter(|entry| !expired_ids.contains(entry.id.as_str()))
        .collect::<Vec<_>>();
    let mut remaining_bytes = retained_entries
        .iter()
        .map(|entry| entry.size_bytes)
        .sum::<i64>();
    let mut evict_entries = expired_entries;

    if remaining_bytes > max_bytes {
        let mut lru_entries = retained_entries;
        lru_entries.sort_by_key(|entry| (entry.last_accessed_at, entry.size_bytes));
        for entry in lru_entries {
            if remaining_bytes <= max_bytes {
                break;
            }
            remaining_bytes -= entry.size_bytes;
            evict_entries.push(entry);
        }
    }

    evict_entries
}

fn remove_cache_file(cache_dir: &Path, entry: &storage::StoredCacheEntry) -> Result<i64, String> {
    let path = safe_cache_path(cache_dir, &entry.relative_path)?;
    if !path.exists() {
        return Ok(entry.size_bytes);
    }
    let metadata = std::fs::metadata(&path).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("cache entry path is not a file".to_string());
    }
    let removed_bytes = i64::try_from(metadata.len()).map_err(|error| error.to_string())?;
    std::fs::remove_file(path).map_err(|error| error.to_string())?;
    Ok(removed_bytes)
}

fn safe_cache_path(cache_dir: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let relative = Path::new(relative_path);
    if relative.components().any(|component| {
        matches!(
            component,
            Component::Prefix(_) | Component::RootDir | Component::ParentDir
        )
    }) {
        return Err("cache entry path must stay inside image cache directory".to_string());
    }
    Ok(cache_dir.join(relative))
}

fn image_cache_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?
        .join("images"))
}

fn now_millis() -> Result<i64, String> {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?;
    i64::try_from(duration.as_millis()).map_err(|error| error.to_string())
}

fn encrypted_database_context(
    app: &tauri::AppHandle,
) -> Result<(std::path::PathBuf, String), String> {
    let store = security::SystemSecretStore;
    let database_key =
        security::get_or_create_database_key(&store).map_err(|error| error.to_string())?;
    let database_path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("bilimanga.db");
    Ok((database_path, database_key))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cache_entry(
        id: &str,
        size_bytes: i64,
        last_accessed_at: i64,
        expires_at: i64,
    ) -> storage::StoredCacheEntry {
        storage::StoredCacheEntry {
            id: id.to_string(),
            relative_path: format!("{id}.bin"),
            size_bytes,
            last_accessed_at,
            expires_at,
        }
    }

    #[test]
    fn cache_prune_plan_removes_expired_then_lru_until_within_limit() {
        let entries = vec![
            cache_entry("fresh-large", 80, 900, 2_000),
            cache_entry("fresh-small-old", 40, 100, 2_000),
            cache_entry("expired", 10, 950, 999),
        ];

        let evict = plan_cache_prune(&entries, 1_000, 100)
            .into_iter()
            .map(|entry| entry.id.clone())
            .collect::<Vec<_>>();

        assert_eq!(evict, vec!["expired", "fresh-small-old"]);
    }

    #[test]
    fn cache_paths_reject_absolute_and_parent_segments() {
        let base = Path::new("cache-root");

        assert!(safe_cache_path(base, "chapter/image.bin").is_ok());
        assert!(safe_cache_path(base, "../image.bin").is_err());
        assert!(safe_cache_path(base, "C:\\image.bin").is_err());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            official_manga_url,
            official_login_url,
            search_suggestions,
            check_login_status,
            fetch_purchased_comics,
            generate_login_qrcode,
            poll_login_status,
            fetch_user_bookshelf,
            storage_security_status,
            initialize_secure_storage,
            upsert_library_item,
            list_library_items,
            upsert_reading_progress,
            get_reading_progress,
            upsert_reader_preferences,
            get_reader_preferences,
            record_image_cache_entry,
            image_cache_status,
            prune_image_cache,
            clear_image_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running BiliManga");
}
