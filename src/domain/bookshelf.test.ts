import { describe, expect, it } from "vitest";
import { createLibraryItemFromClassPageComic } from "./bookshelf";

describe("bookshelf helpers", () => {
  it("creates local bookshelf items from public manga cards", () => {
    expect(
      createLibraryItemFromClassPageComic(
        {
          id: 33354,
          title: "有兽焉",
          vertical_cover: "//example.invalid/cover.jpg",
          author_name: ["靴下猫腰子"],
          styles: ["治愈", "古风"],
          is_finish: 0,
          last_ord: 120,
          last_short_title: "第120话"
        },
        1000
      )
    ).toEqual({
      id: "manga:33354",
      title: "有兽焉",
      groups: ["书架"],
      tags: ["治愈", "古风"],
      rating: 0,
      notes: "",
      unread_chapters: 0,
      created_at: 1000,
      updated_at: 1000
    });
  });
});
