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

  // 示例漫画数据作为占位
  const placeholderComics = [
    { id: 1, title: "间谍过家家", latest: "更新至82话" },
    { id: 2, title: "鬼灭之刃", latest: "完结" },
    { id: 3, title: "一拳超人", latest: "更新至230话" },
    { id: 4, title: "咒术回战", latest: "更新至245话" },
    { id: 5, title: "链锯人", latest: "更新至150话" },
    { id: 6, title: "海贼王", latest: "更新至1100话" },
    { id: 7, title: "进击的巨人", latest: "完结" },
    { id: 8, title: "东京喰种", latest: "完结" },
    { id: 9, title: "死神", latest: "完结" },
    { id: 10, title: "火影忍者", latest: "完结" },
    { id: 11, title: "全职猎人", latest: "更新至400话" },
    { id: 12, title: "银魂", latest: "完结" },
  ];

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
      console.error("ClassPage API failed:", err);
      setError("ClassPage 接口暂不可用，显示示例数据");
      // 失败时不设置 comics，使用占位数据
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
          <div className="error-message">
            {error}
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              提示：点击"我的已购"查看真实数据，或等待首页接口修复
            </div>
          </div>
        )}

        {!loading && (
          <div className="comics-grid">
            {(comics.length > 0 ? comics : placeholderComics.map((c, i) => ({
              id: c.id,
              title: c.title,
              vertical_cover: '',
              author_name: [],
              styles: [],
              is_finish: c.latest.includes('完结') ? 1 : 0,
              last_ord: 0,
              last_short_title: c.latest
            }))).map((comic) => (
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
