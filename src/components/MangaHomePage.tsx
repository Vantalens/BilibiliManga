import { useState } from "react";
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

  // 示例数据 - 稍后将接入真实 API
  const categories = ["推荐", "热血", "古风", "玄幻", "恋爱", "悬疑", "都市", "校园"];

  const featuredComics: Comic[] = [
    {
      id: 1,
      title: "间谍过家家",
      cover: "https://i0.hdslb.com/bfs/manga-static/4c4d8c38b10e68f8e8c2c5b9c9b2c6c8c9c9c9c9.jpg",
      author: "远藤达哉",
      tags: ["热血", "搞笑"],
      latest: "更新至82话",
      badge: "热门"
    },
    // 更多漫画...
  ];

  const recommendComics: Comic[] = Array(12).fill(null).map((_, i) => ({
    id: i + 100,
    title: `推荐漫画 ${i + 1}`,
    cover: `https://via.placeholder.com/200x267/FB7299/FFFFFF?text=Comic+${i + 1}`,
    latest: `${Math.floor(Math.random() * 100)}话`,
    badge: i % 3 === 0 ? "完结" : i % 3 === 1 ? "更新" : undefined
  }));

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
        <div className="comics-grid">
          {recommendComics.map((comic) => (
            <div key={comic.id} className="comic-card">
              <div className="comic-cover">
                <img
                  src={comic.cover || `https://via.placeholder.com/180x240/667eea/ffffff?text=${encodeURIComponent(comic.title)}`}
                  alt={comic.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/180x240/667eea/ffffff?text=${encodeURIComponent(comic.title)}`;
                  }}
                />
                {comic.badge && (
                  <div className="comic-badge">{comic.badge}</div>
                )}
              </div>
              <div className="comic-title">{comic.title}</div>
              <div className="comic-meta">{comic.latest}</div>
            </div>
          ))}
        </div>

        {/* 加载更多 */}
        <div className="load-more">
          <button className="load-more-btn">加载更多</button>
        </div>
      </main>
    </div>
  );
}
