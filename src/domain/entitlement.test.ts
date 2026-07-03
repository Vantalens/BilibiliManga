import { describe, expect, it } from "vitest";
import { decideEntitlement, refreshEntitlementAfterOfficialWeb } from "./entitlement";

describe("entitlement decisions", () => {
  it("allows in-app reading only for accessible chapters", () => {
    expect(decideEntitlement("accessible")).toMatchObject({
      canReadInApp: true,
      requiresOfficialWeb: false
    });
  });

  it("routes locked chapters to the official web flow", () => {
    expect(decideEntitlement("locked")).toMatchObject({
      canReadInApp: false,
      requiresOfficialWeb: true
    });
  });

  it("routes unknown entitlement state to the official web flow", () => {
    expect(decideEntitlement("unknown")).toMatchObject({
      canReadInApp: false,
      requiresOfficialWeb: true
    });
  });

  it("refreshes entitlement after official web without granting unknown access", () => {
    expect(refreshEntitlementAfterOfficialWeb("locked", "accessible")).toMatchObject({
      state: "accessible",
      returnedFromOfficialWeb: true
    });
    expect(refreshEntitlementAfterOfficialWeb("locked", "unknown")).toMatchObject({
      state: "locked",
      returnedFromOfficialWeb: true
    });
  });
});
