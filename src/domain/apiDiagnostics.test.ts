import { describe, expect, it } from "vitest";
import { chooseDiagnosticComicId, chooseReadableDiagnosticEpisode, DEFAULT_DIAGNOSTIC_COMIC_ID } from "./apiDiagnostics";
import type { BookshelfItem, ClassPageComic, ComicDetailResult, ComicEpisode } from "../bridge/tauriBridge";

function bookshelfItem(comicId: number): BookshelfItem {
  return { comic_id: comicId, title: "书架漫画" };
}

function searchComic(id: number): ClassPageComic {
  return {
    id,
    title: "搜索漫画",
    vertical_cover: "",
    author_name: [],
    styles: [],
    is_finish: 0,
    last_ord: 0,
    last_short_title: "",
  };
}

function episode(id: number, locked: boolean, inFree: boolean): ComicEpisode {
  return {
    id,
    ord: id,
    short_title: String(id),
    title: "章节" + id,
    cover: "",
    is_locked: locked,
    is_in_free: inFree,
    image_count: 1,
    pub_time: "",
  };
}

function detail(episodes: ComicEpisode[]): ComicDetailResult {
  return {
    id: 1,
    title: "漫画",
    vertical_cover: "",
    horizontal_cover: "",
    author_name: [],
    styles: [],
    evaluate: "",
    is_finish: 0,
    total: episodes.length,
    episodes,
  };
}

describe("api diagnostics helpers", () => {
  it("chooses bookshelf comics before search and fallback ids", () => {
    expect(chooseDiagnosticComicId([bookshelfItem(101)], [searchComic(202)])).toBe(101);
  });

  it("uses search results when the bookshelf is empty", () => {
    expect(chooseDiagnosticComicId([], [searchComic(202)])).toBe(202);
  });

  it("uses a stable public fallback when no remote candidates exist", () => {
    expect(chooseDiagnosticComicId([], [])).toBe(DEFAULT_DIAGNOSTIC_COMIC_ID);
  });

  it("selects the first unlocked or free episode for image diagnostics", () => {
    expect(chooseReadableDiagnosticEpisode(detail([episode(1, true, false), episode(2, true, true)]))?.id).toBe(2);
  });

  it("returns null when all episodes are locked", () => {
    expect(chooseReadableDiagnosticEpisode(detail([episode(1, true, false)]))).toBeNull();
  });
});