import { describe, expect, it } from "vitest";
import { filterLibraryItems, summarizeLibrary } from "./library";

const items = [
  { id: "1", title: "星海", groups: ["追更"], tags: ["科幻"], rating: 5, notes: "优先阅读", unreadChapters: 2 },
  { id: "2", title: "夜行", groups: ["完结"], tags: ["悬疑"], rating: 4, notes: "", unreadChapters: 0 },
  { id: "3", title: "星城", groups: ["追更"], tags: ["日常"], rating: 3, notes: "轻松", unreadChapters: 1 }
];

describe("library helpers", () => {
  it("filters by query, group, tag, and minimum rating", () => {
    expect(
      filterLibraryItems(items, {
        query: "星",
        group: "追更",
        tag: "科幻",
        minRating: 4
      }).map((item) => item.id)
    ).toEqual(["1"]);
  });

  it("matches query against titles and notes", () => {
    expect(filterLibraryItems(items, { query: "优先" }).map((item) => item.id)).toEqual(["1"]);
  });

  it("summarizes library totals for the dashboard", () => {
    expect(summarizeLibrary(items)).toEqual({
      totalItems: 3,
      unreadItems: 2,
      unreadChapters: 3,
      averageRating: 4
    });
  });
});
