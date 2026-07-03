import { describe, expect, it } from "vitest";
import {
  apiResearchCatalog,
  assertNativeEndpointAllowed,
  assertTwirpEndpointAllowed,
  buildPurchasedComicsRequest,
  buildTwirpHeaders,
  buildTwirpQuery,
  buildTwirpUrl,
  getBlockedNativeEndpoints,
  getBlockedTwirpEndpoints,
  getVerifiedTwirpEndpoints,
  observedOfficialJsTwirpBaseUrl,
  observedTwirpEndpoints,
  parsePurchasedComicsResponse,
  parseSearchSuggestionsResponse,
  parseTwirpEnvelope,
  twirpBaseUrl
} from "./apiAdapter";

describe("api adapter boundaries", () => {
  it("keeps purchase, recharge, and unlock flows out of native implementation", () => {
    const blocked = getBlockedNativeEndpoints(apiResearchCatalog);

    expect(blocked.map((item) => item.id)).toContain("ENTITLEMENT-PURCHASE");
    expect(blocked.every((item) => item.officialWebFallback.includes("官方"))).toBe(true);
  });

  it("throws when a blocked endpoint is used as a native endpoint", () => {
    const purchase = apiResearchCatalog.find((item) => item.id === "ENTITLEMENT-PURCHASE");

    expect(() => assertNativeEndpointAllowed(purchase!)).toThrow(/official web fallback/);
  });

  it("allows non-sensitive researched endpoints to proceed to implementation", () => {
    const search = apiResearchCatalog.find((item) => item.id === "SEARCH-KEYWORD");

    expect(() => assertNativeEndpointAllowed(search!)).not.toThrow();
  });

  it("records observed official pc twirp endpoints without enabling sensitive wallet calls", () => {
    const blocked = getBlockedTwirpEndpoints(observedTwirpEndpoints);

    expect(observedOfficialJsTwirpBaseUrl).toBe("http://manga.bilibili.co/twirp");
    expect(observedTwirpEndpoints.map((endpoint) => endpoint.path)).toEqual(
      expect.arrayContaining([
        "/user.v1.User/GetAutoBuyComics",
        "/bookshelf.v1.Bookshelf/ListFavorite",
        "/bookshelf.v1.Bookshelf/ListHistory",
        "/comic.v1.Comic/SearchSug",
        "/comic.v1.Comic/ComicDetail",
        "/comic.v1.Comic/GetImageIndex",
        "/comic.v1.Comic/ImageToken"
      ])
    );
    expect(blocked.map((endpoint) => endpoint.id)).toEqual(
      expect.arrayContaining([
        "USER-WALLET",
        "USER-CARD-INFO",
        "EPISODE-BUY-INFO",
        "EPISODE-BUY",
        "EPISODE-RENT",
        "PAY-CREATE-ORDER",
        "PAY-BCOIN"
      ])
    );
  });

  it("separates verified public endpoints from observed but failed endpoints", () => {
    const verifiedIds = getVerifiedTwirpEndpoints(observedTwirpEndpoints).map((endpoint) => endpoint.id);
    const search = observedTwirpEndpoints.find((endpoint) => endpoint.id === "SEARCH-KEYWORD-TWIRP");

    expect(verifiedIds).toContain("SEARCH-SUGGESTION");
    expect(verifiedIds).not.toContain("SEARCH-KEYWORD-TWIRP");
    expect(verifiedIds).not.toContain("USER-PURCHASED-COMICS");
    expect(search?.verificationStatus).toBe("failed");
    expect(search?.verificationNote).toMatch(/code=99/);
  });
  it("builds native twirp urls only for allowed observed endpoints", () => {
    const search = observedTwirpEndpoints.find((endpoint) => endpoint.id === "SEARCH-SUGGESTION");
    const wallet = observedTwirpEndpoints.find((endpoint) => endpoint.id === "USER-WALLET");

    expect(buildTwirpUrl(search!)).toBe(`${twirpBaseUrl}/comic.v1.Comic/SearchSug`);
    expect(() => assertTwirpEndpointAllowed(wallet!)).toThrow(/official web fallback/);
    expect(() => buildTwirpUrl(wallet!)).toThrow(/official web fallback/);
  });

  it("keeps detail page purchase and payment endpoints blocked", () => {
    const blockedIds = getBlockedTwirpEndpoints(observedTwirpEndpoints).map((endpoint) => endpoint.id);
    const detail = observedTwirpEndpoints.find((endpoint) => endpoint.id === "DETAIL-COMIC");
    const imageIndex = observedTwirpEndpoints.find((endpoint) => endpoint.id === "IMAGE-INDEX");
    const buy = observedTwirpEndpoints.find((endpoint) => endpoint.id === "EPISODE-BUY");
    const pay = observedTwirpEndpoints.find((endpoint) => endpoint.id === "PAY-CREATE-ORDER");

    expect(blockedIds).toEqual(expect.arrayContaining(["EPISODE-BUY", "PAY-CREATE-ORDER"]));
    expect(() => assertTwirpEndpointAllowed(detail!)).not.toThrow();
    expect(() => assertTwirpEndpointAllowed(imageIndex!)).not.toThrow();
    expect(() => buildTwirpUrl(buy!)).toThrow(/official web fallback/);
    expect(() => buildTwirpUrl(pay!)).toThrow(/official web fallback/);
  });
});

