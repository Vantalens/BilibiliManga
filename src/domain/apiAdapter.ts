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
export type EndpointVerificationStatus = "observed" | "verified" | "failed";

export interface ObservedTwirpEndpoint {
  id: string;
  area: ApiArea;
  path: `/${string}`;
  method: HttpMethod;
  requiresLogin: boolean;
  source: "official-pc-js" | "official-pc-ssr" | "research-report";
  observedAt: string;
  nativeImplementationAllowed: boolean;
  officialWebFallback: string;
  verificationStatus?: EndpointVerificationStatus;
  verificationNote?: string;
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

export interface TwirpJsonRequest<TBody extends Record<string, unknown>> {
  endpoint: ObservedTwirpEndpoint;
  url: string;
  query: string;
  headers: Record<string, string>;
  body: TBody;
}

export interface PurchasedComic {
  comic_id: number;
  comic_title: string;
  id?: number;
  vcover?: string;
  scover?: string;
  hcover?: string;
  bought_ep_count?: number;
  gold_status?: number;
  coupon_status?: number;
  comic_status?: number;
  last_ord?: number;
  ctime?: number;
  last_short_title?: string;
  buy_type?: number;
  ep_for_chapters?: unknown[];
  orders?: unknown[];
  enable_auto_pay?: boolean;
  type?: number;
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
    id: "USER-PURCHASED-COMICS",
    area: "library",
    path: "/user.v1.User/GetAutoBuyComics",
    method: "POST",
    requiresLogin: true,
    source: "research-report",
    observedAt: "2026-07-03",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方网页版已购漫画",
    verificationStatus: "observed",
    verificationNote: "Request and response shape are from local research reports and community references; requires real Cookie/browser-session verification before UI can treat it as stable"
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
    officialWebFallback: "官方搜索页",
    verificationStatus: "verified",
    verificationNote: "POST with term/num returned code=0 and string-array data"
  },
  {
    id: "DETAIL-COMIC",
    area: "detail",
    path: "/comic.v1.Comic/ComicDetail",
    method: "POST",
    requiresLogin: false,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方详情页"
  },
  {
    id: "SEARCH-KEYWORD-TWIRP",
    area: "search",
    path: "/comic.v1.Comic/Search",
    method: "POST",
    requiresLogin: false,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "官方搜索页",
    verificationStatus: "failed",
    verificationNote: "Official search page JS uses key_word/page_num/page_size, but direct public POST returned code=99"
  },
  {
    id: "IMAGE-INDEX",
    area: "image",
    path: "/comic.v1.Comic/GetImageIndex",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "章节错误页"
  },
  {
    id: "IMAGE-TOKEN",
    area: "image",
    path: "/comic.v1.Comic/ImageToken",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: true,
    officialWebFallback: "章节错误页"
  },
  {
    id: "EPISODE-BUY-INFO",
    area: "entitlement",
    path: "/comic.v1.Comic/GetEpisodeBuyInfo",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方章节购买或解锁页"
  },
  {
    id: "EPISODE-BUY",
    area: "entitlement",
    path: "/comic.v1.Comic/BuyEpisode",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方章节购买页"
  },
  {
    id: "EPISODE-RENT",
    area: "entitlement",
    path: "/comic.v1.Comic/RentEpisode",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方章节限免或租借页"
  },
  {
    id: "PAY-CREATE-ORDER",
    area: "entitlement",
    path: "/pay.v1.Pay/CreateOrder",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方支付页"
  },
  {
    id: "PAY-BCOIN",
    area: "entitlement",
    path: "/pay.v1.Pay/PayBCoin",
    method: "POST",
    requiresLogin: true,
    source: "official-pc-js",
    observedAt: "2026-07-02",
    nativeImplementationAllowed: false,
    officialWebFallback: "官方支付页"
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

export function getVerifiedTwirpEndpoints(
  endpoints: ObservedTwirpEndpoint[]
): ObservedTwirpEndpoint[] {
  return endpoints.filter((endpoint) => endpoint.nativeImplementationAllowed && endpoint.verificationStatus === "verified");
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

export function buildPurchasedComicsRequest(
  pageNum: number,
  pageSize: number
): ApiAdapterResult<TwirpJsonRequest<{ page_num: number; page_size: number }>> {
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics page_num must be an integer greater than 0"
      }
    };
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics page_size must be between 1 and 50"
      }
    };
  }

  const endpoint = observedTwirpEndpoints.find((item) => item.id === "USER-PURCHASED-COMICS");
  if (!endpoint) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics endpoint is not registered"
      }
    };
  }

  const query = buildTwirpQuery();
  return {
    ok: true,
    data: {
      endpoint,
      url: `${buildTwirpUrl(endpoint)}?${query}`,
      query,
      headers: buildTwirpHeaders({
        origin: "https://manga.bilibili.com",
        referer: "https://manga.bilibili.com/account-center"
      }),
      body: {
        page_num: pageNum,
        page_size: pageSize
      }
    }
  };
}

export function parsePurchasedComicsResponse(input: unknown): ApiAdapterResult<PurchasedComic[]> {
  const envelope = parseTwirpEnvelope<unknown>(input);
  if (!envelope.ok) {
    return envelope;
  }

  if (!Array.isArray(envelope.data.data)) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics response data must be an array"
      }
    };
  }

  const comics: PurchasedComic[] = [];
  for (let index = 0; index < envelope.data.data.length; index += 1) {
    const parsed = parsePurchasedComic(envelope.data.data[index], index);
    if (!parsed.ok) {
      return parsed;
    }
    comics.push(parsed.data);
  }

  return { ok: true, data: comics };
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

function parsePurchasedComic(input: unknown, index: number): ApiAdapterResult<PurchasedComic> {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: `GetAutoBuyComics item ${index} must be an object`
      }
    };
  }

  const comicId = numberField(input, "comic_id");
  const title = stringField(input, "comic_title");
  if (comicId === undefined || !title) {
    return {
      ok: false,
      error: {
        kind: "schema",
        message: `GetAutoBuyComics item ${index} must include comic_id and comic_title`
      }
    };
  }

  return {
    ok: true,
    data: omitUndefined({
      comic_id: comicId,
      comic_title: title,
      id: numberField(input, "id"),
      vcover: stringField(input, "vcover"),
      scover: stringField(input, "scover"),
      hcover: stringField(input, "hcover"),
      bought_ep_count: numberField(input, "bought_ep_count"),
      gold_status: numberField(input, "gold_status"),
      coupon_status: numberField(input, "coupon_status"),
      comic_status: numberField(input, "comic_status"),
      last_ord: numberField(input, "last_ord"),
      ctime: numberField(input, "ctime"),
      last_short_title: stringField(input, "last_short_title"),
      buy_type: numberField(input, "buy_type") ?? numberField(input, "bug_type"),
      ep_for_chapters: arrayField(input, "ep_for_chapters"),
      orders: arrayField(input, "orders"),
      enable_auto_pay: booleanField(input, "enable_auto_pay"),
      type: numberField(input, "type")
    })
  };
}

function numberField(input: Record<string, unknown>, key: string): number | undefined {
  const value = input[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function stringField(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanField(input: Record<string, unknown>, key: string): boolean | undefined {
  const value = input[key];
  return typeof value === "boolean" ? value : undefined;
}

function arrayField(input: Record<string, unknown>, key: string): unknown[] | undefined {
  const value = input[key];
  return Array.isArray(value) ? value : undefined;
}

function omitUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}
