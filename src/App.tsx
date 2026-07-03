import { useEffect, useMemo, useState } from "react";
import {
  clearImageCache,
  getImageCacheStatus,
  getSearchSuggestions,
  getStorageSecurityStatus,
  getStoredReaderPreferences,
  getStoredReadingProgress,
  initializeSecureStorage,
  listStoredLibraryItems,
  openOfficialMangaPage,
  openOfficialSearchPage,
  pruneImageCache,
  upsertStoredLibraryItem,
  upsertStoredReaderPreferences,
  upsertStoredReadingProgress,
  type CacheStatus,
  type StorageSecurityStatus,
  type StoredLibraryItem
} from "./bridge/tauriBridge";
import { decideEntitlement, refreshEntitlementAfterOfficialWeb, type EntitlementState } from "./domain/entitlement";
import { filterLibraryItems, summarizeLibrary, type LibraryItem } from "./domain/library";
import { getNextPageIndex, getPreviousPageIndex } from "./domain/reader";
import { sampleLibraryItems, sampleReaderPages } from "./sampleData";
import "./styles.css";

type ReaderMode = "scroll" | "page";

const progressId = "star-sea:chapter-12";
const readerPreferencesId = "default-reader";

export default function App() {
  const [query, setQuery] = useState("");
  const [readerMode, setReaderMode] = useState<ReaderMode>("scroll");
  const [pageIndex, setPageIndex] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageSecurityStatus | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [systemMessage, setSystemMessage] = useState("安全存储尚未初始化");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState("官方搜索建议尚未请求");
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(sampleLibraryItems);
  const [entitlementState, setEntitlementState] = useState<EntitlementState>("accessible");
  const [officialFlowPending, setOfficialFlowPending] = useState(false);

  const filteredItems = useMemo(
    () => filterLibraryItems(libraryItems, { query }),
    [libraryItems, query]
  );
  const summary = useMemo(() => summarizeLibrary(libraryItems), [libraryItems]);
  const entitlementDecision = useMemo(() => decideEntitlement(entitlementState), [entitlementState]);

  useEffect(() => {
    getStorageSecurityStatus()
      .then((status) => setStorageStatus(status))
      .catch(() => setSystemMessage("当前运行环境无法读取 Tauri 安全状态，正在使用前端示例数据"));
  }, []);

  async function initializeStorage() {
    try {
      const status = await initializeSecureStorage();
      setStorageStatus(status);
      await seedSampleLibrary();
      await loadPersistedLibrary();
      const progress = await getStoredReadingProgress(progressId);
      if (progress) {
        setPageIndex(progress.page_index);
        setReaderMode(progress.mode);
      }
      const preferences = await getStoredReaderPreferences(readerPreferencesId);
      if (preferences) {
        setReaderMode(preferences.mode);
        setImmersive(preferences.immersive);
      }
      await refreshCacheStatus();
      setSystemMessage("SQLCipher 数据库已初始化，书库、阅读进度、阅读偏好和缓存索引将写入本地加密存储");
    } catch (error) {
      setSystemMessage(`安全存储初始化失败：${String(error)}`);
    }
  }

  async function seedSampleLibrary() {
    const now = Date.now();
    for (const item of sampleLibraryItems) {
      const stored: StoredLibraryItem = {
        id: item.id,
        title: item.title,
        groups: item.groups,
        tags: item.tags,
        rating: item.rating,
        notes: item.notes,
        unread_chapters: item.unreadChapters,
        created_at: now,
        updated_at: now
      };
      await upsertStoredLibraryItem(stored);
    }
  }

  async function loadPersistedLibrary() {
    const stored = await listStoredLibraryItems();
    if (stored.length === 0) {
      return;
    }

    setLibraryItems(
      stored.map((item) => ({
        id: item.id,
        title: item.title,
        rating: item.rating,
        groups: item.groups,
        tags: item.tags,
        notes: item.notes,
        unreadChapters: item.unread_chapters
      }))
    );
  }

  async function refreshCacheStatus() {
    try {
      const status = await getImageCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      setSystemMessage(`缓存状态读取失败：${String(error)}`);
    }
  }

  async function pruneCache() {
    try {
      const result = await pruneImageCache();
      await refreshCacheStatus();
      setSystemMessage(
        `已按过期和容量策略清理 ${result.removed_entries} 条缓存索引，释放 ${formatBytes(result.removed_bytes)}`
      );
    } catch (error) {
      setSystemMessage(`缓存策略清理失败：${String(error)}`);
    }
  }

  async function clearCache() {
    try {
      const result = await clearImageCache();
      await refreshCacheStatus();
      setSystemMessage(`已清理 ${formatBytes(result.removed_bytes)} 短期图片缓存并清空缓存索引`);
    } catch (error) {
      setSystemMessage(`缓存清理失败：${String(error)}`);
    }
  }

  async function requestSearchSuggestions() {
    const term = query.trim();
    if (!term) {
      setSearchSuggestions([]);
      setSuggestionStatus("输入关键词后可请求官方搜索建议");
      return;
    }

    try {
      setSuggestionStatus("正在请求官方搜索建议");
      const result = await getSearchSuggestions(term, 8);
      setSearchSuggestions(result.suggestions);
      setSuggestionStatus(
        result.suggestions.length > 0
          ? "已通过受控 Tauri bridge 获取官方搜索建议"
          : "官方搜索建议为空，可改用官方搜索页"
      );
    } catch (error) {
      setSearchSuggestions([]);
      setSuggestionStatus(`搜索建议失败，保留本地筛选并可使用官方搜索页：${String(error)}`);
    }
  }

  async function persistProgress(nextPageIndex: number, nextMode: ReaderMode) {
    try {
      await upsertStoredReadingProgress({
        id: progressId,
        manga_id: "star-sea",
        chapter_id: "chapter-12",
        page_index: nextPageIndex,
        mode: nextMode,
        updated_at: Date.now()
      });
      setSystemMessage(`阅读进度已写入 SQLCipher：${nextMode} ${nextPageIndex + 1}/${sampleReaderPages.length}`);
    } catch {
      setSystemMessage("当前未连接本地加密数据库，阅读进度仅保留在本次界面状态中");
    }
  }

  async function persistReaderPreferences(nextMode: ReaderMode, nextImmersive: boolean) {
    try {
      await upsertStoredReaderPreferences({
        id: readerPreferencesId,
        mode: nextMode,
        immersive: nextImmersive,
        updated_at: Date.now()
      });
      setSystemMessage(`阅读偏好已写入 SQLCipher：${nextMode} · ${nextImmersive ? "沉浸" : "标准"}`);
    } catch {
      setSystemMessage("当前未连接本地加密数据库，阅读偏好仅保留在本次界面状态中");
    }
  }

  function changeReaderMode(nextMode: ReaderMode) {
    setReaderMode(nextMode);
    void persistProgress(pageIndex, nextMode);
    void persistReaderPreferences(nextMode, immersive);
  }

  function changeImmersive(nextImmersive: boolean) {
    setImmersive(nextImmersive);
    void persistReaderPreferences(readerMode, nextImmersive);
  }

  function goToPage(nextPageIndex: number) {
    setPageIndex(nextPageIndex);
    void persistProgress(nextPageIndex, readerMode);
  }

  async function openOfficialEntitlementFlow() {
    setOfficialFlowPending(true);
    setSystemMessage("已打开官方网页处理权益状态，返回后请刷新状态");
    await openOfficialMangaPage();
  }

  function refreshEntitlement(observedState: EntitlementState) {
    const result = refreshEntitlementAfterOfficialWeb(entitlementState, observedState);
    setEntitlementState(result.state);
    setOfficialFlowPending(false);
    setSystemMessage(result.message);
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
              <button onClick={() => changeReaderMode("scroll")} className={readerMode === "scroll" ? "active" : ""}>
                长滚动
              </button>
              <button onClick={() => changeReaderMode("page")} className={readerMode === "page" ? "active" : ""}>
                分页
              </button>
              <button onClick={initializeStorage}>初始化安全存储</button>
              <button onClick={pruneCache}>按策略清理缓存</button>
              <button onClick={clearCache}>清空缓存</button>
              <button onClick={() => setEntitlementState("locked")}>设为未解锁</button>
              <button onClick={() => refreshEntitlement("accessible")}>刷新为可访问</button>
              <button onClick={() => changeImmersive(true)}>全屏阅读</button>
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
              <div className="cache-summary" aria-label="图片缓存状态">
                <span>缓存条目：{cacheStatus?.entry_count ?? 0}</span>
                <span>过期条目：{cacheStatus?.expired_count ?? 0}</span>
                <span>
                  占用：{formatBytes(cacheStatus?.total_bytes ?? 0)} / {formatBytes(cacheStatus?.max_bytes ?? 0)}
                </span>
              </div>
              <div className="search-block">
                <label className="search">
                  <span>筛选书库 / 官方建议</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标题关键词" />
                </label>
                <div className="search-actions">
                  <button onClick={requestSearchSuggestions}>获取建议</button>
                  <button onClick={() => openOfficialSearchPage(query)}>打开官方搜索</button>
                </div>
                <p className="suggestion-status">{suggestionStatus}</p>
                {searchSuggestions.length > 0 && (
                  <div className="suggestion-list" aria-label="官方搜索建议">
                    {searchSuggestions.map((suggestion) => (
                      <button key={suggestion} onClick={() => setQuery(suggestion)}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="library-list">
                {filteredItems.map((item) => (
                  <article key={item.id} className="library-item">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.groups.join(" / ")} · {item.tags.join(" / ")}</p>
                      <p>{item.notes}</p>
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
                <button onClick={openOfficialEntitlementFlow}>官方网页处理未解锁</button>
                {immersive && <button onClick={() => changeImmersive(false)}>显示 UI</button>}
              </div>
            </div>

            {!entitlementDecision.canReadInApp ? (
              <section className="recovery-panel" aria-label="权益状态恢复">
                <strong>{entitlementDecision.message}</strong>
                <p>应用不会执行购买、支付或解锁请求。敏感流程必须在官方网页完成，返回后只刷新可访问状态。</p>
                <div className="reader-header__actions">
                  <button onClick={openOfficialEntitlementFlow}>打开官方网页</button>
                  <button onClick={() => refreshEntitlement("unknown")}>刷新状态</button>
                  <button onClick={() => refreshEntitlement("accessible")}>刷新为可访问</button>
                </div>
                {officialFlowPending && <p>官方网页已打开，等待返回后刷新状态。</p>}
              </section>
            ) : readerMode === "scroll" ? (
              <div className="scroll-reader">
                {sampleReaderPages.map((page) => (
                  <ReaderPage key={page.id} label={page.label} tone={page.tone} />
                ))}
              </div>
            ) : (
              <div className="page-reader">
                <ReaderPage label={currentPage.label} tone={currentPage.tone} />
                <div className="pager">
                  <button onClick={() => goToPage(getPreviousPageIndex({ pageIndex, totalPages: sampleReaderPages.length }))}>
                    上一页
                  </button>
                  <span>{pageIndex + 1} / {sampleReaderPages.length}</span>
                  <button onClick={() => goToPage(getNextPageIndex({ pageIndex, totalPages: sampleReaderPages.length }))}>
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

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
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
