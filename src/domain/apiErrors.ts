export type ApiFailureKind = "official_context" | "login_required" | "network" | "schema" | "unknown";

export interface ApiFailureDescription {
  title: string;
  detail: string;
  kind: ApiFailureKind;
}

export function describeApiFailure(error: unknown): ApiFailureDescription {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  if (lower.includes("code 99") || message.includes("请求失败,请稍后重试")) {
    return {
      title: "官方接口拒绝了这次请求",
      detail: "请求上下文没有通过哔哩哔哩漫画校验。请确认已扫码登录；如果官网可读但这里失败，需要反馈该漫画和章节。",
      kind: "official_context",
    };
  }

  if (lower.includes("unauthenticated") || lower.includes("need login") || lower.includes("no stored cookies") || lower.includes("expired")) {
    return {
      title: "需要重新登录",
      detail: "当前登录状态不可用。请到“我的”页面重新扫码登录后再刷新。",
      kind: "login_required",
    };
  }

  if (lower.includes("transport failed") || lower.includes("network") || lower.includes("dns") || lower.includes("timed out")) {
    return {
      title: "网络请求失败",
      detail: "当前网络无法连接到哔哩哔哩漫画服务，请稍后重试。",
      kind: "network",
    };
  }

  if (lower.includes("schema mismatch") || lower.includes("did not include")) {
    return {
      title: "接口返回格式变化",
      detail: "官方接口返回内容和当前版本不一致，需要更新适配。",
      kind: "schema",
    };
  }

  return {
    title: "操作失败",
    detail: "当前操作没有完成，请稍后重试。",
    kind: "unknown",
  };
}

export function formatApiFailure(error: unknown): string {
  const description = describeApiFailure(error);
  return description.title + "。" + description.detail;
}
