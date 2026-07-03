import { useState, useEffect } from "react";
import { fetchClassPage, type ClassPageComic } from "../bridge/tauriBridge";
import "../styles-manga.css";

interface Comic {
  id: number;
  title: string;
  cover: string;
  author?: string;
  tags?: string[];
  latest?: string;
  badge?: string;
}

export function MangaHomePage() {
  const [activeCategory, setActiveCategory] = useState("推荐");
  const [comics, setComics] = useState<ClassPageComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 示例数据 - 稍后将接入真实 API
  const categories = ["推荐", "热血", "古风", "玄幻", "恋爱", "悬疑", "都市", "校园"];

  useEffect(() => {
    loadComics();
  }, []);

  const loadComics = async () => {
    setLoading(true);
    setError(null);
    try {
      // styleId: -1 表示全部分类（推荐）
      const result = await fetchClassPage(-1, 1, 18);
      setComics(result.comics);
    } catch (err) {
      setError(`加载失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manga-home">
      {/* 主内容 */}
      <main className="main-content">
        {/* 横幅 */}
        <div className="hero-banner">
          <div className="banner-overlay">
            <h2 className="banner-title">间谍过家家</h2>
            <p className="banner-desc">为了完成任务，间谍、杀手、超能力者组成了临时家庭</p>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <div
              key={cat}
              className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </div>
          ))}
        </div>

        {/* 漫画网格 */}
        {loading && (
          <div className="loading-state">
            <div className="loading-icon">⏳</div>
            <div>加载中...</div>
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        {!loading && !error && comics.length > 0 && (
          <div className="comics-grid">
            {comics.map((comic) => (
              <div key={comic.id} className="comic-card">
                <div className="comic-cover">
                  {comic.vertical_cover ? (
                    <img src={comic.vertical_cover} alt={comic.title} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #fb7299 0%, #00a1d6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      {comic.title}
                    </div>
                  )}
                  {comic.is_finish === 1 && (
                    <div className="comic-badge">完结</div>
                  )}
                </div>
                <div className="comic-title">{comic.title}</div>
                <div className="comic-meta">
                  {comic.last_short_title || `${comic.last_ord}话`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 加载更多 */}
        <div className="load-more">
          <button className="load-more-btn">加载更多</button>
        </div>
      </main>
    </div>
  );
}
