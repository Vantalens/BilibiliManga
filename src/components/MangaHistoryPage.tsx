import { useEffect, useState } from "react";
import { listStoredReadingProgress, type StoredReadingProgress } from "../bridge/tauriBridge";
import "../styles-manga.css";

interface MangaHistoryPageProps {
  onOpenComic: (comicId: number) => void;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "未知时间";
  return new Date(value).toLocaleString();
}

export function MangaHistoryPage({ onOpenComic }: MangaHistoryPageProps) {
  const [items, setItems] = useState<StoredReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listStoredReadingProgress(80)
      .then(setItems)
      .catch((err) => {
        console.error("load reading history failed:", err);
        setItems([]);
        setError("最近阅读暂时没有加载出来。");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>最近</h2>
          <p>{items.length > 0 ? "最近阅读 " + items.length + " 条" : "阅读记录会保存在本机"}</p>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}
      {loading && <div className="notice">正在加载最近阅读</div>}

      {!loading && items.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>暂无阅读记录</h2>
          <p>打开可读章节后，进度会保存在这里。</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="history-list">
          {items.map((item) => {
            const comicId = Number(item.manga_id);
            const canOpen = Number.isFinite(comicId) && comicId > 0;
            return (
              <button
                className="history-item"
                disabled={!canOpen}
                key={item.id}
                onClick={() => canOpen && onOpenComic(comicId)}
                type="button"
              >
                <span>漫画 {item.manga_id}</span>
                <strong>章节 {item.chapter_id}</strong>
                <em>{item.mode === "page" ? "分页" : "长滚动"} · 第 {item.page_index + 1} 页 · {formatTime(item.updated_at)}</em>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
