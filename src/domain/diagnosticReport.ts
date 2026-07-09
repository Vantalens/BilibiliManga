export type DiagnosticReportStatus = "idle" | "running" | "passed" | "failed" | "skipped";

export interface DiagnosticReportStep {
  label: string;
  status: DiagnosticReportStatus;
  detail: string;
}

export interface DiagnosticReportInput {
  generatedAt: Date;
  appName: string;
  appVersion: string;
  platform: string;
  steps: DiagnosticReportStep[];
}

const statusLabels: Record<DiagnosticReportStatus, string> = {
  idle: "待检查",
  running: "检查中",
  passed: "通过",
  failed: "失败",
  skipped: "跳过",
};

function sanitizeReportLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function buildDiagnosticReport(input: DiagnosticReportInput): string {
  const lines = [
    "# BiliManga 阅读诊断报告",
    "",
    "生成时间: " + input.generatedAt.toISOString(),
    "应用: " + sanitizeReportLine(input.appName) + " " + sanitizeReportLine(input.appVersion),
    "平台: " + sanitizeReportLine(input.platform),
    "脱敏: 未包含 Cookie、UID、图片鉴权 URL 或 token。",
    "",
    "## 检查结果",
  ];

  for (const step of input.steps) {
    lines.push(
      "- " +
        sanitizeReportLine(step.label) +
        ": " +
        statusLabels[step.status] +
        " - " +
        sanitizeReportLine(step.detail)
    );
  }

  return lines.join("\n");
}