import { useEffect, useState } from "react";
import {
  fetchPurchasedComics,
  listStoredLibraryItems,
  openOfficialMangaPage,
  getStoredCookies,
  hasStoredCookies,
  type PurchasedComic,
  type StoredLibraryItem,
} from "../bridge/tauriBridge";
import "../styles-manga.css";

function getCoverUrl(comic: PurchasedComic): string {
  const cover = comic.vcover || comic.scover || comic.hcover || "";
  return cover.startsWith("//") ? "https:" + cover : cover;
}

export function MangaPurchasedPage() {
  const [comics, setComics] = useState<PurchasedComic[]>([]);
  const [localItems, setLocalItems] = useState<StoredLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    void loadBookshelf(page);
  }, [page]);

  const loadBookshelf = async (targetPage: number) => {
    setLoading(true);
    setNotice(null);

    try {
      const storedItems = await listStoredLibraryItems();
      setLocalItems(storedItems);

      const hasCookies = await hasStoredCookies();
      if (!hasCookies) {
        setNotice(
          storedItems.length > 0
            ? "官网书架暂时没有同步，本机书架仍可使用。"
            : "可以先从首页把漫画加入书架；登录和购买仍在哔哩哔哩漫画官网完成。"
        );
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
      console.error("load bookshelf failed:", err);
      setNotice("官网书架暂时没有同步，本机书架仍可使用。");
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setComics([]);
    setPage(1);
    void loadBookshelf(1);
  };

  const localComicIds = new Set(
    localItems.map((item) => (item.id.startsWith("manga:") ? Number(item.id.slice("manga:".length)) : NaN)).filter(Number.isFinite)
  );
  const remoteComics = comics.filter((comic) => !localComicIds.has(comic.comic_id));
  const totalCount = localItems.length + remoteComics.length;

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>书架</h2>
          <p>{totalCount > 0 ? "共 " + totalCount + " 部漫画" : "你正在看的漫画会放在这里"}</p>
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

      {notice && <div className="notice">{notice}</div>}

      {loading && totalCount === 0 && (
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

      {!loading && totalCount === 0 && (
        <div className="state-page state-page--inline">
          <h2>书架暂时为空</h2>
          <p>可以从首页把漫画加入书架；登录和购买都在哔哩哔哩漫画官网完成。</p>
        </div>
      )}

      {totalCount > 0 && (
        <>
          <div className="comic-grid">
            {localItems.map((item) => (
              <article className="comic-card" key={item.id}>
                <div className="comic-thumb">
                  <div className="cover-fallback">{item.title}</div>
                  <span className="comic-status">书架</span>
                </div>
                <h3 className="comic-title">{item.title}</h3>
                <p className="comic-meta">{item.tags.length > 0 ? item.tags.join(" · ") : "本机书架"}</p>
              </article>
            ))}

            {remoteComics.map((comic) => {
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
