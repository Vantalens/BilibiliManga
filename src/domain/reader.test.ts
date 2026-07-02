import { describe, expect, it } from "vitest";
import { clampProgress, getNextPageIndex, getPreviousPageIndex } from "./reader";

describe("reader progress helpers", () => {
  it("clamps progress into the available page range", () => {
    expect(clampProgress({ pageIndex: -4, totalPages: 12 })).toBe(0);
    expect(clampProgress({ pageIndex: 42, totalPages: 12 })).toBe(11);
    expect(clampProgress({ pageIndex: 5, totalPages: 12 })).toBe(5);
  });

  it("keeps page navigation inside chapter bounds", () => {
    expect(getPreviousPageIndex({ pageIndex: 0, totalPages: 8 })).toBe(0);
    expect(getPreviousPageIndex({ pageIndex: 3, totalPages: 8 })).toBe(2);
    expect(getNextPageIndex({ pageIndex: 7, totalPages: 8 })).toBe(7);
    expect(getNextPageIndex({ pageIndex: 3, totalPages: 8 })).toBe(4);
  });
});

