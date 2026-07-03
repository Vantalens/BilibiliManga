import { useState, useEffect } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  checkLoginStatus,
  getStoredCookies,
  deleteStoredCookies,
  hasStoredCookies,
  type LoginCheckResult,
} from "../bridge/tauriBridge";

export function LoginPage() {
  const [loginStatus, setLoginStatus] = useState<LoginCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentLoginStatus();
  }, []);

  const checkCurrentLoginStatus = async () => {
    try {
      const hasStored = await hasStoredCookies();
      if (hasStored) {
        const stored = await getStoredCookies();
        const status = await checkLoginStatus(stored.raw_cookie);
        setLoginStatus(status);
      }
    } catch (err) {
      setError(`检查登录状态失败: ${err}`);
    }
  };

  const handleOfficialLogin = async () => {
    try {
      // 打开官方登录页
      await openUrl("https://passport.bilibili.com/login");

      // 提示用户
      setError(null);
      alert("请在浏览器中完成登录，登录完成后点击'检查登录状态'按钮");
    } catch (err) {
      setError(`打开登录页失败: ${err}`);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await deleteStoredCookies();
      setLoginStatus(null);
      setError(null);
    } catch (err) {
      setError(`登出失败: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>登录哔哩哔哩漫画</h2>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loginStatus?.is_login ? (
          <div className="login-success">
            <div className="status-badge">✓ 已登录</div>
            {loginStatus.uid && <p>用户 ID: {loginStatus.uid}</p>}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="logout-button"
            >
              {loading ? "登出中..." : "登出"}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="login-description">
              <p>点击下方按钮，将在浏览器中打开官方登录页面</p>
              <p>登录完成后，软件会自动获取登录状态</p>
            </div>

            <button
              onClick={handleOfficialLogin}
              className="login-button"
            >
              前往官方网站登录
            </button>

            <button
              onClick={checkCurrentLoginStatus}
              className="check-button"
              style={{ marginTop: '12px' }}
            >
              检查登录状态
            </button>
          </div>
        )}

        <div className="login-notice" style={{ marginTop: '24px', fontSize: '12px', color: '#999' }}>
          <p>• 登录信息安全存储在系统密钥环中</p>
          <p>• 不会保存密码，仅保存登录凭证</p>
          <p>• 未购买的章节将跳转官方网页处理</p>
        </div>
      </div>

      <style>{`
        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 60px);
          padding: 24px;
        }

        .login-container {
          max-width: 480px;
          width: 100%;
          padding: 32px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        .login-container h2 {
          margin: 0 0 24px 0;
          text-align: center;
          color: #333;
        }

        .login-success {
          text-align: center;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          background: #00a1d6;
          color: white;
          border-radius: 20px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-description {
          margin-bottom: 12px;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          font-size: 14px;
          color: #666;
          line-height: 1.6;
        }

        .login-description p {
          margin: 0;
        }

        .login-description p + p {
          margin-top: 8px;
        }

        .login-button {
          padding: 14px 24px;
          background: linear-gradient(135deg, #fb7299 0%, #00a1d6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .login-button:hover {
          transform: translateY(-2px);
        }

        .check-button {
          padding: 12px 24px;
          background: white;
          color: #00a1d6;
          border: 2px solid #00a1d6;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .check-button:hover {
          background: #00a1d6;
          color: white;
        }

        .logout-button {
          padding: 12px 32px;
          background: #f5f7fa;
          color: #666;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 16px;
        }

        .logout-button:hover {
          background: #e5e7eb;
        }

        .login-notice {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .login-notice p {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}
