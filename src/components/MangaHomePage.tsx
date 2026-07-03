import { useEffect, useState } from "react";
import { fetchClassPage, type ClassPageComic } from "../bridge/tauriBridge";
import "../styles-manga.css";

const categories = ["推荐", "热血", "古风", "玄幻", "恋爱", "悬疑", "都市", "校园"];

function getCoverUrl(comic: ClassPageComic): string {
  if (!comic.vertical_cover) {
    return "";
  }
  return comic.vertical_cover.startsWith("//") ? "https:" + comic.vertical_cover : comic.vertical_cover;
}

export function MangaHomePage() {
  const [activeCategory, setActiveCategory] = useState("推荐");
  const [comics, setComics] = useState<ClassPageComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadComics();
  }, []);

  const loadComics = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClassPage(-1, 1, 30);
      setComics(result.comics);
    } catch (err) {
      console.error("ClassPage API failed:", err);
      setComics([]);
      setError("公开漫画列表暂不可用。当前只显示真实接口或本地数据。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="feed-page">
      <div className="feed-toolbar">
        <div className="feed-tabs" aria-label="漫画分类">
          {categories.map((category) => (
            <button
              key={category}
              className={"feed-tab " + (activeCategory === category ? "feed-tab--active" : "")}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <button className="ghost-button" onClick={() => void loadComics()} disabled={loading} type="button">
          刷新
        </button>
      </div>

      {error && <div className="notice notice--error">{error}</div>}

      {loading && (
        <div className="comic-grid" aria-label="加载中">
          {Array.from({ length: 15 }, (_, index) => (
            <div className="comic-card comic-card--skeleton" key={index}>
              <div className="comic-thumb" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          ))}
        </div>
      )}

      {!loading && comics.length > 0 && (
        <div className="comic-grid">
          {comics.map((comic) => {
            const cover = getCoverUrl(comic);
            return (
              <article className="comic-card" key={comic.id}>
                <div className="comic-thumb">
                  {cover ? <img src={cover} alt={comic.title} loading="lazy" /> : <div className="cover-fallback">{comic.title}</div>}
                  <span className="comic-status">{comic.is_finish === 1 ? "完结" : "连载"}</span>
                </div>
                <h3 className="comic-title">{comic.title}</h3>
                <p className="comic-meta">
                  {comic.last_short_title || (comic.last_ord ? "第 " + comic.last_ord + " 话" : "公开详情")}
                </p>
              </article>
            );
          })}
        </div>
      )}

      {!loading && comics.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>没有可展示的漫画</h2>
          <p>当前只展示真实接口返回或本地书库数据。</p>
        </div>
      )}
    </section>
  );
}
