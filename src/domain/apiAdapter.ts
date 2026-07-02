export type ApiArea =
  | "auth"
  | "library"
  | "history"
  | "search"
  | "detail"
  | "chapter"
  | "image"
  | "progress"
  | "entitlement";

export type ApiRisk = "low" | "medium" | "high" | "blocked";

export interface ApiResearchItem {
  id: string;
  area: ApiArea;
  title: string;
  risk: ApiRisk;
  nativeImplementationAllowed: boolean;
  officialWebFallback: string;
}

export const apiResearchCatalog: ApiResearchItem[] = [
  {
    id: "AUTH-QR",
    area: "auth",
    title: "扫码登录",
    risk: "high",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页登录页"
  },
  {
    id: "LIBRARY-SHELF",
    area: "library",
    title: "书架列表",
    risk: "high",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页版书架"
  },
  {
    id: "SEARCH-KEYWORD",
    area: "search",
    title: "关键词搜索",
    risk: "medium",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方搜索页"
  },
  {
    id: "CHAPTER-IMAGES",
    area: "image",
    title: "章节图片",
    risk: "high",
    nativeImplementationAllowed: true,
    officialWebFallback: "章节错误页"
  },
  {
    id: "ENTITLEMENT-PURCHASE",
    area: "entitlement",
    title: "购买/充值/解锁",
    risk: "blocked",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方网页支付或解锁流程"
  }
];

export function getBlockedNativeEndpoints(items: ApiResearchItem[]): ApiResearchItem[] {
  return items.filter((item) => !item.nativeImplementationAllowed || item.risk === "blocked");
}

export function assertNativeEndpointAllowed(item: ApiResearchItem): void {
  if (!item.nativeImplementationAllowed || item.risk === "blocked") {
    throw new Error(`${item.id} must use official web fallback: ${item.officialWebFallback}`);
  }
}

