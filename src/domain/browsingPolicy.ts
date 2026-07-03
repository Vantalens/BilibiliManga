export type ComicBrowseState = "public" | "free" | "unlocked" | "locked" | "unknown";

export interface ComicBrowsingDecision {
  state: ComicBrowseState;
  canShowMetadata: boolean;
  canShowChapterList: boolean;
  canReadImagesInApp: boolean;
  canCacheImages: boolean;
  requiresOfficialWebForReading: boolean;
  message: string;
}

export function decideComicBrowsing(state: ComicBrowseState): ComicBrowsingDecision {
  if (state === "free" || state === "unlocked") {
    return {
      state,
      canShowMetadata: true,
      canShowChapterList: true,
      canReadImagesInApp: true,
      canCacheImages: true,
      requiresOfficialWebForReading: false,
      message: state === "free" ? "免费章节可在应用内阅读。" : "已解锁章节可在应用内阅读。"
    };
  }

  if (state === "locked") {
    return {
      state,
      canShowMetadata: true,
      canShowChapterList: true,
      canReadImagesInApp: false,
      canCacheImages: false,
      requiresOfficialWebForReading: true,
      message: "未购买漫画允许浏览公开信息和章节目录；锁定章节图片必须跳转官方网页处理。"
    };
  }

  if (state === "public") {
    return {
      state,
      canShowMetadata: true,
      canShowChapterList: true,
      canReadImagesInApp: false,
      canCacheImages: false,
      requiresOfficialWebForReading: false,
      message: "公开漫画信息可在应用内浏览；章节图片需等待免费或已解锁状态确认。"
    };
  }

  return {
    state,
    canShowMetadata: true,
    canShowChapterList: false,
    canReadImagesInApp: false,
    canCacheImages: false,
    requiresOfficialWebForReading: true,
    message: "权益状态未知时只展示已获得的公开信息，阅读章节前需要官方网页确认。"
  };
}
