export interface PagePosition {
  pageIndex: number;
  totalPages: number;
}

export function clampProgress(position: PagePosition): number {
  if (!Number.isFinite(position.totalPages) || position.totalPages <= 0) {
    return 0;
  }

  if (!Number.isFinite(position.pageIndex) || position.pageIndex <= 0) {
    return 0;
  }

  return Math.min(Math.trunc(position.pageIndex), Math.trunc(position.totalPages) - 1);
}

export function getPreviousPageIndex(position: PagePosition): number {
  return clampProgress({
    ...position,
    pageIndex: position.pageIndex - 1
  });
}

export function getNextPageIndex(position: PagePosition): number {
  return clampProgress({
    ...position,
    pageIndex: position.pageIndex + 1
  });
}



export type ReaderMode = "scroll" | "page";

export interface ReaderViewState {
  mode: ReaderMode;
  immersive: boolean;
  pageIndex: number;
  totalPages: number;
}

export type ReaderAction =
  | { type: "set_mode"; mode: ReaderMode }
  | { type: "set_page"; pageIndex: number }
  | { type: "next_page" }
  | { type: "previous_page" }
  | { type: "toggle_immersive" }
  | { type: "exit_immersive" };

export function applyReaderAction(state: ReaderViewState, action: ReaderAction): ReaderViewState {
  switch (action.type) {
    case "set_mode":
      return { ...state, mode: action.mode, pageIndex: clampProgress(state) };
    case "set_page":
      return { ...state, pageIndex: clampProgress({ ...state, pageIndex: action.pageIndex }) };
    case "next_page":
      return { ...state, pageIndex: getNextPageIndex(state) };
    case "previous_page":
      return { ...state, pageIndex: getPreviousPageIndex(state) };
    case "toggle_immersive":
      return { ...state, immersive: !state.immersive };
    case "exit_immersive":
      return { ...state, immersive: false };
  }
}
