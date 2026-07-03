import { useState } from "react";
import { MangaHomePage } from "./components/MangaHomePage";
import { MangaPurchasedPage } from "./components/MangaPurchasedPage";
import { ApiTestPanel } from "./components/ApiTestPanel";
import "./styles-manga.css";

type ActivePage = "home" | "purchased" | "bookshelf" | "history";

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("home");
  const [showDevPanel, setShowDevPanel] = useState(false);

  return (
    <div style={{ background: "var(--bg-dark)", minHeight: "100vh" }}>
      {/* 顶部导航 */}
      <nav className="top-nav">
        <div className="logo">
          <div className="logo-icon">📚</div>
          <span>哔哩哔哩漫画</span>
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
          <div
            className="user-avatar"
            onClick={() => setShowDevPanel(!showDevPanel)}
            style={{ cursor: "pointer" }}
            title="点击显示/隐藏开发面板"
          ></div>
        </div>
      </nav>

      {/* 页面内容 */}
      {activePage === "home" && <MangaHomePage />}
      {activePage === "purchased" && <MangaPurchasedPage />}
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

      {/* 开发者面板（可折叠） */}
      {showDevPanel && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(33, 34, 38, 0.98)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid var(--border-color)",
          maxHeight: "60vh",
          overflowY: "auto",
          zIndex: 1000,
        }}>
          <div style={{
            padding: "12px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
          }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
              🔧 开发者面板
            </h3>
            <button
              onClick={() => setShowDevPanel(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ✕
            </button>
          </div>
          <ApiTestPanel />
        </div>
      )}
    </div>
  );
}
