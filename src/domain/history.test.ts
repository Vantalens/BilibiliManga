import { describe, expect, it } from "vitest";
import { buildReadingHistoryRows } from "./history";

const detail = {
  id: 33354,
  title: "黑化男主顺毛指南",
  episodes: [
    { id: 1127034, short_title: "001", title: "人设预告" },
    { id: 1127035, short_title: "002", title: "第一话" },
  ],
};

describe("reading history rows", () => {
  it("uses comic and episode titles when detail data is available", () => {
    const rows = buildReadingHistoryRows([
      {
        id: "manga:33354:episode:1127034",
        manga_id: "33354",
        chapter_id: "1127034",
        page_index: 2,
        mode: "page",
        updated_at: 1000,
      },
    ], new Map([[33354, detail]]));

    expect(rows).toEqual([
      {
        id: "manga:33354:episode:1127034",
        comicId: 33354,
        episodeId: 1127034,
        comicTitle: "黑化男主顺毛指南",
        episodeTitle: "001 · 人设预告",
        pageIndex: 2,
        mode: "page",
        updatedAt: 1000,
        canOpen: true,
      },
    ]);
  });

  it("falls back to stable labels when detail data is missing", () => {
    const rows = buildReadingHistoryRows([
      {
        id: "bad",
        manga_id: "not-a-number",
        chapter_id: "12",
        page_index: 0,
        mode: "scroll",
        updated_at: 2000,
      },
    ], new Map());

    expect(rows[0]).toMatchObject({
      comicTitle: "未知漫画",
      episodeTitle: "章节 12",
      canOpen: false,
    });
  });
});
