
type RetryContext = {
  attempt: number;
  retriesLeft: number;
  status?: number;
  error?: unknown;
};

type FetchRetryConfig = {
  onRetry?: (context: RetryContext) => void;
  cache?: boolean;
  cacheTtlMs?: number;
  dedupe?: boolean;
};

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const DEFAULT_CACHE_TTL_MS = 45_000;

const responseCache = new Map<string, { expiresAt: number; response: Response }>();
const inFlightRequests = new Map<string, Promise<Response>>();
let cacheGeneration = 0;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getHeaderValue = (headers: HeadersInit | undefined, name: string) => {
  if (!headers) return '';
  const normalizedName = name.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(name) || '';
  }

  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === normalizedName)?.[1] || '';
  }

  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === normalizedName);
  return String(match?.[1] || '');
};

const getRequestMethod = (options: RequestInit) => String(options.method || 'GET').toUpperCase();

const buildCacheKey = (url: string, options: RequestInit) => {
  const headers = options.headers;

  return JSON.stringify({
    method: getRequestMethod(options),
    url,
    authorization: getHeaderValue(headers, 'authorization'),
    contentType: getHeaderValue(headers, 'content-type'),
  });
};

export function clearFetchCache(urlPart?: string) {
  cacheGeneration += 1;

  if (!urlPart) {
    responseCache.clear();
    inFlightRequests.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    if (key.includes(urlPart)) responseCache.delete(key);
  }

  for (const key of inFlightRequests.keys()) {
    if (key.includes(urlPart)) inFlightRequests.delete(key);
  }
}

async function executeFetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number,
  backoff: number,
  config: FetchRetryConfig,
  attempt: number
) {
  let retriesLeft = retries;
  let nextBackoff = backoff;
  let currentAttempt = attempt;

  while (true) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && TRANSIENT_STATUS_CODES.has(response.status) && retriesLeft > 0) {
        config.onRetry?.({
          attempt: currentAttempt,
          retriesLeft,
          status: response.status,
        });
        console.warn(`Fetch failed with ${response.status}, retrying... (${retriesLeft} left)`);
        await sleep(nextBackoff);
        retriesLeft -= 1;
        nextBackoff *= 1.5;
        currentAttempt += 1;
        continue;
      }

      return response;
    } catch (error) {
      if (retriesLeft > 0) {
        config.onRetry?.({
          attempt: currentAttempt,
          retriesLeft,
          error,
        });
        await sleep(nextBackoff);
        retriesLeft -= 1;
        nextBackoff *= 1.5;
        currentAttempt += 1;
        continue;
      }

      throw error;
    }
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 500,
  config: FetchRetryConfig = {},
  attempt = 1
): Promise<Response> {
  const method = getRequestMethod(options);
  const canUseCache =
    method === 'GET' &&
    config.cache !== false &&
    options.cache !== 'no-store';
  const canDedupe = canUseCache && config.dedupe !== false;
  const cacheKey = canUseCache ? buildCacheKey(url, options) : '';

  if (canUseCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.response.clone();
    }

    if (cached) {
      responseCache.delete(cacheKey);
    }
  }

  if (canDedupe) {
    const pending = inFlightRequests.get(cacheKey);
    if (pending) {
      const response = await pending;
      return response.clone();
    }
  }

  const request = executeFetchWithRetry(url, options, retries, backoff, config, attempt);
  const requestCacheGeneration = cacheGeneration;

  if (canDedupe) {
    inFlightRequests.set(cacheKey, request);
  }

  try {
    const response = await request;

    if (method !== 'GET' && response.ok) {
      clearFetchCache();
    }

    if (canUseCache && response.ok && requestCacheGeneration === cacheGeneration) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + (config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS),
        response: response.clone(),
      });
    }

    return canUseCache ? response.clone() : response;
  } finally {
    if (canDedupe) {
      inFlightRequests.delete(cacheKey);
    }
  }
}
