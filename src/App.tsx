import { useState } from "react";
import { MangaHomePage } from "./components/MangaHomePage";
import { MangaPurchasedPage } from "./components/MangaPurchasedPage";
import { LoginPage } from "./components/LoginPage";
import "./styles-manga.css";

type ActivePage = "home" | "purchased" | "bookshelf" | "history" | "login";

const navItems: Array<{ id: ActivePage; label: string; icon: string }> = [
  { id: "home", label: "首页", icon: "⌂" },
  { id: "bookshelf", label: "书架", icon: "▣" },
  { id: "purchased", label: "已购", icon: "◫" },
  { id: "history", label: "历史", icon: "◷" },
  { id: "login", label: "我的", icon: "○" }
];

const topTabs: Array<{ id: ActivePage; label: string }> = [
  { id: "home", label: "推荐" },
  { id: "bookshelf", label: "书架" },
  { id: "purchased", label: "已购" },
  { id: "history", label: "最近" }
];

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("home");

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
          <div className="top-search">
            <input placeholder="搜索漫画、作者或章节" aria-label="搜索漫画" />
            <span aria-hidden="true">⌕</span>
          </div>
          <div className="window-actions" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>

        <main className="app-main">
          {activePage === "home" && <MangaHomePage />}
          {activePage === "purchased" && <MangaPurchasedPage />}
          {activePage === "login" && <LoginPage />}
          {activePage === "bookshelf" && (
            <section className="state-page">
              <h2>书架</h2>
              <p>本地分组、标签、评分和备注已经具备存储基础；真实书架同步仍待接口验证。</p>
            </section>
          )}
          {activePage === "history" && (
            <section className="state-page">
              <h2>最近阅读</h2>
              <p>阅读历史会优先使用本地进度；官方历史同步接口仍在调研中。</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
