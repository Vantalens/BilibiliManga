export interface HistoryProgressInput {
  id: string;
  manga_id: string;
  chapter_id: string;
  page_index: number;
  mode: "scroll" | "page";
  updated_at: number;
}

export interface HistoryComicDetailInput {
  id: number;
  title: string;
  episodes: Array<{
    id: number;
    short_title: string;
    title: string;
  }>;
}

export interface ReadingHistoryRow {
  id: string;
  comicId: number;
  episodeId: number;
  comicTitle: string;
  episodeTitle: string;
  pageIndex: number;
  mode: "scroll" | "page";
  updatedAt: number;
  canOpen: boolean;
}

export function buildReadingHistoryRows(
  items: HistoryProgressInput[],
  details: Map<number, HistoryComicDetailInput>
): ReadingHistoryRow[] {
  return items.map((item) => {
    const comicId = Number(item.manga_id);
    const episodeId = Number(item.chapter_id);
    const detail = Number.isFinite(comicId) ? details.get(comicId) : undefined;
    const episode = detail?.episodes.find((entry) => entry.id === episodeId);
    return {
      id: item.id,
      comicId,
      episodeId,
      comicTitle: detail?.title || "未知漫画",
      episodeTitle: formatEpisodeTitle(item.chapter_id, episode),
      pageIndex: item.page_index,
      mode: item.mode,
      updatedAt: item.updated_at,
      canOpen: Number.isFinite(comicId) && comicId > 0,
    };
  });
}

function formatEpisodeTitle(
  fallbackId: string,
  episode?: { short_title: string; title: string }
): string {
  if (!episode) return "章节 " + fallbackId;
  const shortTitle = episode.short_title.trim();
  const title = episode.title.trim();
  if (shortTitle && title && shortTitle !== title) return shortTitle + " · " + title;
  return shortTitle || title || "章节 " + fallbackId;
}
