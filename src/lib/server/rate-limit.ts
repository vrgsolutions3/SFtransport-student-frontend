import { LRUCache } from "lru-cache";

type RateLimitStore = {
  count: number;
  resetAt: number;
};

const rateLimitCache = new LRUCache<string, RateLimitStore>({
  max: 500,
  ttl: 60000,
});

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const existing = rateLimitCache.get(identifier);

  if (!existing || existing.resetAt < now) {
    rateLimitCache.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;
  return true;
}
