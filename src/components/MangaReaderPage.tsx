import { useEffect, useMemo, useState } from "react";
import {
  fetchEpisodeImages,
  getStoredCookies,
  getStoredReaderPreferences,
  proxyImageToDataUrl,
  upsertStoredReaderPreferences,
  upsertStoredReadingProgress,
  type ComicDetailResult,
  type ComicEpisode,
} from "../bridge/tauriBridge";
import { applyReaderAction, clampProgress, type ReaderMode, type ReaderViewState } from "../domain/reader";
import { formatApiFailure } from "../domain/apiErrors";

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
    setSource("");
    setFailed(false);
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

function progressId(detailId: number, episodeId: number): string {
  return "manga:" + detailId + ":episode:" + episodeId;
}

export function MangaReaderPage({ detail, episode, onBack }: MangaReaderPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [view, setView] = useState<ReaderViewState>({
    mode: "scroll",
    immersive: false,
    pageIndex: 0,
    totalPages: 0,
  });

  const readerPreferenceId = "reader:default";
  const currentPage = useMemo(() => images[view.pageIndex] || "", [images, view.pageIndex]);

  useEffect(() => {
    getStoredReaderPreferences(readerPreferenceId)
      .then((preferences) => {
        if (!preferences) return;
        setView((current) => ({
          ...current,
          mode: preferences.mode,
          immersive: preferences.immersive,
        }));
      })
      .catch(() => undefined)
      .finally(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (episode.is_locked && !episode.is_in_free) {
      setImages([]);
      setError("该章节未解锁，应用内不会获取章节图片。");
      return;
    }

    setLoading(true);
    setError(null);
    getStoredCookies()
      .then((stored) => fetchEpisodeImages(detail.id, episode.id, stored.raw_cookie))
      .catch(() => fetchEpisodeImages(detail.id, episode.id))
      .then((result) => {
        setImages(result.images);
        setView((current) => ({
          ...current,
          pageIndex: clampProgress({ pageIndex: current.pageIndex, totalPages: result.images.length }),
          totalPages: result.images.length,
        }));
      })
      .catch((err) => {
        console.error("fetch episode images failed:", err);
        setImages([]);
        setView((current) => ({ ...current, pageIndex: 0, totalPages: 0 }));
        setError(formatApiFailure(err));
      })
      .finally(() => setLoading(false));
  }, [detail.id, episode.id, episode.is_in_free, episode.is_locked]);

  useEffect(() => {
    if (images.length === 0) return;
    void upsertStoredReadingProgress({
      id: progressId(detail.id, episode.id),
      manga_id: String(detail.id),
      chapter_id: String(episode.id),
      page_index: view.pageIndex,
      mode: view.mode,
      updated_at: Date.now(),
    });
  }, [detail.id, episode.id, images.length, view.mode, view.pageIndex]);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void upsertStoredReaderPreferences({
      id: readerPreferenceId,
      mode: view.mode,
      immersive: view.immersive,
      updated_at: Date.now(),
    });
  }, [preferencesLoaded, view.immersive, view.mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "Escape") {
        setView((current) => applyReaderAction(current, { type: "exit_immersive" }));
        return;
      }
      if (event.key.toLowerCase() === "f") {
        setView((current) => applyReaderAction(current, { type: "toggle_immersive" }));
        return;
      }
      if (event.key.toLowerCase() === "p") {
        setMode("page");
        return;
      }
      if (event.key.toLowerCase() === "s") {
        setMode("scroll");
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        setView((current) => applyReaderAction(current, { type: "next_page" }));
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        setView((current) => applyReaderAction(current, { type: "previous_page" }));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const setMode = (mode: ReaderMode) => {
    setView((current) => applyReaderAction(current, { type: "set_mode", mode }));
  };

  const setPage = (pageIndex: number) => {
    setView((current) => applyReaderAction(current, { type: "set_page", pageIndex }));
  };

  const className = "reader-page-native" + (view.immersive ? " reader-page-native--immersive" : "");

  return (
    <section className={className}>
      <div className="reader-toolbar">
        <button className="ghost-button" type="button" onClick={onBack}>返回详情</button>
        <div className="reader-title">
          <h2>{detail.title}</h2>
          <p>{episode.short_title || "第 " + episode.ord + " 话"} · {episode.title}</p>
        </div>
        <div className="reader-controls" aria-label="阅读控制">
          <button className={view.mode === "scroll" ? "control-button control-button--active" : "control-button"} type="button" onClick={() => setMode("scroll")}>长滚动</button>
          <button className={view.mode === "page" ? "control-button control-button--active" : "control-button"} type="button" onClick={() => setMode("page")}>分页</button>
          <button className="control-button" type="button" onClick={() => setView((current) => applyReaderAction(current, { type: "toggle_immersive" }))}>
            {view.immersive ? "显示 UI" : "隐藏 UI"}
          </button>
        </div>
      </div>

      {loading && <div className="notice">正在加载章节图片</div>}
      {error && <div className="notice notice--error">{error}</div>}

      {images.length > 0 && view.mode === "scroll" && (
        <div className="reader-strip">
          {images.map((image, index) => (
            <ReaderImage key={image} url={image} title={episode.title + " 第 " + (index + 1) + " 页"} />
          ))}
        </div>
      )}

      {images.length > 0 && view.mode === "page" && (
        <div className="reader-pager">
          <button className="reader-page-nav" type="button" onClick={() => setView((current) => applyReaderAction(current, { type: "previous_page" }))} disabled={view.pageIndex <= 0}>上一页</button>
          <div className="reader-page-frame">
            <ReaderImage url={currentPage} title={episode.title + " 第 " + (view.pageIndex + 1) + " 页"} />
            <div className="reader-page-count">{view.pageIndex + 1} / {images.length}</div>
          </div>
          <button className="reader-page-nav" type="button" onClick={() => setView((current) => applyReaderAction(current, { type: "next_page" }))} disabled={view.pageIndex >= images.length - 1}>下一页</button>
          <input
            aria-label="页码"
            max={images.length}
            min={1}
            onChange={(event) => setPage(Number(event.target.value) - 1)}
            type="range"
            value={view.pageIndex + 1}
          />
        </div>
      )}
    </section>
  );
}
