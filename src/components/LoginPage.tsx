import { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  checkLoginStatus,
  deleteStoredCookies,
  generateLoginQrcode,
  getStoredCookies,
  hasStoredCookies,
  openOfficialMangaPage,
  pollLoginStatus,
  storeCookiesSecure,
  type LoginCheckResult,
  type QrCodeResult,
} from "../bridge/tauriBridge";

function cookiesToHeader(cookies: { name: string; value: string }[]): string {
  return cookies.map((cookie) => cookie.name + "=" + cookie.value).join("; ");
}

export function LoginPage() {
  const [loginStatus, setLoginStatus] = useState<LoginCheckResult | null>(null);
  const [qrCode, setQrCode] = useState<QrCodeResult | null>(null);
  const [qrImage, setQrImage] = useState<string>("");
  const [scanText, setScanText] = useState("等待扫码");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void checkCurrentLoginStatus();
  }, []);

  useEffect(() => {
    if (!qrCode || loginStatus?.is_login) {
      return;
    }

    const timer = window.setInterval(() => {
      void pollQrCode(qrCode.qrcode_key);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [qrCode, loginStatus?.is_login]);

  const checkCurrentLoginStatus = async () => {
    try {
      const hasStored = await hasStoredCookies();
      if (!hasStored) {
        setLoginStatus(null);
        return;
      }

      const stored = await getStoredCookies();
      const status = await checkLoginStatus(stored.raw_cookie);
      setLoginStatus(status);
      if (!status.is_login) {
        setError("登录状态已失效，请重新扫码登录。");
      }
    } catch (err) {
      setError("暂时无法确认登录状态，请稍后再试。");
    }
  };

  const createQrCode = async () => {
    setLoading(true);
    setError(null);
    setScanText("等待扫码");
    try {
      const result = await generateLoginQrcode();
      const image = await QRCode.toDataURL(result.url, {
        width: 220,
        margin: 1,
        color: { dark: "#18191c", light: "#ffffff" },
      });
      setQrCode(result);
      setQrImage(image);
    } catch (err) {
      setError("暂时无法生成登录二维码，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const pollQrCode = async (qrcodeKey: string) => {
    try {
      const status = await pollLoginStatus(qrcodeKey);
      if (status.type === "scanning") {
        setScanText("等待扫码");
        return;
      }
      if (status.type === "confirmed") {
        setScanText("已扫码，请在手机上确认");
        return;
      }
      if (status.type === "expired") {
        setScanText("二维码已过期");
        setQrCode(null);
        setError("二维码已过期，请刷新后重新扫码。");
        return;
      }
      if (status.type === "failed") {
        setScanText("登录失败");
        setError("登录失败，请刷新二维码后重试。");
        return;
      }

      const rawCookie = cookiesToHeader(status.cookies);
      await storeCookiesSecure(rawCookie);
      const checked = await checkLoginStatus(rawCookie);
      setLoginStatus(checked);
      setQrCode(null);
      setQrImage("");
      setError(checked.is_login ? null : "登录状态未生效，请重新扫码登录。");
    } catch (err) {
      setError("暂时无法刷新扫码状态，请稍后再试。");
    }
  };

  const handleOfficialSite = async () => {
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
      setQrCode(null);
      setQrImage("");
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

        {error && <div className="error-message">{error}</div>}

        {loginStatus?.is_login ? (
          <div className="login-success">
            <div className="status-badge">已登录</div>
            <p className="login-muted">账号状态已同步，返回书架后可刷新你的漫画。</p>
            <button onClick={handleLogout} disabled={loading} className="logout-button" type="button">
              {loading ? "正在退出" : "退出登录"}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="login-description">
              <p>使用哔哩哔哩手机端扫码登录。</p>
              <p>购买、支付和账号安全操作仍在哔哩哔哩漫画官网完成。</p>
            </div>

            {qrImage ? (
              <div className="qr-panel">
                <img src={qrImage} alt="登录二维码" />
                <div className="qr-status">{scanText}</div>
              </div>
            ) : (
              <div className="qr-placeholder">二维码会显示在这里</div>
            )}

            <button onClick={() => void createQrCode()} className="login-button" disabled={loading} type="button">
              {loading ? "正在生成" : qrImage ? "刷新二维码" : "扫码登录"}
            </button>

            <button onClick={handleOfficialSite} className="check-button" type="button">
              打开哔哩哔哩漫画官网
            </button>
          </div>
        )}

        <div className="login-notice">
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
          min-height: calc(100vh - 160px);
          padding: 24px;
        }

        .login-container {
          max-width: 520px;
          width: 100%;
          padding: 32px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .login-container h2 {
          margin: 0 0 24px 0;
          text-align: center;
          color: #18191c;
        }

        .error-message {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 8px;
          background: #fff3f6;
          color: #c24d73;
          font-size: 14px;
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
          margin-bottom: 12px;
        }

        .login-muted {
          margin: 0 0 16px;
          color: #7d838c;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .login-description {
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;
          font-size: 14px;
          color: #62666d;
          line-height: 1.6;
        }

        .login-description p {
          margin: 0;
        }

        .login-description p + p {
          margin-top: 8px;
        }

        .qr-panel,
        .qr-placeholder {
          display: grid;
          place-items: center;
          min-height: 260px;
          border: 1px solid #edf0f3;
          border-radius: 8px;
          background: #ffffff;
        }

        .qr-panel img {
          width: 220px;
          height: 220px;
        }

        .qr-status {
          margin-top: -8px;
          color: #62666d;
          font-size: 14px;
        }

        .qr-placeholder {
          color: #9499a0;
          font-size: 14px;
        }

        .login-button,
        .check-button,
        .logout-button {
          min-height: 46px;
          padding: 0 24px;
          border-radius: 8px;
          font-size: 15px;
          cursor: pointer;
        }

        .login-button {
          background: #ff6699;
          color: white;
          font-weight: 650;
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .check-button {
          background: white;
          color: #00a1d6;
          border: 1px solid #00a1d6;
        }

        .logout-button {
          background: #f5f7fa;
          color: #62666d;
        }

        .login-notice {
          margin-top: 24px;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          font-size: 12px;
          color: #9499a0;
        }

        .login-notice p {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
}
