import { describe, expect, it } from "vitest";
import { buildOfficialSearchUrl, normalizeSearchKeyword } from "./search";

describe("search helpers", () => {
  it("normalizes whitespace and caps search keywords", () => {
    expect(normalizeSearchKeyword("  有兽焉   最新  ")).toBe("有兽焉 最新");
    expect(normalizeSearchKeyword("a".repeat(90))).toHaveLength(80);
  });

  it("builds official manga search urls without calling the unverified Search endpoint", () => {
    expect(buildOfficialSearchUrl("有兽焉")).toBe("https://manga.bilibili.com/search?keyword=%E6%9C%89%E5%85%BD%E7%84%89");
    expect(buildOfficialSearchUrl("   ")).toBe("https://manga.bilibili.com/search");
  });
});
