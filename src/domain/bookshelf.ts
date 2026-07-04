import type { ClassPageComic, StoredLibraryItem } from "../bridge/tauriBridge";

export function createLibraryItemFromClassPageComic(
  comic: ClassPageComic,
  now = Date.now()
): StoredLibraryItem {
  return {
    id: "manga:" + comic.id,
    title: comic.title,
    groups: ["书架"],
    tags: comic.styles,
    rating: 0,
    notes: "",
    unread_chapters: 0,
    created_at: now,
    updated_at: now
  };
}
