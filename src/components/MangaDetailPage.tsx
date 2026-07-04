import { useEffect, useState } from "react";
import { fetchComicDetail, proxyImageToDataUrl, type ComicDetailResult, type ComicEpisode } from "../bridge/tauriBridge";

interface MangaDetailPageProps {
  comicId: number;
  onBack: () => void;
  onReadEpisode: (detail: ComicDetailResult, episode: ComicEpisode) => void;
}

function DetailCover({ url, title }: { url: string; title: string }) {
  const [source, setSource] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setSource("");
      return;
    }
    proxyImageToDataUrl(url)
      .then((dataUrl) => {
        if (!cancelled) setSource(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setSource("");
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return source ? <img src={source} alt={title} /> : <div className="cover-fallback">{title}</div>;
}

export function MangaDetailPage({ comicId, onBack, onReadEpisode }: MangaDetailPageProps) {
  const [detail, setDetail] = useState<ComicDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchComicDetail(comicId)
      .then(setDetail)
      .catch((err) => {
        console.error("fetch comic detail failed:", err);
        setError("漫画详情暂时没有加载出来，请稍后重试。");
      })
      .finally(() => setLoading(false));
  }, [comicId]);

  if (loading) {
    return <div className="notice">正在加载漫画详情</div>;
  }

  if (error || !detail) {
    return (
      <section className="state-page state-page--inline">
        <h2>详情加载失败</h2>
        <p>{error || "没有可展示的详情。"}</p>
        <button className="ghost-button" type="button" onClick={onBack}>返回</button>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <button className="ghost-button" type="button" onClick={onBack}>返回</button>
      <div className="detail-hero">
        <div className="detail-cover">
          <DetailCover url={detail.vertical_cover} title={detail.title} />
        </div>
        <div className="detail-info">
          <h2>{detail.title}</h2>
          <p className="detail-meta">{detail.author_name.join(" · ") || "未知作者"}</p>
          <p className="detail-meta">{detail.styles.join(" · ") || "未分类"} · {detail.is_finish === 1 ? "完结" : "连载"} · {detail.total} 话</p>
          <p className="detail-desc">{detail.evaluate || "暂无简介"}</p>
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2>章节</h2>
          <p>免费或已解锁章节可尝试在应用内阅读；锁定章节不会获取图片。</p>
        </div>
      </div>

      <div className="episode-list">
        {detail.episodes.map((episode) => (
          <button
            key={episode.id}
            className="episode-item"
            type="button"
            onClick={() => onReadEpisode(detail, episode)}
          >
            <span>{episode.short_title || "第 " + episode.ord + " 话"}</span>
            <strong>{episode.title || "未命名章节"}</strong>
            <em>{episode.is_locked && !episode.is_in_free ? "锁定" : "可读"}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
