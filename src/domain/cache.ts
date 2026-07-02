export interface CacheEntry {
  id: string;
  sizeBytes: number;
  lastAccessedAt: number;
  expiresAt: number;
}

export interface CacheEvictionInput {
  now: number;
  maxBytes: number;
  entries: CacheEntry[];
}

export interface CacheEvictionPlan {
  evictIds: string[];
  remainingBytes: number;
}

export function planCacheEviction(input: CacheEvictionInput): CacheEvictionPlan {
  const expiredEntries = input.entries
    .filter((entry) => entry.expiresAt <= input.now)
    .sort((a, b) => a.expiresAt - b.expiresAt || a.lastAccessedAt - b.lastAccessedAt);

  const expiredIds = new Set(expiredEntries.map((entry) => entry.id));
  const retainedEntries = input.entries.filter((entry) => !expiredIds.has(entry.id));
  let remainingBytes = retainedEntries.reduce((total, entry) => total + entry.sizeBytes, 0);
  const evictIds = expiredEntries.map((entry) => entry.id);

  if (remainingBytes > input.maxBytes) {
    const lruEntries = [...retainedEntries].sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt || a.sizeBytes - b.sizeBytes
    );

    for (const entry of lruEntries) {
      if (remainingBytes <= input.maxBytes) {
        break;
      }

      evictIds.push(entry.id);
      remainingBytes -= entry.sizeBytes;
    }
  }

  return {
    evictIds,
    remainingBytes: Math.max(0, remainingBytes)
  };
}

