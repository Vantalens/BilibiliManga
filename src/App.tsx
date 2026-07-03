import { useState } from "react";
import { MangaHomePage } from "./components/MangaHomePage";
import { MangaPurchasedPage } from "./components/MangaPurchasedPage";
import { LoginPage } from "./components/LoginPage";
import "./styles-manga.css";

type ActivePage = "home" | "purchased" | "bookshelf" | "history" | "login";

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("home");

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      {/* 顶部导航 */}
      <nav className="top-nav">
        <div className="logo">
          <div className="logo-icon">📚</div>
          <span>BilibiliManga</span>
        </div>

        <div className="nav-tabs">
          <div
            className={`nav-tab ${activePage === "home" ? "active" : ""}`}
            onClick={() => setActivePage("home")}
          >
            主页
          </div>
          <div
            className={`nav-tab ${activePage === "purchased" ? "active" : ""}`}
            onClick={() => setActivePage("purchased")}
          >
            我的已购
          </div>
          <div
            className={`nav-tab ${activePage === "bookshelf" ? "active" : ""}`}
            onClick={() => setActivePage("bookshelf")}
          >
            书架
          </div>
          <div
            className={`nav-tab ${activePage === "history" ? "active" : ""}`}
            onClick={() => setActivePage("history")}
          >
            历史
          </div>
        </div>

        <div className="user-actions">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="搜索漫画" />
          </div>
          <button
            className="login-button-nav"
            onClick={() => setActivePage("login")}
            style={{
              padding: "8px 16px",
              background: activePage === "login" ? "linear-gradient(135deg, #fb7299 0%, #00a1d6 100%)" : "transparent",
              color: activePage === "login" ? "white" : "var(--text-secondary)",
              border: activePage === "login" ? "none" : "1px solid var(--border-color)",
              borderRadius: "20px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.3s"
            }}
          >
            登录
          </button>
        </div>
      </nav>

      {/* 页面内容 */}
      {activePage === "home" && <MangaHomePage />}
      {activePage === "purchased" && <MangaPurchasedPage />}
      {activePage === "login" && <LoginPage />}
      {activePage === "bookshelf" && (
        <div className="main-content" style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📚</div>
          <div style={{ fontSize: "18px" }}>书架功能开发中...</div>
        </div>
      )}
      {activePage === "history" && (
        <div className="main-content" style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📜</div>
          <div style={{ fontSize: "18px" }}>历史记录功能开发中...</div>
        </div>
      )}
    </div>
  );
}
