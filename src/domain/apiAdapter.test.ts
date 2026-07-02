import { describe, expect, it } from "vitest";
import {
  apiResearchCatalog,
  assertNativeEndpointAllowed,
  assertTwirpEndpointAllowed,
  buildTwirpHeaders,
  buildTwirpQuery,
  buildTwirpUrl,
  getBlockedNativeEndpoints,
  getBlockedTwirpEndpoints,
  observedOfficialJsTwirpBaseUrl,
  observedTwirpEndpoints,
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
});
