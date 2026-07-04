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

export interface QrCodeResult {
  url: string;
  qrcode_key: string;
}

export type LoginStatus =
  | { type: "scanning" }
  | { type: "confirmed" }
  | { type: "success"; cookies: Cookie[] }
  | { type: "expired" }
  | { type: "failed" };

export interface Cookie {
  name: string;
  value: string;
  domain: string;
}

export interface BookshelfItem {
  comic_id: number;
  title: string;
  vertical_cover?: string;
  is_finish?: number;
  last_ord?: number;
  last_short_title?: string;
  styles?: string[];
}

export interface BookshelfResult {
  items: BookshelfItem[];
  total: number;
  has_more: boolean;
}

export interface PurchasedComic {
  comic_id: number;
  comic_title: string;
  vcover?: string;
  scover?: string;
  hcover?: string;
  bought_ep_count?: number;
  last_ord?: number;
  last_short_title?: string;
  buy_type?: number;
  bug_type?: number;
  enable_auto_pay?: boolean;
}

export interface PurchasedComicsResult {
  items: PurchasedComic[];
}

export interface ClassPageComic {
  id: number;
  title: string;
  vertical_cover: string;
  author_name: string[];
  styles: string[];
  is_finish: number;
  last_ord: number;
  last_short_title: string;
}

export interface ClassPageResult {
  comics: ClassPageComic[];
  total: number;
}

export interface ComicEpisode {
  id: number;
  ord: number;
  short_title: string;
  title: string;
  cover: string;
  is_locked: boolean;
  is_in_free: boolean;
  image_count: number;
  pub_time: string;
}

export interface ComicDetailResult {
  id: number;
  title: string;
  vertical_cover: string;
  horizontal_cover: string;
  author_name: string[];
  styles: string[];
  evaluate: string;
  is_finish: number;
  total: number;
  episodes: ComicEpisode[];
}

export interface ComicSearchResult {
  comics: ClassPageComic[];
  total: number;
}

export interface EpisodeImagesResult {
  images: string[];
}

export interface LoginCheckResult {
  is_login: boolean;
  uid?: number;
}

export interface StoredCookies {
  sessdata: string;
  bili_jct: string;
  dede_user_id: string;
  raw_cookie: string;
  expires_at?: number;
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

export async function checkLoginStatus(cookies: string): Promise<LoginCheckResult> {
  return invoke<LoginCheckResult>("check_login_status", { cookies });
}

export async function fetchPurchasedComics(
  page: number,
  pageSize: number,
  cookies: string
): Promise<PurchasedComicsResult> {
  return invoke<PurchasedComicsResult>("fetch_purchased_comics", { page, pageSize, cookies });
}

export async function fetchClassPage(
  styleId: number,
  pageNum: number,
  pageSize: number
): Promise<ClassPageResult> {
  return invoke<ClassPageResult>("fetch_class_page", { styleId, pageNum, pageSize });
}

export async function searchComics(keyword: string, pageSize: number): Promise<ComicSearchResult> {
  return invoke<ComicSearchResult>("search_comics", { keyword, pageSize });
}

export async function fetchComicDetail(comicId: number): Promise<ComicDetailResult> {
  return invoke<ComicDetailResult>("fetch_comic_detail", { comicId });
}

export async function fetchEpisodeImages(epId: number, cookies?: string): Promise<EpisodeImagesResult> {
  return invoke<EpisodeImagesResult>("fetch_episode_images", { epId, cookies });
}

export async function proxyImageToDataUrl(url: string): Promise<string> {
  return invoke<string>("proxy_image_to_data_url", { url });
}

export async function generateLoginQrcode(): Promise<QrCodeResult> {
  return invoke<QrCodeResult>("generate_login_qrcode");
}

export async function pollLoginStatus(qrcodeKey: string): Promise<LoginStatus> {
  return invoke<LoginStatus>("poll_login_status", { qrcodeKey });
}

export async function fetchUserBookshelf(
  page: number,
  pageSize: number,
  cookies: string
): Promise<BookshelfResult> {
  return invoke<BookshelfResult>("fetch_user_bookshelf", { page, pageSize, cookies });
}

export async function storeCookiesSecure(rawCookie: string): Promise<void> {
  return invoke<void>("store_cookies_secure", { rawCookie });
}

export async function getStoredCookies(): Promise<StoredCookies> {
  return invoke<StoredCookies>("get_stored_cookies");
}

export async function deleteStoredCookies(): Promise<void> {
  return invoke<void>("delete_stored_cookies");
}

export async function hasStoredCookies(): Promise<boolean> {
  return invoke<boolean>("has_stored_cookies");
}

export async function openOfficialMangaPage(): Promise<void> {
  const url = await invoke<string>("official_manga_url");
  await openUrl(url);
}

export async function openOfficialLoginPage(): Promise<void> {
  const url = await invoke<string>("official_login_url");
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

export async function openOfficialComicPage(comicId: number): Promise<void> {
  const baseUrl = await invoke<string>("official_manga_url");
  const url = new URL("detail/mc" + comicId, baseUrl);
  await openUrl(url.toString());
}
