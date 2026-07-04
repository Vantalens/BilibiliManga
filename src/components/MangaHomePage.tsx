import { useEffect, useState } from "react";
import {
  fetchClassPage,
  listStoredLibraryItems,
  openOfficialComicPage,
  proxyImageToDataUrl,
  upsertStoredLibraryItem,
  type ClassPageComic,
} from "../bridge/tauriBridge";
import { createLibraryItemFromClassPageComic } from "../domain/bookshelf";
import "../styles-manga.css";

const categories = [
  { name: "推荐", styleId: -1 },
  { name: "热血", styleId: 999 },
  { name: "古风", styleId: 997 },
  { name: "玄幻", styleId: 1016 },
  { name: "恋爱", styleId: 995 },
  { name: "悬疑", styleId: 1023 },
  { name: "都市", styleId: 1002 },
  { name: "校园", styleId: 1001 },
];

function getCoverUrl(comic: ClassPageComic): string {
  if (!comic.vertical_cover) {
    return "";
  }
  return comic.vertical_cover.startsWith("//") ? "https:" + comic.vertical_cover : comic.vertical_cover;
}

function ComicCover({ comic }: { comic: ClassPageComic }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cover = getCoverUrl(comic);
    setSource("");
    setFailed(false);

    if (!cover) {
      setFailed(true);
      return;
    }

    proxyImageToDataUrl(cover)
      .then((dataUrl) => {
        if (!cancelled) {
          setSource(dataUrl);
        }
      })
      .catch((err) => {
        console.error("cover proxy failed:", err);
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [comic.id, comic.vertical_cover]);

  if (source) {
    return <img src={source} alt={comic.title} loading="lazy" />;
  }

  if (failed) {
    return <div className="cover-fallback">{comic.title}</div>;
  }

  return <div className="cover-loading" aria-label="封面加载中" />;
}

export function MangaHomePage() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [comics, setComics] = useState<ClassPageComic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadComics(activeCategory.styleId);
  }, [activeCategory.styleId]);

  useEffect(() => {
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

  const loadComics = async (styleId = activeCategory.styleId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchClassPage(styleId, 1, 30);
      setComics(result.comics);
    } catch (err) {
      console.error("ClassPage API failed:", err);
      setComics([]);
      setError("公开漫画列表暂时没有加载出来，请稍后刷新。");
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

  const openComic = async (comic: ClassPageComic) => {
    try {
      await openOfficialComicPage(comic.id);
    } catch (err) {
      console.error("open comic failed:", err);
      setError("暂时无法打开漫画详情，请稍后再试。");
    }
  };

  return (
    <section className="feed-page">
      <div className="feed-toolbar">
        <div className="feed-tabs" aria-label="漫画分类">
          {categories.map((category) => (
            <button
              key={category.name}
              className={"feed-tab " + (activeCategory.name === category.name ? "feed-tab--active" : "")}
              onClick={() => setActiveCategory(category)}
              disabled={loading && activeCategory.name === category.name}
              type="button"
            >
              {category.name}
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
          {comics.map((comic) => (
            <article className="comic-card comic-card--clickable" key={comic.id}>
              <button className="comic-open" onClick={() => void openComic(comic)} type="button" aria-label={"打开 " + comic.title}>
                <div className="comic-thumb">
                  <ComicCover comic={comic} />
                  <span className="comic-status">{comic.is_finish === 1 ? "完结" : "连载"}</span>
                </div>
                <h3 className="comic-title">{comic.title}</h3>
                <p className="comic-meta">
                  {comic.last_short_title || (comic.last_ord ? "第 " + comic.last_ord + " 话" : "公开详情")}
                </p>
              </button>
              <button
                className="card-action"
                onClick={() => void saveToBookshelf(comic)}
                disabled={savedIds.has(comic.id)}
                type="button"
              >
                {savedIds.has(comic.id) ? "已在书架" : "加入书架"}
              </button>
            </article>
          ))}
        </div>
      )}

      {!loading && comics.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>没有可展示的漫画</h2>
          <p>当前分类暂时没有加载到内容。</p>
        </div>
      )}
    </section>
  );
}
