import { describe, expect, it } from "vitest";
import { currentReleasePolicy } from "./releasePolicy";

describe("release policy", () => {
  it("does not claim auto-update readiness for internal builds", () => {
    expect(currentReleasePolicy()).toMatchObject({
      channel: "internal",
      updaterArtifactsEnabled: false,
      canClaimAutoUpdateReady: false
    });
  });

  it("requires signing material and HTTPS endpoint before release", () => {
    expect(currentReleasePolicy()).toMatchObject({
      requiresSigningKey: true,
      requiresHttpsEndpoint: true
    });
  });
});

