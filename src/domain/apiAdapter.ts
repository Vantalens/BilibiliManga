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

export type HttpMethod = "POST";

export interface ObservedTwirpEndpoint {
  id: string;
  area: ApiArea;
  path: `/${string}`;
  method: HttpMethod;
  requiresLogin: boolean;
  source: "official-pc-js" | "official-pc-ssr";
  observedAt: string;
  nativeImplementationAllowed: boolean;
  officialWebFallback: string;
}

export type ApiAdapterErrorKind = "transport" | "server" | "schema" | "blocked";

export interface ApiAdapterError {
  kind: ApiAdapterErrorKind;
  message: string;
  code?: number;
}

export type ApiAdapterResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiAdapterError };

export interface TwirpEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data: T;
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

export const observedOfficialJsTwirpBaseUrl = "http://manga.bilibili.co/twirp";
export const twirpBaseUrl = "https://manga.bilibili.com/twirp";

export const observedTwirpEndpoints: ObservedTwirpEndpoint[] = [
  {
    id: "USER-NEWBIE-INFO",
    area: "auth",
    path: "/user.v1.User/GetNewbieInfo",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页登录页"
  },
  {
    id: "LIBRARY-FAVORITE-LIST",
    area: "library",
    path: "/bookshelf.v1.Bookshelf/ListFavorite",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页版书架"
  },
  {
    id: "HISTORY-LIST",
    area: "history",
    path: "/bookshelf.v1.Bookshelf/ListHistory",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页版历史"
  },
  {
    id: "SEARCH-SUGGESTION",
    area: "search",
    path: "/comic.v1.Comic/SearchSug",
    method: "POST",
    requiresLogin: false,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方搜索页"
  },
  {
    id: "USER-WALLET",
    area: "entitlement",
    path: "/user.v1.User/GetWallet",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方钱包页"
  },
  {
    id: "USER-CARD-INFO",
    area: "entitlement",
    path: "/card.v1.Card/GetUserCardInfo",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方用户权益页"
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

export function getBlockedTwirpEndpoints(
  endpoints: ObservedTwirpEndpoint[]
): ObservedTwirpEndpoint[] {
  return endpoints.filter((endpoint) => !endpoint.nativeImplementationAllowed);
}

export function assertTwirpEndpointAllowed(endpoint: ObservedTwirpEndpoint): void {
  if (!endpoint.nativeImplementationAllowed) {
    throw new Error(`${endpoint.id} must use official web fallback: ${endpoint.officialWebFallback}`);
  }
}

export function buildTwirpUrl(endpoint: ObservedTwirpEndpoint): string {
  assertTwirpEndpointAllowed(endpoint);
  return `${twirpBaseUrl}${endpoint.path}`;
}

export function buildTwirpQuery(params: Record<string, string | number> = {}): string {
  return new URLSearchParams({ device: "pc", platform: "web", nov: "27", ...stringifyParams(params) }).toString();
}

export function buildTwirpHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-bili-manga-from": "c-int-v1",
    ...extraHeaders
  };
}

export function parseSearchSuggestionsResponse(input: unknown): ApiAdapterResult<string[]> {
  const envelope = parseTwirpEnvelope<unknown>(input);
  if (!envelope.ok) {
    return envelope;
  }

  if (!Array.isArray(envelope.data.data) || !envelope.data.data.every((item) => typeof item === "string")) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "SearchSug response data must be a string array"
      }
    };
  }

  return { ok: true, data: envelope.data.data };
}

export function parseTwirpEnvelope<T>(input: unknown): ApiAdapterResult<TwirpEnvelope<T>> {
  if (!isRecord(input) || typeof input.code !== "number") {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "Twirp response must include a numeric code"
      }
    };
  }

  if (input.code !== 0) {
    return {
      ok: false,
      error: {
        kind: "server",
        code: input.code,
        message: getTwirpMessage(input)
      }
    };
  }

  if (!("data" in input)) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "Twirp success response must include data"
      }
    };
  }

  return { ok: true, data: input as unknown as TwirpEnvelope<T> };
}

function stringifyParams(params: Record<string, string | number>): Record<string, string> {
  return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]));
}

function getTwirpMessage(input: Record<string, unknown>): string {
  if (typeof input.msg === "string" && input.msg.length > 0) {
    return input.msg;
  }
  if (typeof input.message === "string" && input.message.length > 0) {
    return input.message;
  }
  return "Bilibili Manga API returned a non-zero code";
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
