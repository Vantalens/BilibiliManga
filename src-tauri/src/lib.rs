use serde::Serialize;
use tauri::Manager;

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
fn storage_security_status() -> security::StorageSecurityStatus {
    security::storage_security_status()
}

#[tauri::command]
fn initialize_secure_storage(app: tauri::AppHandle) -> Result<security::StorageSecurityStatus, String> {
    let store = security::SystemSecretStore;
    let database_key = security::get_or_create_database_key(&store).map_err(|error| error.to_string())?;
    let database_path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("bilimanga.db");
    storage::initialize_encrypted_database(&database_path, &database_key)
        .map_err(|error| error.to_string())?;
    Ok(security::storage_security_status())
}

#[tauri::command]
fn clear_image_cache(app: tauri::AppHandle) -> Result<CacheClearResult, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| error.to_string())?
        .join("images");
    let removed_bytes = security::clear_cache_dir(&cache_dir).map_err(|error| error.to_string())?;
    Ok(CacheClearResult { removed_bytes })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_app_status,
            official_manga_url,
            storage_security_status,
            initialize_secure_storage,
            clear_image_cache
        ])
        .run(tauri::generate_context!())
        .expect("error while running BiliManga");
}