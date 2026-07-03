import { useState, useEffect } from "react";
import {
  fetchPurchasedComics,
  getStoredCookies,
  hasStoredCookies,
  type PurchasedComic,
} from "../bridge/tauriBridge";

interface PurchasedComicsPageProps {
  onClose?: () => void;
}

export function PurchasedComicsPage({ onClose }: PurchasedComicsPageProps) {
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
      // Check if cookies are stored
      const hasCookies = await hasStoredCookies();
      if (!hasCookies) {
        setError("未找到保存的 Cookie，请先在测试面板中保存");
        setLoading(false);
        return;
      }

      // Get stored cookies
      const stored = await getStoredCookies();

      // Fetch purchased comics
      const result = await fetchPurchasedComics(page, 15, stored.raw_cookie);

      if (page === 1) {
        setComics(result.items);
      } else {
        setComics((prev) => [...prev, ...result.items]);
      }

      // Check if there are more pages
      setHasMore(result.items.length === 15);
    } catch (err) {
      setError(`加载失败: ${err}`);
      console.error("Load purchased comics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setComics([]);
    setHasMore(true);
    loadPurchasedComics();
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}>
        <div>
          <h2 style={{ margin: 0 }}>📚 我的已购漫画</h2>
          <p style={{ margin: "5px 0", color: "#666" }}>
            共 {comics.length} 部漫画
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            刷新
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#666",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ✕ 关闭
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "12px",
          backgroundColor: "#fff2e8",
          border: "1px solid #ffbb96",
          borderRadius: "4px",
          marginBottom: "20px",
          color: "#d4380d",
        }}>
          <strong>❌ 错误:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {loading && comics.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#999",
        }}>
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏳</div>
          <div>加载中...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && comics.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "40px",
          color: "#999",
        }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📭</div>
          <div>暂无已购漫画</div>
          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            在官方网站购买漫画后，这里会显示你的已购列表
          </p>
        </div>
      )}

      {/* Comics Grid */}
      {comics.length > 0 && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}>
            {comics.map((comic) => (
              <div
                key={comic.comic_id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  backgroundColor: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Cover Image */}
                {comic.vcover && (
                  <img
                    src={comic.vcover}
                    alt={comic.comic_title}
                    style={{
                      width: "100%",
                      height: "280px",
                      objectFit: "cover",
                      backgroundColor: "#f5f5f5",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}

                {/* Info */}
                <div style={{ padding: "12px" }}>
                  <h3 style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    fontWeight: "600",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {comic.comic_title}
                  </h3>

                  <div style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}>
                    已购章节: <strong>{comic.bought_ep_count ?? 0}</strong>
                  </div>

                  {comic.last_short_title && (
                    <div style={{
                      fontSize: "12px",
                      color: "#999",
                    }}>
                      最新: {comic.last_short_title}
                    </div>
                  )}

                  {comic.enable_auto_pay && (
                    <div style={{
                      marginTop: "8px",
                      padding: "4px 8px",
                      backgroundColor: "#e6f7ff",
                      border: "1px solid #91d5ff",
                      borderRadius: "4px",
                      fontSize: "11px",
                      color: "#0050b3",
                    }}>
                      已开启已购
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={handleLoadMore}
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  backgroundColor: loading ? "#d9d9d9" : "#52c41a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                {loading ? "加载中..." : "加载更多"}
              </button>
            </div>
          )}

          {/* End Message */}
          {!hasMore && (
            <div style={{
              textAlign: "center",
              padding: "20px",
              color: "#999",
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
