import { useState } from "react";
import {
  checkLoginStatus,
  fetchPurchasedComics,
  type LoginCheckResult,
  type PurchasedComicsResult,
} from "../bridge/tauriBridge";

/**
 * API 测试面板组件
 * 用于快速验证真实 Cookie 和 API 调用
 *
 * 使用方法：
 * 1. 在 App.tsx 中引入：import { ApiTestPanel } from "./components/ApiTestPanel"
 * 2. 添加到任意页面：<ApiTestPanel />
 * 3. 粘贴浏览器 Cookie 进行测试
 */
export function ApiTestPanel() {
  const [cookies, setCookies] = useState("");
  const [loginResult, setLoginResult] = useState<LoginCheckResult | null>(null);
  const [purchasedResult, setPurchasedResult] = useState<PurchasedComicsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckLogin = async () => {
    if (!cookies.trim()) {
      setError("请输入 Cookie");
      return;
    }

    setLoading(true);
    setError(null);
    setLoginResult(null);

    try {
      const result = await checkLoginStatus(cookies);
      setLoginResult(result);
      console.log("Login check result:", result);
    } catch (err) {
      setError(`登录检查失败: ${err}`);
      console.error("Login check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPurchased = async () => {
    if (!cookies.trim()) {
      setError("请输入 Cookie");
      return;
    }

    setLoading(true);
    setError(null);
    setPurchasedResult(null);

    try {
      const result = await fetchPurchasedComics(1, 15, cookies);
      setPurchasedResult(result);
      console.log("Purchased comics result:", result);
    } catch (err) {
      setError(`获取已购漫画失败: ${err}`);
      console.error("Fetch purchased error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: "20px",
      border: "2px solid #f0f0f0",
      borderRadius: "8px",
      maxWidth: "800px",
      margin: "20px auto",
      backgroundColor: "#fafafa"
    }}>
      <h2 style={{ marginTop: 0 }}>🧪 API 测试面板</h2>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Cookie 字符串:
        </label>
        <textarea
          value={cookies}
          onChange={(e) => setCookies(e.target.value)}
          placeholder="粘贴从浏览器 DevTools 中复制的 Cookie..."
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px",
            fontSize: "12px",
            fontFamily: "monospace",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxSizing: "border-box"
          }}
        />
        <small style={{ color: "#666" }}>
          提示: 打开 Chrome DevTools → Network → 找到请求 → Headers → Cookie
        </small>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={handleCheckLogin}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#1890ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          {loading ? "测试中..." : "1️⃣ 检查登录状态"}
        </button>

        <button
          onClick={handleFetchPurchased}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#52c41a",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          {loading ? "测试中..." : "2️⃣ 获取已购漫画"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "12px",
          backgroundColor: "#fff2e8",
          border: "1px solid #ffbb96",
          borderRadius: "4px",
          marginBottom: "20px",
          color: "#d4380d"
        }}>
          <strong>❌ 错误:</strong> {error}
        </div>
      )}

      {loginResult && (
        <div style={{
          padding: "12px",
          backgroundColor: loginResult.is_login ? "#f6ffed" : "#fff2e8",
          border: `1px solid ${loginResult.is_login ? "#b7eb8f" : "#ffbb96"}`,
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          <h3 style={{ marginTop: 0 }}>✅ 登录检查结果</h3>
          <pre style={{ fontSize: "12px", overflow: "auto" }}>
            {JSON.stringify(loginResult, null, 2)}
          </pre>
        </div>
      )}

      {purchasedResult && (
        <div style={{
          padding: "12px",
          backgroundColor: "#f6ffed",
          border: "1px solid #b7eb8f",
          borderRadius: "4px"
        }}>
          <h3 style={{ marginTop: 0 }}>✅ 已购漫画结果</h3>
          <p><strong>总数:</strong> {purchasedResult.items.length}</p>

          {purchasedResult.items.length > 0 && (
            <>
              <h4>前 5 条漫画:</h4>
              <ul style={{ paddingLeft: "20px" }}>
                {purchasedResult.items.slice(0, 5).map((comic) => (
                  <li key={comic.comic_id} style={{ marginBottom: "8px" }}>
                    <strong>[{comic.comic_id}] {comic.comic_title}</strong>
                    <br />
                    <small style={{ color: "#666" }}>
                      已购章节: {comic.bought_ep_count ?? "N/A"} |
                      最新话: {comic.last_short_title ?? "N/A"}
                    </small>
                  </li>
                ))}
              </ul>

              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                  查看完整 JSON
                </summary>
                <pre style={{
                  fontSize: "12px",
                  overflow: "auto",
                  backgroundColor: "#f5f5f5",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "8px"
                }}>
                  {JSON.stringify(purchasedResult, null, 2)}
                </pre>
              </details>
            </>
          )}
        </div>
      )}

      <div style={{
        marginTop: "20px",
        padding: "12px",
        backgroundColor: "#e6f7ff",
        border: "1px solid #91d5ff",
        borderRadius: "4px"
      }}>
        <strong>💡 下一步:</strong>
        <ol style={{ marginBottom: 0, paddingLeft: "20px" }}>
          <li>验证 Cookie 可用后，检查响应字段是否与代码一致</li>
          <li>如果成功，继续实现 Cookie 持久化（keyring）</li>
          <li>将已购漫画列表接入真实 UI</li>
        </ol>
      </div>
    </div>
  );
}
