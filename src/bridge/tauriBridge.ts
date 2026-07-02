import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

export interface StorageSecurityStatus {
  service_name: string;
  database_key_source: string;
  database_encryption: string;
  cache_export_allowed: boolean;
  cache_policy: string;
}

export interface AppStatus {
  app_name: string;
  version: string;
  platform: string;
  content_policy: {
    payment_flow: string;
    cache_policy: string;
    export_allowed: boolean;
  };
}

export interface CacheClearResult {
  removed_bytes: number;
}

export async function getAppStatus(): Promise<AppStatus> {
  return invoke<AppStatus>("get_app_status");
}

export async function getStorageSecurityStatus(): Promise<StorageSecurityStatus> {
  return invoke<StorageSecurityStatus>("storage_security_status");
}

export async function initializeSecureStorage(): Promise<StorageSecurityStatus> {
  return invoke<StorageSecurityStatus>("initialize_secure_storage");
}

export async function clearImageCache(): Promise<CacheClearResult> {
  return invoke<CacheClearResult>("clear_image_cache");
}

export async function openOfficialMangaPage(): Promise<void> {
  const url = await invoke<string>("official_manga_url");
  await openUrl(url);
}

