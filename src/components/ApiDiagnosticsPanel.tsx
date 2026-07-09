import { useState } from "react";
import {
  checkLoginStatus,
  fetchComicDetail,
  fetchEpisodeImages,
  fetchUserBookshelf,
  getAppStatus,
  getStoredCookies,
  hasStoredCookies,
  searchComics,
  type AppStatus,
  type BookshelfItem,
  type ClassPageComic,
  type ComicDetailResult,
} from "../bridge/tauriBridge";
import { chooseDiagnosticComicId, chooseReadableDiagnosticEpisode } from "../domain/apiDiagnostics";
import { formatApiFailure } from "../domain/apiErrors";
import { buildDiagnosticReport } from "../domain/diagnosticReport";

type DiagnosticStatus = "idle" | "running" | "passed" | "failed" | "skipped";
type DiagnosticStepId = "login" | "bookshelf" | "search" | "detail" | "images";

interface DiagnosticStep {
  id: DiagnosticStepId;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}

const stepLabels: Record<DiagnosticStepId, string> = {
  login: "登录状态",
  bookshelf: "书架同步",
  search: "应用内搜索",
  detail: "漫画详情",
  images: "章节图片",
};

function createInitialSteps(): DiagnosticStep[] {
  return (Object.keys(stepLabels) as DiagnosticStepId[]).map((id) => ({
    id,
    label: stepLabels[id],
    status: "idle",
    detail: "等待检查",
  }));
}

function statusText(status: DiagnosticStatus): string {
  if (status === "running") return "检查中";
  if (status === "passed") return "通过";
  if (status === "failed") return "失败";
  if (status === "skipped") return "跳过";
  return "待检查";
}

function statusClass(status: DiagnosticStatus): string {
  return "diagnostic-status diagnostic-status--" + status;
}

function defaultAppStatus(): AppStatus {
  return {
    app_name: "BiliManga",
    version: "0.1.0",
    platform: "unknown",
    content_policy: {
      payment_flow: "official_web",
      cache_policy: "short_term_only",
      export_allowed: false,
    },
  };
}

export function ApiDiagnosticsPanel() {
  const [steps, setSteps] = useState<DiagnosticStep[]>(createInitialSteps);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const updateStep = (id: DiagnosticStepId, status: DiagnosticStatus, detail: string) => {
    setSteps((current) => current.map((step) => (step.id === id ? { ...step, status, detail } : step)));
  };

  const buildReportFromSteps = async (currentSteps: DiagnosticStep[]) => {
    let appStatus = defaultAppStatus();
    try {
      appStatus = await getAppStatus();
    } catch {
      // The report still remains useful if app metadata cannot be loaded.
    }
    return buildDiagnosticReport({
      generatedAt: new Date(),
      appName: appStatus.app_name,
      appVersion: appStatus.version,
      platform: appStatus.platform,
      steps: currentSteps,
    });
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setCopyStatus("");
    setReport("");
    let currentSteps = createInitialSteps();
    setSteps(currentSteps);

    const recordStep = (id: DiagnosticStepId, status: DiagnosticStatus, detail: string) => {
      currentSteps = currentSteps.map((step) => (step.id === id ? { ...step, status, detail } : step));
      setSteps(currentSteps);
    };

    let cookies: string | undefined;
    let bookshelfItems: BookshelfItem[] = [];
    let searchResults: ClassPageComic[] = [];
    let detail: ComicDetailResult | null = null;

    recordStep("login", "running", "正在检查本机登录状态");
    try {
      const hasCookies = await hasStoredCookies();
      if (!hasCookies) {
        throw new Error("No stored cookies found");
      }
      const stored = await getStoredCookies();
      const status = await checkLoginStatus(stored.raw_cookie);
      if (!status.is_login) {
        throw new Error("need login");
      }
      cookies = stored.raw_cookie;
      recordStep("login", "passed", "登录状态可用");
    } catch (err) {
      recordStep("login", "failed", formatApiFailure(err));
    }

    if (cookies) {
      recordStep("bookshelf", "running", "正在同步哔哩哔哩漫画书架");
      try {
        const result = await fetchUserBookshelf(1, 5, cookies);
        bookshelfItems = result.items;
        recordStep("bookshelf", "passed", "已返回 " + result.items.length + " 部书架漫画");
      } catch (err) {
        recordStep("bookshelf", "failed", formatApiFailure(err));
      }
    } else {
      recordStep("bookshelf", "skipped", "需要登录后检查官网书架");
    }

    recordStep("search", "running", "正在检查应用内搜索");
    try {
      const result = await searchComics("有兽焉", 10, cookies);
      searchResults = result.comics;
      recordStep("search", "passed", "已返回 " + result.comics.length + " 条搜索结果");
    } catch (err) {
      recordStep("search", "failed", formatApiFailure(err));
    }

    const diagnosticComicId = chooseDiagnosticComicId(bookshelfItems, searchResults);
    recordStep("detail", "running", "正在加载漫画详情");
    try {
      detail = await fetchComicDetail(diagnosticComicId);
      recordStep("detail", "passed", detail.title + "，共 " + detail.episodes.length + " 话");
    } catch (err) {
      recordStep("detail", "failed", formatApiFailure(err));
    }

    if (detail) {
      const episode = chooseReadableDiagnosticEpisode(detail);
      if (!episode) {
        recordStep("images", "skipped", "没有可用于诊断的免费或已解锁章节");
      } else {
        recordStep("images", "running", "正在检查章节图片加载");
        try {
          const result = await fetchEpisodeImages(detail.id, episode.id, cookies);
          recordStep("images", "passed", "已返回 " + result.images.length + " 张图片");
        } catch (err) {
          recordStep("images", "failed", formatApiFailure(err));
        }
      }
    } else {
      recordStep("images", "skipped", "详情加载失败，无法继续检查章节图片");
    }

    setReport(await buildReportFromSteps(currentSteps));
    setRunning(false);
  };

  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("已复制");
    } catch {
      setCopyStatus("无法自动复制，可手动选中文本");
    }
  };

  return (
    <section className="diagnostics-panel" aria-label="接口诊断">
      <div className="diagnostics-header">
        <div>
          <h3>阅读诊断</h3>
          <p>检查登录、书架、搜索、详情和章节图片是否可用。</p>
        </div>
        <button className="check-button" type="button" onClick={() => void runDiagnostics()} disabled={running}>
          {running ? "检查中" : "开始检查"}
        </button>
      </div>

      <div className="diagnostic-steps">
        {steps.map((step) => (
          <div className="diagnostic-row" key={step.id}>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
            <span className={statusClass(step.status)}>{statusText(step.status)}</span>
          </div>
        ))}
      </div>

      {report && (
        <div className="diagnostic-report">
          <div className="diagnostic-report__header">
            <strong>诊断报告</strong>
            <button className="check-button" type="button" onClick={() => void copyReport()}>
              复制报告
            </button>
          </div>
          <textarea readOnly value={report} aria-label="诊断报告" />
          {copyStatus && <p>{copyStatus}</p>}
        </div>
      )}
    </section>
  );
}