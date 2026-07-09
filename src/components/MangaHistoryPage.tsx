import { useEffect, useMemo, useState } from "react";
import { fetchComicDetail, listStoredReadingProgress, type ComicDetailResult, type StoredReadingProgress } from "../bridge/tauriBridge";
import { formatApiFailure } from "../domain/apiErrors";
import { buildReadingHistoryRows } from "../domain/history";
import "../styles-manga.css";

interface MangaHistoryPageProps {
  onOpenComic: (comicId: number) => void;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "未知时间";
  return new Date(value).toLocaleString();
}

function numericComicIds(items: StoredReadingProgress[]): number[] {
  const ids = new Set<number>();
  for (const item of items) {
    const id = Number(item.manga_id);
    if (Number.isFinite(id) && id > 0) ids.add(id);
  }
  return Array.from(ids);
}

export function MangaHistoryPage({ onOpenComic }: MangaHistoryPageProps) {
  const [items, setItems] = useState<StoredReadingProgress[]>([]);
  const [details, setDetails] = useState<Map<number, ComicDetailResult>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listStoredReadingProgress(80)
      .then(async (progress) => {
        if (cancelled) return;
        setItems(progress);
        const loadedDetails = new Map<number, ComicDetailResult>();
        await Promise.all(
          numericComicIds(progress).map(async (comicId) => {
            try {
              loadedDetails.set(comicId, await fetchComicDetail(comicId));
            } catch (err) {
              console.error("load history comic detail failed:", err);
            }
          })
        );
        if (!cancelled) setDetails(loadedDetails);
      })
      .catch((err) => {
        console.error("load reading history failed:", err);
        if (!cancelled) {
          setItems([]);
          setDetails(new Map());
          setError(formatApiFailure(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => buildReadingHistoryRows(items, details), [details, items]);

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>最近</h2>
          <p>{rows.length > 0 ? "最近阅读 " + rows.length + " 条" : "阅读记录会保存在本机"}</p>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}
      {loading && <div className="notice">正在加载最近阅读</div>}

      {!loading && rows.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>暂无阅读记录</h2>
          <p>打开可读章节后，进度会保存在这里。</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="history-list">
          {rows.map((item) => (
            <button
              className="history-item"
              disabled={!item.canOpen}
              key={item.id}
              onClick={() => item.canOpen && onOpenComic(item.comicId)}
              type="button"
            >
              <span>{item.comicTitle}</span>
              <strong>{item.episodeTitle}</strong>
              <em>{item.mode === "page" ? "分页" : "长滚动"} · 第 {item.pageIndex + 1} 页 · {formatTime(item.updatedAt)}</em>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
