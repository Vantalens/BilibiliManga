import { describe, expect, it } from "vitest";
import { planCacheEviction } from "./cache";

describe("cache eviction planning", () => {
  it("evicts expired entries first and then least recently used entries until under limit", () => {
    const result = planCacheEviction({
      now: 1_000,
      maxBytes: 100,
      entries: [
        { id: "fresh-large", sizeBytes: 80, lastAccessedAt: 900, expiresAt: 2_000 },
        { id: "fresh-small-old", sizeBytes: 40, lastAccessedAt: 100, expiresAt: 2_000 },
        { id: "expired", sizeBytes: 10, lastAccessedAt: 950, expiresAt: 999 }
      ]
    });

    expect(result.evictIds).toEqual(["expired", "fresh-small-old"]);
    expect(result.remainingBytes).toBe(80);
  });
});

