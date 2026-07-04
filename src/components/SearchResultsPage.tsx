import { useEffect, useState } from "react";
import { proxyImageToDataUrl, searchComics, type ClassPageComic } from "../bridge/tauriBridge";

interface SearchResultsPageProps {
  keyword: string;
  onOpenComic: (comicId: number) => void;
}

function getCoverUrl(comic: ClassPageComic): string {
  if (!comic.vertical_cover) {
    return "";
  }
  return comic.vertical_cover.startsWith("//") ? "https:" + comic.vertical_cover : comic.vertical_cover;
}

function SearchResultCover({ comic }: { comic: ClassPageComic }) {
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
        if (!cancelled) setSource(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [comic.id, comic.vertical_cover]);

  if (source) return <img src={source} alt={comic.title} loading="lazy" />;
  if (failed) return <div className="cover-fallback">{comic.title}</div>;
  return <div className="cover-loading" aria-label="封面加载中" />;
}

export function SearchResultsPage({ keyword, onOpenComic }: SearchResultsPageProps) {
  const [comics, setComics] = useState<ClassPageComic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalized = keyword.trim();
    if (!normalized) {
      setComics([]);
      return;
    }

    setLoading(true);
    setError(null);
    searchComics(normalized, 40)
      .then((result) => setComics(result.comics))
      .catch((err) => {
        console.error("search comics failed:", err);
        setComics([]);
        setError("搜索暂时没有加载出来，请稍后重试。");
      })
      .finally(() => setLoading(false));
  }, [keyword]);

  return (
    <section className="feed-page">
      <div className="section-header">
        <div>
          <h2>搜索</h2>
          <p>{keyword ? "“" + keyword + "” 的结果" : "输入关键词搜索漫画"}</p>
        </div>
      </div>

      {error && <div className="notice notice--error">{error}</div>}
      {loading && <div className="notice">正在搜索</div>}

      {!loading && comics.length > 0 && (
        <div className="comic-grid">
          {comics.map((comic) => (
            <article className="comic-card comic-card--clickable" key={comic.id}>
              <button className="comic-open" type="button" onClick={() => onOpenComic(comic.id)}>
                <div className="comic-thumb">
                  <SearchResultCover comic={comic} />
                  <span className="comic-status">{comic.is_finish === 1 ? "完结" : "连载"}</span>
                </div>
                <h3 className="comic-title">{comic.title}</h3>
                <p className="comic-meta">{comic.styles.join(" · ") || "公开详情"}</p>
              </button>
            </article>
          ))}
        </div>
      )}

      {!loading && keyword && comics.length === 0 && (
        <div className="state-page state-page--inline">
          <h2>没有搜索结果</h2>
          <p>当前应用内公开索引没有找到匹配漫画。</p>
        </div>
      )}
    </section>
  );
}
