import { useEffect, useState } from "react";
import {
  fetchPurchasedComics,
  openOfficialMangaPage,
  getStoredCookies,
  hasStoredCookies,
  type PurchasedComic,
} from "../bridge/tauriBridge";
import "../styles-manga.css";

function getCoverUrl(comic: PurchasedComic): string {
  const cover = comic.vcover || comic.scover || comic.hcover || "";
  return cover.startsWith("//") ? "https:" + cover : cover;
}

export function MangaPurchasedPage() {
  const [comics, setComics] = useState<PurchasedComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    void loadPurchasedComics(page);
  }, [page]);

  const loadPurchasedComics = async (targetPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const hasCookies = await hasStoredCookies();
      if (!hasCookies) {
        setError("请先在哔哩哔哩漫画官网完成登录，然后回到这里刷新书架。");
        setLoading(false);
        return;
      }

      const stored = await getStoredCookies();
      const result = await fetchPurchasedComics(targetPage, 15, stored.raw_cookie);

      if (targetPage === 1) {
        setComics(result.items);
      } else {
        setComics((prev) => [...prev, ...result.items]);
      }

      setHasMore(result.items.length === 15);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setComics([]);
    setPage(1);
    void loadPurchasedComics(1);
  };

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>书架</h2>
          <p>{comics.length > 0 ? "已同步 " + comics.length + " 部漫画" : "你正在看的漫画会放在这里"}</p>
        </div>
        <div className="section-actions">
          <button className="ghost-button" onClick={() => void openOfficialMangaPage()} type="button">
            打开官网
          </button>
          <button className="ghost-button" onClick={refresh} disabled={loading} type="button">
            刷新
          </button>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      {loading && comics.length === 0 && (
        <div className="comic-grid" aria-label="加载中">
          {Array.from({ length: 10 }, (_, index) => (
            <div className="comic-card comic-card--skeleton" key={index}>
              <div className="comic-thumb" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && comics.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>书架暂时为空</h2>
          <p>登录和购买都在哔哩哔哩漫画官网完成，完成后回到这里刷新书架。</p>
        </div>
      )}

      {comics.length > 0 && (
        <>
          <div className="comic-grid">
            {comics.map((comic) => {
              const cover = getCoverUrl(comic);
              return (
                <article className="comic-card" key={comic.comic_id}>
                  <div className="comic-thumb">
                    {cover ? <img src={cover} alt={comic.comic_title} loading="lazy" /> : <div className="cover-fallback">{comic.comic_title}</div>}
                    <span className="comic-status">书架</span>
                  </div>
                  <h3 className="comic-title">{comic.comic_title}</h3>
                  <p className="comic-meta">
                    可读 {comic.bought_ep_count ?? 0} 话{comic.last_short_title ? " · " + comic.last_short_title : ""}
                  </p>
                </article>
              );
            })}
          </div>

          {hasMore && (
            <div className="load-more-row">
              <button className="ghost-button" onClick={() => setPage((prev) => prev + 1)} disabled={loading} type="button">
                {loading ? "加载中" : "加载更多"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
