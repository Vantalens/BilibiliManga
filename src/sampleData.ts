import type { LibraryItem } from "./domain/library";

export const sampleLibraryItems: LibraryItem[] = [
  {
    id: "star-sea",
    title: "星海回声",
    groups: ["追更", "科幻"],
    tags: ["科幻", "长篇"],
    rating: 5,
    notes: "重点追更，优先验证长滚动阅读体验",
    unreadChapters: 2
  },
  {
    id: "night-walk",
    title: "夜行札记",
    groups: ["完结"],
    tags: ["悬疑", "短篇"],
    rating: 4,
    notes: "完结作品，用于筛选和统计回归",
    unreadChapters: 0
  },
  {
    id: "daily-city",
    title: "星城日常",
    groups: ["追更"],
    tags: ["日常", "治愈"],
    rating: 3,
    notes: "轻量章节，适合分页模式检查",
    unreadChapters: 1
  }
];

export const sampleReaderPages = [
  {
    id: "page-1",
    label: "第 1 页",
    tone: "深色开场"
  },
  {
    id: "page-2",
    label: "第 2 页",
    tone: "动作分镜"
  },
  {
    id: "page-3",
    label: "第 3 页",
    tone: "过渡对白"
  }
];
