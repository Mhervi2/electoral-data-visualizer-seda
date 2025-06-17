
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes
export const RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);
