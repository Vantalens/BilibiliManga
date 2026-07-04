import { useEffect, useState } from "react";
import { fetchClassPage, listStoredLibraryItems, upsertStoredLibraryItem, type ClassPageComic } from "../bridge/tauriBridge";
import { createLibraryItemFromClassPageComic } from "../domain/bookshelf";
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
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadComics();
    void loadSavedBookshelfIds();
  }, []);

  const loadSavedBookshelfIds = async () => {
    try {
      const items = await listStoredLibraryItems();
      const ids = items
        .map((item) => (item.id.startsWith("manga:") ? Number(item.id.slice("manga:".length)) : NaN))
        .filter(Number.isFinite);
      setSavedIds(new Set(ids));
    } catch (err) {
      console.error("load saved bookshelf ids failed:", err);
    }
  };

  const loadComics = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClassPage(-1, 1, 30);
      setComics(result.comics);
    } catch (err) {
      console.error("ClassPage API failed:", err);
      setComics([]);
      setError("公开漫画列表暂时没有加载出来。当前只显示已同步的内容。");
    } finally {
      setLoading(false);
    }
  };

  const saveToBookshelf = async (comic: ClassPageComic) => {
    try {
      await upsertStoredLibraryItem(createLibraryItemFromClassPageComic(comic));
      setSavedIds((current) => new Set(current).add(comic.id));
      setSaveMessage("已加入书架");
      window.setTimeout(() => setSaveMessage(null), 1600);
    } catch (err) {
      console.error("save bookshelf item failed:", err);
      setError("暂时无法加入书架，请稍后再试。");
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
      {saveMessage && <div className="notice">{saveMessage}</div>}

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
                <button
                  className="card-action"
                  onClick={() => void saveToBookshelf(comic)}
                  disabled={savedIds.has(comic.id)}
                  type="button"
                >
                  {savedIds.has(comic.id) ? "已在书架" : "加入书架"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {!loading && comics.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>没有可展示的漫画</h2>
          <p>当前只展示已同步的内容和本机书架数据。</p>
        </div>
      )}
    </section>
  );
}
