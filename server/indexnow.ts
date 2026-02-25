import { log } from "./log";

const INDEXNOW_KEY = "2d3b9af4fb684c5cb646d6f9e42ffce8";
const BASE_URL = "https://pickusawinner.com";

// Search engines that support IndexNow
const INDEXNOW_ENGINES = [
  "https://api.indexnow.org/IndexNow", // Google + Bing via IndexNow.org
  "https://www.bing.com/IndexNow", // Bing direct
  "https://yandex.com/indexnow", // Yandex
];

// Track last submission time per URL to prevent rate limit issues
const lastSubmissionTimes = new Map<string, number>();

// Minimum time between submissions for the same URL (1 hour)
const SUBMISSION_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

// Queue for pending submissions (debounced)
const submissionQueue = new Set<string>();
let submissionTimer: NodeJS.Timeout | null = null;

/**
 * Submit URLs to IndexNow search engines
 * @param urls Array of relative URLs (e.g., ["/article/my-slug", "/tool"])
 * @returns Submission results
 */
export async function submitToIndexNow(
  urls: string[]
): Promise<{ success: boolean; results: { engine: string; status: number }[] }> {
  // Filter out URLs that were submitted recently
  const now = Date.now();
  const urlsToSubmit = urls.filter((url) => {
    const lastSubmission = lastSubmissionTimes.get(url);
    if (!lastSubmission) return true;
    return now - lastSubmission > SUBMISSION_COOLDOWN;
  });

  if (urlsToSubmit.length === 0) {
    log("[INDEXNOW] All URLs recently submitted, skipping");
    return { success: true, results: [] };
  }

  // Convert relative URLs to absolute
  const absoluteUrls = urlsToSubmit.map((u) => `${BASE_URL}${u}`);

  const payload = {
    host: "pickusawinner.com",
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: absoluteUrls,
  };

  const results: { engine: string; status: number }[] = [];

  // Submit to all IndexNow-supporting search engines
  for (const engine of INDEXNOW_ENGINES) {
    try {
      const response = await fetch(engine, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });

      results.push({ engine, status: response.status });

      // Log response
      if (response.ok) {
        log(`[INDEXNOW] ✅ ${engine} - Submitted ${absoluteUrls.length} URLs`);
      } else {
        log(
          `[INDEXNOW] ⚠️ ${engine} - Status ${response.status}: ${await response.text()}`
        );
      }
    } catch (error) {
      log(`[INDEXNOW] ❌ ${engine} - Failed: ${error}`);
      results.push({ engine, status: 0 });
    }
  }

  // Update last submission times
  urlsToSubmit.forEach((url) => {
    lastSubmissionTimes.set(url, now);
  });

  log(
    `[INDEXNOW] Submitted ${urlsToSubmit.length} URLs: ${JSON.stringify(results)}`
  );

  return { success: true, results };
}

/**
 * Schedule IndexNow submission with debouncing (5-minute delay)
 * Multiple calls within 5 minutes are batched into a single submission
 * @param url Relative URL to submit (e.g., "/article/my-slug")
 */
export function scheduleSubmission(url: string): void {
  submissionQueue.add(url);

  // Clear existing timer
  if (submissionTimer) {
    clearTimeout(submissionTimer);
  }

  // Schedule batch submission after 5 minutes
  submissionTimer = setTimeout(async () => {
    const urls = Array.from(submissionQueue);
    submissionQueue.clear();

    log(`[INDEXNOW] Processing queued submissions: ${urls.length} URLs`);
    await submitToIndexNow(urls);
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Batch submit all article URLs at once (useful for initial indexing)
 * @param articleSlugs Array of article slugs
 */
export async function batchSubmitArticles(
  articleSlugs: string[]
): Promise<void> {
  const urls = articleSlugs.map((slug) => `/article/${slug}`);
  await submitToIndexNow(urls);
}

/**
 * Submit a single URL immediately (bypasses debouncing)
 * @param url Relative URL to submit
 */
export async function submitImmediately(url: string): Promise<void> {
  await submitToIndexNow([url]);
}

/**
 * Get submission status for a URL
 * @param url Relative URL
 * @returns Last submission timestamp (ms) or null if never submitted
 */
export function getSubmissionStatus(url: string): number | null {
  return lastSubmissionTimes.get(url) || null;
}

/**
 * Clear submission cooldown for a URL (useful for testing)
 * @param url Relative URL
 */
export function clearCooldown(url: string): void {
  lastSubmissionTimes.delete(url);
}
