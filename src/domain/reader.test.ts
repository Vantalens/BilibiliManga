import { describe, expect, it } from "vitest";
import { applyReaderAction, clampProgress, getNextPageIndex, getPreviousPageIndex, type ReaderViewState } from "./reader";

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


describe("reader view state", () => {
  const baseState: ReaderViewState = {
    mode: "scroll",
    immersive: false,
    pageIndex: 1,
    totalPages: 4,
  };

  it("switches between scroll and page modes without losing valid page progress", () => {
    expect(applyReaderAction(baseState, { type: "set_mode", mode: "page" })).toEqual({
      ...baseState,
      mode: "page",
    });
    expect(applyReaderAction({ ...baseState, pageIndex: 10 }, { type: "set_mode", mode: "page" }).pageIndex).toBe(3);
  });

  it("handles keyboard navigation and immersive toggles", () => {
    expect(applyReaderAction(baseState, { type: "next_page" }).pageIndex).toBe(2);
    expect(applyReaderAction(baseState, { type: "previous_page" }).pageIndex).toBe(0);
    expect(applyReaderAction(baseState, { type: "toggle_immersive" }).immersive).toBe(true);
    expect(applyReaderAction({ ...baseState, immersive: true }, { type: "exit_immersive" }).immersive).toBe(false);
  });
});
