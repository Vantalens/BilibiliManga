export interface LibraryItem {
  id: string;
  title: string;
  groups: string[];
  tags: string[];
  rating: number;
  unreadChapters: number;
}

export interface LibraryFilter {
  query?: string;
  group?: string;
  tag?: string;
  minRating?: number;
}

export interface LibrarySummary {
  totalItems: number;
  unreadItems: number;
  unreadChapters: number;
  averageRating: number;
}

export function filterLibraryItems(items: LibraryItem[], filter: LibraryFilter): LibraryItem[] {
  const query = filter.query?.trim().toLowerCase();

  return items.filter((item) => {
    const matchesQuery = !query || item.title.toLowerCase().includes(query);
    const matchesGroup = !filter.group || item.groups.includes(filter.group);
    const matchesTag = !filter.tag || item.tags.includes(filter.tag);
    const matchesRating = filter.minRating === undefined || item.rating >= filter.minRating;

    return matchesQuery && matchesGroup && matchesTag && matchesRating;
  });
}

export function summarizeLibrary(items: LibraryItem[]): LibrarySummary {
  const totalRating = items.reduce((total, item) => total + item.rating, 0);
  const unreadChapters = items.reduce((total, item) => total + item.unreadChapters, 0);

  return {
    totalItems: items.length,
    unreadItems: items.filter((item) => item.unreadChapters > 0).length,
    unreadChapters,
    averageRating: items.length === 0 ? 0 : totalRating / items.length
  };
}

