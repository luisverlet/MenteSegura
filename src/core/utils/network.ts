
type RetryContext = {
  attempt: number;
  retriesLeft: number;
  status?: number;
  error?: unknown;
};

type FetchRetryConfig = {
  onRetry?: (context: RetryContext) => void;
};

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoff = 500,
  config: FetchRetryConfig = {},
  attempt = 1
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Render sometimes returns 502/503/504 when starting up
    if (!response.ok && [502, 503, 504].includes(response.status) && retries > 0) {
      config.onRetry?.({
        attempt,
        retriesLeft: retries,
        status: response.status,
      });
      console.warn(`Fetch failed with ${response.status}, retrying... (${retries} left)`);
      throw new Error(`Status ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      config.onRetry?.({
        attempt,
        retriesLeft: retries,
        error,
      });
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5, config, attempt + 1);
    }
    throw error;
  }
}
