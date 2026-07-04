import { FormEvent, useEffect, useState } from "react";
import { MangaHomePage } from "./components/MangaHomePage";
import { MangaPurchasedPage } from "./components/MangaPurchasedPage";
import { LoginPage } from "./components/LoginPage";
import { getSearchSuggestions, openOfficialSearchPage } from "./bridge/tauriBridge";
import { buildOfficialSearchUrl, normalizeSearchKeyword } from "./domain/search";
import "./styles-manga.css";

type ActivePage = "home" | "bookshelf" | "history" | "login";

const navItems: Array<{ id: ActivePage; label: string; icon: string }> = [
  { id: "home", label: "首页", icon: "⌂" },
  { id: "bookshelf", label: "书架", icon: "▣" },
  { id: "history", label: "历史", icon: "◷" },
  { id: "login", label: "我的", icon: "○" }
];

const topTabs: Array<{ id: ActivePage; label: string }> = [
  { id: "home", label: "推荐" },
  { id: "bookshelf", label: "书架" },
  { id: "history", label: "最近" }
];

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "failed">("idle");

  useEffect(() => {
    const normalized = normalizeSearchKeyword(searchTerm);
    if (!normalized) {
      setSuggestions([]);
      setSearchStatus("idle");
      return;
    }

    const timer = window.setTimeout(() => {
      setSearchStatus("loading");
      getSearchSuggestions(normalized, 6)
        .then((result) => {
          setSuggestions(result.suggestions);
          setSearchStatus("idle");
        })
        .catch(() => {
          setSuggestions([]);
          setSearchStatus("failed");
        });
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const openSearch = async (keyword: string) => {
    const normalized = normalizeSearchKeyword(keyword);
    if (!normalized) {
      return;
    }

    setSearchTerm(normalized);
    setSuggestions([]);
    try {
      await openOfficialSearchPage(normalized);
    } catch (error) {
      console.error("official search fallback failed:", error);
      window.open(buildOfficialSearchUrl(normalized), "_blank", "noopener,noreferrer");
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void openSearch(searchTerm);
  };

  return (
    <div className="desktop-shell">
      <aside className="side-rail" aria-label="主导航">
        <button className="side-back" aria-label="返回">‹</button>
        <div className="side-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`side-nav__item ${activePage === item.id ? "side-nav__item--active" : ""}`}
              onClick={() => setActivePage(item.id)}
              type="button"
            >
              <span className="side-nav__icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="side-tools" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </aside>

      <div className="app-surface">
        <header className="app-topbar">
          <div className="brand-wordmark">bili<span>bili</span></div>
          <nav className="top-tabs" aria-label="频道">
            {topTabs.map((item) => (
              <button
                key={item.id}
                className={`top-tab ${activePage === item.id ? "top-tab--active" : ""}`}
                onClick={() => setActivePage(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <form className="top-search" onSubmit={submitSearch} role="search">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜索漫画、作者或章节"
              aria-label="搜索漫画"
              maxLength={80}
            />
            <button type="submit" aria-label="打开官方搜索">⌕</button>
            {(suggestions.length > 0 || searchStatus !== "idle") && (
              <div className="search-popover">
                {searchStatus === "loading" && <div className="search-popover__status">正在获取建议</div>}
                {searchStatus === "failed" && <div className="search-popover__status">建议暂不可用，回车打开官方搜索</div>}
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onMouseDown={() => void openSearch(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>
          <div className="window-actions" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>

        <main className="app-main">
          {activePage === "home" && <MangaHomePage />}
          {activePage === "login" && <LoginPage />}
          {activePage === "bookshelf" && <MangaPurchasedPage />}
          {activePage === "history" && (
            <section className="state-page">
              <h2>最近阅读</h2>
              <p>阅读历史会优先使用本机保存的进度；官网同步稍后接入。</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
