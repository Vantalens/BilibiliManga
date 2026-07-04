import { useState, useEffect } from "react";
import {
  checkLoginStatus,
  getStoredCookies,
  deleteStoredCookies,
  hasStoredCookies,
  openOfficialMangaPage,
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
      setError("暂时无法确认登录状态，请稍后再试。");
    }
  };

  const handleOfficialLogin = async () => {
    try {
      await openOfficialMangaPage();
      setError(null);
    } catch (err) {
      setError("暂时无法打开官网，请稍后再试。");
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await deleteStoredCookies();
      setLoginStatus(null);
      setError(null);
    } catch (err) {
      setError("退出登录失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>我的账号</h2>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loginStatus?.is_login ? (
          <div className="login-success">
            <div className="status-badge">✓ 已登录</div>
                        <button
              onClick={handleLogout}
              disabled={loading}
              className="logout-button"
            >
              {loading ? "正在退出" : "退出登录"}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="login-description">
              <p>登录、购买和账号安全操作都在哔哩哔哩漫画官网完成。</p>
              <p>完成后回到软件刷新状态，书架会显示你正在看的漫画。</p>
            </div>

            <button
              onClick={handleOfficialLogin}
              className="login-button"
            >
              打开哔哩哔哩漫画官网
            </button>

            <button
              onClick={checkCurrentLoginStatus}
              className="check-button"
              style={{ marginTop: '12px' }}
            >
              我已完成登录，刷新状态
            </button>
          </div>
        )}

        <div className="login-notice" style={{ marginTop: '24px', fontSize: '12px', color: '#999' }}>
          <p>• 本软件不会接管支付、购买或账号安全操作</p>
          <p>• 未解锁章节会回到官网处理</p>
          <p>• 书架只展示你有权访问或公开可浏览的内容</p>
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
          background: #ff6699;
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
