
export async function fetchWithRetry(
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  backoff = 500
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Render sometimes returns 502/503/504 when starting up
    if (!response.ok && [502, 503, 504].includes(response.status) && retries > 0) {
      console.warn(`Fetch failed with ${response.status}, retrying... (${retries} left)`);
      throw new Error(`Status ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
    }
    throw error;
  }
}
