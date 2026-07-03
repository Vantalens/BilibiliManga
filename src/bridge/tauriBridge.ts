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

export interface CacheStatus {
  entry_count: number;
  total_bytes: number;
  expired_count: number;
  max_bytes: number;
}

export interface CachePruneResult {
  removed_entries: number;
  removed_bytes: number;
  remaining_bytes: number;
}

export interface StoredCacheEntry {
  id: string;
  relative_path: string;
  size_bytes: number;
  last_accessed_at: number;
  expires_at: number;
}

export interface SearchSuggestionResult {
  suggestions: string[];
}

export interface StoredLibraryItem {
  id: string;
  title: string;
  groups: string[];
  tags: string[];
  rating: number;
  notes: string;
  unread_chapters: number;
  created_at: number;
  updated_at: number;
}

export interface StoredReadingProgress {
  id: string;
  manga_id: string;
  chapter_id: string;
  page_index: number;
  mode: "scroll" | "page";
  updated_at: number;
}

export interface StoredReaderPreferences {
  id: string;
  mode: "scroll" | "page";
  immersive: boolean;
  updated_at: number;
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

export async function upsertStoredLibraryItem(item: StoredLibraryItem): Promise<void> {
  return invoke<void>("upsert_library_item", { item });
}

export async function listStoredLibraryItems(): Promise<StoredLibraryItem[]> {
  return invoke<StoredLibraryItem[]>("list_library_items");
}

export async function upsertStoredReadingProgress(progress: StoredReadingProgress): Promise<void> {
  return invoke<void>("upsert_reading_progress", { progress });
}

export async function getStoredReadingProgress(id: string): Promise<StoredReadingProgress | null> {
  return invoke<StoredReadingProgress | null>("get_reading_progress", { id });
}

export async function upsertStoredReaderPreferences(preferences: StoredReaderPreferences): Promise<void> {
  return invoke<void>("upsert_reader_preferences", { preferences });
}

export async function getStoredReaderPreferences(id: string): Promise<StoredReaderPreferences | null> {
  return invoke<StoredReaderPreferences | null>("get_reader_preferences", { id });
}

export async function recordImageCacheEntry(entry: StoredCacheEntry): Promise<void> {
  return invoke<void>("record_image_cache_entry", { entry });
}

export async function getImageCacheStatus(): Promise<CacheStatus> {
  return invoke<CacheStatus>("image_cache_status");
}

export async function pruneImageCache(maxBytes?: number): Promise<CachePruneResult> {
  return invoke<CachePruneResult>("prune_image_cache", { maxBytes });
}

export async function clearImageCache(): Promise<CacheClearResult> {
  return invoke<CacheClearResult>("clear_image_cache");
}

export async function getSearchSuggestions(term: string, limit?: number): Promise<SearchSuggestionResult> {
  return invoke<SearchSuggestionResult>("search_suggestions", { term, limit });
}

export async function openOfficialMangaPage(): Promise<void> {
  const url = await invoke<string>("official_manga_url");
  await openUrl(url);
}
export async function openOfficialSearchPage(keyword: string): Promise<void> {
  const baseUrl = await invoke<string>("official_manga_url");
  const url = new URL("search", baseUrl);
  const normalized = keyword.trim();
  if (normalized) {
    url.searchParams.set("keyword", normalized);
  }
  await openUrl(url.toString());
}