describe("twirp request and response parsing", () => {
  it("builds the fixed pc query and headers observed from the official client", () => {
    expect(buildTwirpQuery({ page: 2 })).toBe("device=pc&platform=web&nov=27&page=2");
    expect(buildTwirpHeaders({ origin: "https://manga.bilibili.com" })).toEqual({
      "content-type": "application/json",
      "x-bili-manga-from": "c-int-v1",
      origin: "https://manga.bilibili.com"
    });
  });

  it("parses the verified public SearchSug response shape", () => {
    const result = parseSearchSuggestionsResponse({ code: 0, msg: "", data: ["有兽焉"] });

    expect(result).toEqual({ ok: true, data: ["有兽焉"] });
  });

  it("maps non-zero twirp codes to server errors", () => {
    const result = parseTwirpEnvelope({ code: -101, msg: "账号未登录", data: null });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "server",
        code: -101,
        message: "账号未登录"
      }
    });
  });

  it("rejects malformed SearchSug data instead of silently accepting it", () => {
    const result = parseSearchSuggestionsResponse({ code: 0, msg: "", data: [{ title: "有兽焉" }] });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "SearchSug response data must be a string array"
      }
    });
  });

  it("rejects malformed twirp envelopes", () => {
    const result = parseTwirpEnvelope({ msg: "missing code", data: [] });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "Twirp response must include a numeric code"
      }
    });
  });

  it("builds the observed purchased comics request without requiring a Cookie value in the domain layer", () => {
    const result = buildPurchasedComicsRequest(1, 15);

    expect(result).toEqual({
      ok: true,
      data: expect.objectContaining({
        url: "https://manga.bilibili.com/twirp/user.v1.User/GetAutoBuyComics?device=pc&platform=web&nov=27",
        query: "device=pc&platform=web&nov=27",
        headers: {
          "content-type": "application/json",
          "x-bili-manga-from": "c-int-v1",
          origin: "https://manga.bilibili.com",
          referer: "https://manga.bilibili.com/account-center"
        },
        body: { page_num: 1, page_size: 15 }
      })
    });
  });

  it("rejects invalid purchased comics pagination before a network request exists", () => {
    expect(buildPurchasedComicsRequest(0, 15)).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics page_num must be an integer greater than 0"
      }
    });
    expect(buildPurchasedComicsRequest(1, 51)).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics page_size must be between 1 and 50"
      }
    });
  });

  it("parses purchased comics from the research-report candidate schema", () => {
    const result = parsePurchasedComicsResponse({
      code: 0,
      msg: "",
      data: [
        {
          id: 11,
          comic_id: "33354",
          comic_title: "有兽焉",
          vcover: "https://example.invalid/cover.jpg",
          bought_ep_count: 12,
          last_ord: 45.5,
          last_short_title: "第45话",
          bug_type: 2,
          enable_auto_pay: false,
          orders: [{ order_id: "redacted" }]
        }
      ]
    });

    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: 11,
          comic_id: 33354,
          comic_title: "有兽焉",
          vcover: "https://example.invalid/cover.jpg",
          bought_ep_count: 12,
          last_ord: 45.5,
          last_short_title: "第45话",
          buy_type: 2,
          enable_auto_pay: false,
          orders: [{ order_id: "redacted" }]
        }
      ]
    });
  });

  it("rejects malformed purchased comics data instead of silently accepting it", () => {
    expect(parsePurchasedComicsResponse({ code: 0, msg: "", data: {} })).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics response data must be an array"
      }
    });
    expect(parsePurchasedComicsResponse({ code: 0, msg: "", data: [{ comic_id: 1 }] })).toEqual({
      ok: false,
      error: {
        kind: "schema",
        message: "GetAutoBuyComics item 0 must include comic_id and comic_title"
      }
    });
  });
});
