import { describe, expect, it } from "vitest";
import { decideAuth, refreshAuthAfterOfficialLogin } from "./auth";

describe("auth decisions", () => {
  it("allows account features only when authenticated", () => {
    expect(decideAuth("authenticated")).toMatchObject({
      canUseAccountFeatures: true,
      requiresOfficialLogin: false
    });
    expect(decideAuth("unauthenticated")).toMatchObject({
      canUseAccountFeatures: false,
      requiresOfficialLogin: true
    });
    expect(decideAuth("expired")).toMatchObject({
      canUseAccountFeatures: false,
      requiresOfficialLogin: true
    });
  });

  it("does not grant account features when official login result is still unconfirmed", () => {
    expect(refreshAuthAfterOfficialLogin("unauthenticated", "authenticated")).toMatchObject({
      state: "authenticated",
      returnedFromOfficialLogin: true
    });
    expect(refreshAuthAfterOfficialLogin("unauthenticated", "unauthenticated")).toMatchObject({
      state: "unauthenticated",
      returnedFromOfficialLogin: true
    });
    expect(refreshAuthAfterOfficialLogin("authenticated", "unauthenticated")).toMatchObject({
      state: "expired",
      returnedFromOfficialLogin: true
    });
  });
});
