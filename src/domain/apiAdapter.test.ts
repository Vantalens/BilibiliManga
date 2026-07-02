import { describe, expect, it } from "vitest";
import {
  apiResearchCatalog,
  assertNativeEndpointAllowed,
  assertTwirpEndpointAllowed,
  buildTwirpUrl,
  getBlockedNativeEndpoints,
  getBlockedTwirpEndpoints,
  observedTwirpEndpoints,
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

    expect(observedTwirpEndpoints.map((endpoint) => endpoint.path)).toEqual(
      expect.arrayContaining([
        "/bookshelf.v1.Bookshelf/ListFavorite",
        "/bookshelf.v1.Bookshelf/ListHistory",
        "/comic.v1.Comic/SearchSug"
      ])
    );
    expect(blocked.map((endpoint) => endpoint.id)).toEqual(
      expect.arrayContaining(["USER-WALLET", "USER-CARD-INFO"])
    );
  });

  it("builds native twirp urls only for allowed observed endpoints", () => {
    const search = observedTwirpEndpoints.find((endpoint) => endpoint.id === "SEARCH-SUGGESTION");
    const wallet = observedTwirpEndpoints.find((endpoint) => endpoint.id === "USER-WALLET");

    expect(buildTwirpUrl(search!)).toBe(`${twirpBaseUrl}/comic.v1.Comic/SearchSug`);
    expect(() => assertTwirpEndpointAllowed(wallet!)).toThrow(/official web fallback/);
    expect(() => buildTwirpUrl(wallet!)).toThrow(/official web fallback/);
  });
});
