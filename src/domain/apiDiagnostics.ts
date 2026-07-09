import type { BookshelfItem, ClassPageComic, ComicDetailResult, ComicEpisode } from "../bridge/tauriBridge";

export const DEFAULT_DIAGNOSTIC_COMIC_ID = 33354;

export function chooseDiagnosticComicId(
  bookshelfItems: BookshelfItem[],
  searchResults: ClassPageComic[],
  fallbackComicId = DEFAULT_DIAGNOSTIC_COMIC_ID
): number {
  const bookshelfComic = bookshelfItems.find((item) => Number.isFinite(item.comic_id) && item.comic_id > 0);
  if (bookshelfComic) {
    return bookshelfComic.comic_id;
  }

  const searchComic = searchResults.find((comic) => Number.isFinite(comic.id) && comic.id > 0);
  if (searchComic) {
    return searchComic.id;
  }

  return fallbackComicId;
}

export function chooseReadableDiagnosticEpisode(detail: ComicDetailResult): ComicEpisode | null {
  return detail.episodes.find((episode) => !episode.is_locked || episode.is_in_free) ?? null;
}