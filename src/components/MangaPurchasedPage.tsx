import { useEffect, useState } from "react";
import {
  fetchUserBookshelf,
  getStoredCookies,
  hasStoredCookies,
  listStoredLibraryItems,
  proxyImageToDataUrl,
  type BookshelfItem,
  type StoredLibraryItem,
} from "../bridge/tauriBridge";
import "../styles-manga.css";

interface MangaPurchasedPageProps {
  onOpenComic: (comicId: number) => void;
}

function getRemoteCoverUrl(item: BookshelfItem): string {
  const cover = item.vertical_cover || "";
  return cover.startsWith("//") ? "https:" + cover : cover;
}

function RemoteCover({ item }: { item: BookshelfItem }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cover = getRemoteCoverUrl(item);
    setSource("");
    setFailed(false);

    if (!cover) {
      setFailed(true);
      return;
    }

    proxyImageToDataUrl(cover)
      .then((dataUrl) => {
        if (!cancelled) setSource(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [item.comic_id, item.vertical_cover]);

  if (source) return <img src={source} alt={item.title} loading="lazy" />;
  if (failed) return <div className="cover-fallback">{item.title}</div>;
  return <div className="cover-loading" aria-label="封面加载中" />;
}

function comicIdFromLocalItem(item: StoredLibraryItem): number | null {
  if (!item.id.startsWith("manga:")) return null;
  const id = Number(item.id.slice("manga:".length));
  return Number.isFinite(id) ? id : null;
}

export function MangaPurchasedPage({ onOpenComic }: MangaPurchasedPageProps) {
  const [remoteItems, setRemoteItems] = useState<BookshelfItem[]>([]);
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
            : "可以先从首页把漫画加入书架；登录后会同步哔哩哔哩漫画书架。"
        );
        setHasMore(false);
        return;
      }

      const stored = await getStoredCookies();
      const result = await fetchUserBookshelf(targetPage, 15, stored.raw_cookie);

      if (targetPage === 1) {
        setRemoteItems(result.items);
      } else {
        setRemoteItems((prev) => [...prev, ...result.items]);
      }

      setHasMore(result.has_more);
    } catch (err) {
      console.error("load bookshelf failed:", err);
      setNotice("官网书架暂时没有同步，本机书架仍可使用。登录过期时请重新扫码登录。");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    setRemoteItems([]);
    setPage(1);
    void loadBookshelf(1);
  };

  const localComicIds = new Set(localItems.map(comicIdFromLocalItem).filter((id): id is number => id !== null));
  const remoteOnlyItems = remoteItems.filter((item) => !localComicIds.has(item.comic_id));
  const totalCount = localItems.length + remoteOnlyItems.length;

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>书架</h2>
          <p>{totalCount > 0 ? "共 " + totalCount + " 部漫画" : "你正在看的漫画会放在这里"}</p>
        </div>
        <div className="section-actions">
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
          <p>可以从首页把漫画加入书架；登录后会同步哔哩哔哩漫画书架。</p>
        </div>
      )}

      {totalCount > 0 && (
        <>
          <div className="comic-grid">
            {localItems.map((item) => {
              const comicId = comicIdFromLocalItem(item);
              return (
                <article className="comic-card comic-card--clickable" key={item.id}>
                  <button
                    className="comic-open"
                    disabled={comicId === null}
                    onClick={() => comicId !== null && onOpenComic(comicId)}
                    type="button"
                  >
                    <div className="comic-thumb">
                      <div className="cover-fallback">{item.title}</div>
                      <span className="comic-status">本机</span>
                    </div>
                    <h3 className="comic-title">{item.title}</h3>
                    <p className="comic-meta">{item.tags.length > 0 ? item.tags.join(" · ") : "本机书架"}</p>
                  </button>
                </article>
              );
            })}

            {remoteOnlyItems.map((item) => (
              <article className="comic-card comic-card--clickable" key={item.comic_id}>
                <button className="comic-open" type="button" onClick={() => onOpenComic(item.comic_id)}>
                  <div className="comic-thumb">
                    <RemoteCover item={item} />
                    <span className="comic-status">书架</span>
                  </div>
                  <h3 className="comic-title">{item.title}</h3>
                  <p className="comic-meta">
                    {item.last_short_title || (item.last_ord ? "第 " + item.last_ord + " 话" : item.styles?.join(" · ") || "官网书架")}
                  </p>
                </button>
              </article>
            ))}
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
