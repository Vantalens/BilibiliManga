import { describe, expect, it } from "vitest";
import {
  apiResearchCatalog,
  assertNativeEndpointAllowed,
  getBlockedNativeEndpoints
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
});

