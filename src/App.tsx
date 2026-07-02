import { useEffect, useMemo, useState } from "react";
import {
  clearImageCache,
  getStorageSecurityStatus,
  initializeSecureStorage,
  openOfficialMangaPage,
  type StorageSecurityStatus
} from "./bridge/tauriBridge";
import { filterLibraryItems, summarizeLibrary } from "./domain/library";
import { getNextPageIndex, getPreviousPageIndex } from "./domain/reader";
import { sampleLibraryItems, sampleReaderPages } from "./sampleData";
import "./styles.css";

type ReaderMode = "scroll" | "page";

export default function App() {
  const [query, setQuery] = useState("");
  const [readerMode, setReaderMode] = useState<ReaderMode>("scroll");
  const [pageIndex, setPageIndex] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageSecurityStatus | null>(null);
  const [systemMessage, setSystemMessage] = useState("安全存储尚未初始化");

  const filteredItems = useMemo(
    () => filterLibraryItems(sampleLibraryItems, { query }),
    [query]
  );
  const summary = useMemo(() => summarizeLibrary(sampleLibraryItems), []);

  useEffect(() => {
    getStorageSecurityStatus()
      .then((status) => setStorageStatus(status))
      .catch(() => setSystemMessage("当前运行环境无法读取 Tauri 安全状态"));
  }, []);

  async function initializeStorage() {
    try {
      const status = await initializeSecureStorage();
      setStorageStatus(status);
      setSystemMessage("系统密钥环已准备数据库密钥");
    } catch (error) {
      setSystemMessage(`安全存储初始化失败：${String(error)}`);
    }
  }

  async function clearCache() {
    try {
      const result = await clearImageCache();
      setSystemMessage(`已清理 ${result.removed_bytes} 字节短期图片缓存`);
    } catch (error) {
      setSystemMessage(`缓存清理失败：${String(error)}`);
    }
  }

  const currentPage = sampleReaderPages[pageIndex];

  return (
    <main className={immersive ? "app app--immersive" : "app"}>
      {!immersive && (
        <aside className="sidebar">
          <div className="brand">
            <span className="brand__mark">BM</span>
            <div>
              <h1>BiliManga</h1>
              <p>Windows MVP</p>
            </div>
          </div>
          <nav className="nav" aria-label="主导航">
            <button className="nav__item nav__item--active">书库</button>
            <button className="nav__item">搜索</button>
            <button className="nav__item">设置</button>
          </nav>
          <section className="status-panel" aria-label="本地状态">
            <span>缓存策略</span>
            <strong>{storageStatus?.cache_policy ?? "短期缓存 · 不可导出"}</strong>
            <span>数据保护</span>
            <strong>{storageStatus?.database_key_source ?? "系统密钥环计划中"}</strong>
          </section>
        </aside>
      )}

      <section className="workspace">
        {!immersive && (
          <header className="toolbar">
            <div>
              <p className="eyebrow">阅读闭环基线</p>
              <h2>书库与阅读器</h2>
            </div>
            <div className="toolbar__actions">
              <button onClick={() => setReaderMode("scroll")} className={readerMode === "scroll" ? "active" : ""}>
                长滚动
              </button>
              <button onClick={() => setReaderMode("page")} className={readerMode === "page" ? "active" : ""}>
                分页
              </button>
              <button onClick={initializeStorage}>初始化安全存储</button>
              <button onClick={clearCache}>清理缓存</button>
              <button onClick={() => setImmersive(true)}>全屏阅读</button>
            </div>
          </header>
        )}

        <div className="content-grid">
          {!immersive && (
            <section className="library-pane" aria-label="本地书库">
              <div className="summary-grid">
                <Metric label="作品" value={summary.totalItems} />
                <Metric label="未读作品" value={summary.unreadItems} />
                <Metric label="未读章节" value={summary.unreadChapters} />
                <Metric label="平均评分" value={summary.averageRating.toFixed(1)} />
              </div>
              <p className="system-message">{systemMessage}</p>
              <label className="search">
                <span>筛选书库</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标题关键词" />
              </label>
              <div className="library-list">
                {filteredItems.map((item) => (
                  <article key={item.id} className="library-item">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.groups.join(" / ")} · {item.tags.join(" / ")}</p>
                    </div>
                    <strong>{item.rating} 分</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="reader-pane" aria-label="阅读器">
            <div className="reader-header">
              <div>
                <p className="eyebrow">示例章节</p>
                <h2>星海回声 · 第 12 话</h2>
              </div>
              <div className="reader-header__actions">
                <button onClick={openOfficialMangaPage}>官方网页处理未解锁</button>
                {immersive && <button onClick={() => setImmersive(false)}>显示 UI</button>}
              </div>
            </div>

            {readerMode === "scroll" ? (
              <div className="scroll-reader">
                {sampleReaderPages.map((page) => (
                  <ReaderPage key={page.id} label={page.label} tone={page.tone} />
                ))}
              </div>
            ) : (
              <div className="page-reader">
                <ReaderPage label={currentPage.label} tone={currentPage.tone} />
                <div className="pager">
                  <button onClick={() => setPageIndex(getPreviousPageIndex({ pageIndex, totalPages: sampleReaderPages.length }))}>
                    上一页
                  </button>
                  <span>{pageIndex + 1} / {sampleReaderPages.length}</span>
                  <button onClick={() => setPageIndex(getNextPageIndex({ pageIndex, totalPages: sampleReaderPages.length }))}>
                    下一页
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReaderPage({ label, tone }: { label: string; tone: string }) {
  return (
    <article className="reader-page">
      <span>{label}</span>
      <strong>{tone}</strong>
      <p>这里使用本地示例块验证阅读器布局。真实章节图片必须等待接口调研和权限边界确认后接入。</p>
    </article>
  );
}