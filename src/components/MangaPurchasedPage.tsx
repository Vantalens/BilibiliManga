import { useState, useEffect } from "react";
import {
  fetchPurchasedComics,
  getStoredCookies,
  hasStoredCookies,
  type PurchasedComic,
} from "../bridge/tauriBridge";
import "../styles-manga.css";

export function MangaPurchasedPage() {
  const [comics, setComics] = useState<PurchasedComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPurchasedComics();
  }, [page]);

  const loadPurchasedComics = async () => {
    setLoading(true);
    setError(null);

    try {
      const hasCookies = await hasStoredCookies();
      if (!hasCookies) {
        setError("请先登录");
        setLoading(false);
        return;
      }

      const stored = await getStoredCookies();
      const result = await fetchPurchasedComics(page, 15, stored.raw_cookie);

      if (page === 1) {
        setComics(result.items);
      } else {
        setComics((prev) => [...prev, ...result.items]);
      }

      setHasMore(result.items.length === 15);
    } catch (err) {
      setError(`${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="main-content">
      {/* 页面标题 */}
      <div className="page-header">
        <div>
          <h2 className="page-title">我的已购</h2>
          <p className="page-subtitle">共 {comics.length} 部漫画</p>
        </div>
        <button
          onClick={() => {
            setPage(1);
            setComics([]);
            loadPurchasedComics();
          }}
          disabled={loading}
          className="load-more-btn"
        >
          🔄 刷新
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* 加载状态 */}
      {loading && comics.length === 0 && (
        <div className="loading-state">
          <div className="loading-icon">⏳</div>
          <div>加载中...</div>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && comics.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">暂无已购漫画</div>
          <p className="empty-desc">
            在官方网站购买漫画后，这里会显示你的已购列表
          </p>
        </div>
      )}

      {/* 漫画网格 */}
      {comics.length > 0 && (
        <>
          <div className="comics-grid">
            {comics.map((comic) => (
              <div key={comic.comic_id} className="comic-card">
                <div className="comic-cover">
                  {comic.vcover ? (
                    <img
                      src={comic.vcover}
                      alt={comic.comic_title}
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/180x240/667eea/ffffff?text=${encodeURIComponent(comic.comic_title)}`;
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      fontSize: "12px",
                      padding: "12px",
                      textAlign: "center"
                    }}>
                      {comic.comic_title}
                    </div>
                  )}

                  {comic.enable_auto_pay && (
                    <div className="comic-badge">自动购买</div>
                  )}
                </div>

                <div className="comic-title">{comic.comic_title}</div>
                <div className="comic-meta">
                  已购 {comic.bought_ep_count ?? 0} 话
                  {comic.last_short_title && ` · 最新 ${comic.last_short_title}`}
                </div>
              </div>
            ))}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="load-more">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? "加载中..." : "加载更多"}
              </button>
            </div>
          )}

          {/* 加载完成 */}
          {!hasMore && (
            <div style={{
              textAlign: "center",
              padding: "32px",
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}>
              已加载全部漫画
            </div>
          )}
        </>
      )}
    </div>
  );
}
