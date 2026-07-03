import { describe, expect, it } from "vitest";
import { decideComicBrowsing } from "./browsingPolicy";

describe("comic browsing policy", () => {
  it("allows unpurchased comics to show public metadata and chapter lists", () => {
    expect(decideComicBrowsing("locked")).toMatchObject({
      canShowMetadata: true,
      canShowChapterList: true,
      canReadImagesInApp: false,
      canCacheImages: false,
      requiresOfficialWebForReading: true
    });
  });

  it("allows free and unlocked chapters to render images in app", () => {
    expect(decideComicBrowsing("free")).toMatchObject({
      canReadImagesInApp: true,
      canCacheImages: true,
      requiresOfficialWebForReading: false
    });
    expect(decideComicBrowsing("unlocked")).toMatchObject({
      canReadImagesInApp: true,
      canCacheImages: true,
      requiresOfficialWebForReading: false
    });
  });

  it("keeps unknown chapter access out of the in-app reader", () => {
    expect(decideComicBrowsing("unknown")).toMatchObject({
      canShowMetadata: true,
      canShowChapterList: false,
      canReadImagesInApp: false,
      requiresOfficialWebForReading: true
    });
  });

  it("does not cache images unless chapter access is free or unlocked", () => {
    expect(decideComicBrowsing("public")).toMatchObject({
      canShowMetadata: true,
      canShowChapterList: true,
      canReadImagesInApp: false,
      canCacheImages: false
    });
  });
});
