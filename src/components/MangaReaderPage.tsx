import { useEffect, useState } from "react";
import {
  fetchEpisodeImages,
  getStoredCookies,
  proxyImageToDataUrl,
  upsertStoredReadingProgress,
  type ComicDetailResult,
  type ComicEpisode,
} from "../bridge/tauriBridge";

interface MangaReaderPageProps {
  detail: ComicDetailResult;
  episode: ComicEpisode;
  onBack: () => void;
}

function ReaderImage({ url, title }: { url: string; title: string }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    proxyImageToDataUrl(url)
      .then((dataUrl) => {
        if (!cancelled) setSource(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (source) return <img src={source} alt={title} />;
  if (failed) return <div className="reader-image-fallback">图片加载失败</div>;
  return <div className="reader-image-fallback">正在加载</div>;
}

export function MangaReaderPage({ detail, episode, onBack }: MangaReaderPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (episode.is_locked && !episode.is_in_free) {
      setImages([]);
      setError("该章节未解锁，应用内不会获取章节图片。");
      return;
    }

    setLoading(true);
    setError(null);
    getStoredCookies()
      .then((stored) => fetchEpisodeImages(episode.id, stored.raw_cookie))
      .catch(() => fetchEpisodeImages(episode.id))
      .then((result) => {
        setImages(result.images);
        return upsertStoredReadingProgress({
          id: "manga:" + detail.id + ":episode:" + episode.id,
          manga_id: String(detail.id),
          chapter_id: String(episode.id),
          page_index: 0,
          mode: "scroll",
          updated_at: Date.now(),
        });
      })
      .catch((err) => {
        console.error("fetch episode images failed:", err);
        setImages([]);
        setError("章节图片接口暂时没有通过官方校验，无法在应用内阅读这一话。");
      })
      .finally(() => setLoading(false));
  }, [detail.id, episode.id, episode.is_in_free, episode.is_locked]);

  return (
    <section className="reader-page-native">
      <div className="reader-toolbar">
        <button className="ghost-button" type="button" onClick={onBack}>返回详情</button>
        <div>
          <h2>{detail.title}</h2>
          <p>{episode.short_title || "第 " + episode.ord + " 话"} · {episode.title}</p>
        </div>
      </div>

      {loading && <div className="notice">正在加载章节图片</div>}
      {error && <div className="notice notice--error">{error}</div>}

      {images.length > 0 && (
        <div className="reader-strip">
          {images.map((image, index) => (
            <ReaderImage key={image} url={image} title={episode.title + " 第 " + (index + 1) + " 页"} />
          ))}
        </div>
      )}
    </section>
  );
}
