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

