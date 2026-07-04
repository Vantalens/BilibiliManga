export function normalizeSearchKeyword(keyword: string): string {
  return keyword.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function buildOfficialSearchUrl(keyword: string, baseUrl = "https://manga.bilibili.com/"): string {
  const url = new URL("search", baseUrl);
  const normalized = normalizeSearchKeyword(keyword);
  if (normalized) {
    url.searchParams.set("keyword", normalized);
  }
  return url.toString();
}
