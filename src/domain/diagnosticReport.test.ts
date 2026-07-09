import { describe, expect, it } from "vitest";
import { buildDiagnosticReport } from "./diagnosticReport";

describe("diagnostic report", () => {
  it("builds a readable redacted report", () => {
    const report = buildDiagnosticReport({
      generatedAt: new Date("2026-07-09T15:30:00.000Z"),
      appName: "BiliManga",
      appVersion: "0.1.0",
      platform: "windows",
      steps: [
        { label: "登录状态", status: "passed", detail: "登录状态可用" },
        { label: "章节图片", status: "failed", detail: "官方接口拒绝了这次请求。请求上下文没有通过校验。" },
      ],
    });

    expect(report).toContain("# BiliManga 阅读诊断报告");
    expect(report).toContain("生成时间: 2026-07-09T15:30:00.000Z");
    expect(report).toContain("- 登录状态: 通过 - 登录状态可用");
    expect(report).toContain("脱敏: 未包含 Cookie、UID、图片鉴权 URL 或 token。");
  });

  it("normalizes multi-line details into single report rows", () => {
    const report = buildDiagnosticReport({
      generatedAt: new Date("2026-07-09T15:30:00.000Z"),
      appName: "BiliManga",
      appVersion: "0.1.0",
      platform: "windows",
      steps: [{ label: "搜索", status: "failed", detail: "第一行\n第二行" }],
    });

    expect(report).toContain("- 搜索: 失败 - 第一行 第二行");
  });
});