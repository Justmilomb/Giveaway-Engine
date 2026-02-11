import { Page } from "puppeteer";
import { log } from "../log";
import { InstagramComment } from "../instagram";

/**
 * Direct Instagram GraphQL/API client.
 * Runs fetch() inside the browser page context so session cookies are included
 * automatically — no need to extract or manage cookies manually.
 */
export class InstagramApiClient {
    // Maximum time (ms) to spend on API calls before returning what we have
    private static readonly API_TIME_BUDGET_MS = 35_000; // 35 seconds

    /**
     * Primary entry point: fetch comments for a post via direct API calls.
     * Tries GraphQL first, then supplements with v1 REST API.
     * Enforces a total time budget so the scraper stays under 60s.
     */
    async fetchComments(
        page: Page,
        postUrl: string,
        targetCount: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const shortcode = this.extractShortcode(postUrl);
        if (!shortcode) {
            log(`API client: could not extract shortcode from ${postUrl}`, "scraper");
            return { comments: [], hasMore: false };
        }

        const deadline = Date.now() + InstagramApiClient.API_TIME_BUDGET_MS;
        log(`Phase 1: Direct API extraction (shortcode=${shortcode}, budget=${InstagramApiClient.API_TIME_BUDGET_MS / 1000}s)`, "scraper");

        // Accumulate comments across both API methods
        const allComments = new Map<string, InstagramComment>();

        // Step 1: GraphQL
        try {
            const result = await this.fetchViaGraphQL(page, shortcode, targetCount, deadline);
            for (const c of result.comments) {
                const key = `${c.username}:${c.text.substring(0, 50)}`;
                if (!allComments.has(key)) allComments.set(key, c);
            }
            log(`GraphQL API returned ${result.comments.length} comments (unique: ${allComments.size})`, "scraper");
        } catch (err) {
            log(`GraphQL API failed: ${err instanceof Error ? err.message : err}`, "scraper");
        }

        // Step 2: v1 REST API supplement (only if time remains)
        if (allComments.size < targetCount && Date.now() < deadline) {
            try {
                const mediaId = await this.extractMediaId(page);
                if (mediaId) {
                    const remaining = targetCount - allComments.size;
                    log(`v1 API supplement (mediaId=${mediaId}, need ${remaining} more, ${Math.round((deadline - Date.now()) / 1000)}s left)`, "scraper");
                    const result = await this.fetchViaV1Api(page, mediaId, targetCount, deadline);
                    let newCount = 0;
                    for (const c of result.comments) {
                        const key = `${c.username}:${c.text.substring(0, 50)}`;
                        if (!allComments.has(key)) {
                            allComments.set(key, c);
                            newCount++;
                        }
                    }
                    log(`v1 API added ${newCount} new comments (total: ${allComments.size})`, "scraper");
                }
            } catch (err) {
                log(`v1 API failed: ${err instanceof Error ? err.message : err}`, "scraper");
            }
        } else if (Date.now() >= deadline) {
            log(`Time budget exhausted, skipping v1 supplement (have ${allComments.size} comments)`, "scraper");
        }

        return {
            comments: Array.from(allComments.values()),
            hasMore: allComments.size >= targetCount,
        };
    }

    // ── Shortcode Extraction ──────────────────────────────────────────────

    private extractShortcode(url: string): string | null {
        const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
        return match ? match[2] : null;
    }

    // ── Media ID Extraction (for v1 API) ──────────────────────────────────

    private async extractMediaId(page: Page): Promise<string | null> {
        return page.evaluate(() => {
            // Method 1: meta tag
            const meta = document.querySelector('meta[property="al:ios:url"]');
            if (meta) {
                const content = meta.getAttribute("content") || "";
                const m = content.match(/media\?id=(\d+)/);
                if (m) return m[1];
            }
            // Method 2: page source regex (additionalData / __media_id)
            const html = document.documentElement.innerHTML;
            const patterns = [
                /"media_id":"(\d+)"/,
                /"pk":"(\d+)"/,
                /instagram:\/\/media\?id=(\d+)/,
            ];
            for (const p of patterns) {
                const m = html.match(p);
                if (m) return m[1];
            }
            return null;
        });
    }

    // ── Shared fetch helper ─────────────────────────────────────────────

    private async igFetch(page: Page, url: string): Promise<any> {
        return page.evaluate(async (fetchUrl: string) => {
            try {
                const res = await fetch(fetchUrl, {
                    credentials: "include",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-IG-App-ID": "936619743392459",
                    },
                });
                if (!res.ok) return null;
                return res.json();
            } catch {
                return null;
            }
        }, url);
    }

    private addComment(
        map: Map<string, InstagramComment>,
        node: any
    ): boolean {
        const username = node.owner?.username || node.user?.username;
        const text = node.text;
        if (!username || !text) return false;

        const key = `${username}:${text.substring(0, 50)}`;
        if (map.has(key)) return false;

        map.set(key, {
            id: String(node.id || node.pk || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`),
            username,
            text,
            timestamp: node.created_at
                ? new Date(node.created_at * 1000).toISOString()
                : new Date().toISOString(),
            likes: node.edge_liked_by?.count || node.comment_like_count || node.like_count || 0,
            avatar: node.owner?.profile_pic_url || node.user?.profile_pic_url || undefined,
        });
        return true;
    }

    // ── GraphQL Fetcher ───────────────────────────────────────────────────

    private async fetchViaGraphQL(
        page: Page,
        shortcode: string,
        targetCount: number,
        deadline: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const allComments = new Map<string, InstagramComment>();
        let endCursor: string | null = null;
        let hasNext = true;
        const PER_PAGE = 50;
        const MAX_PAGES = Math.ceil(targetCount / PER_PAGE) + 2;

        // Two common query hashes for parent comments
        const queryHashes = [
            "bc3296d1ce80a24b1b6e40b1e72903f5",
            "97b41c52301f77ce508f55e66d17620e",
        ];

        // Query hash for threaded (reply) comments
        const threadQueryHash = "51fdd02b67508306ad4484ff574a0b62";

        // Collect parent comment IDs that have more replies to fetch
        const threadsToFetch: { commentId: string; cursor: string }[] = [];

        // ── Phase A: Fetch all parent comments ────────────────────────
        for (let pageNum = 0; pageNum < MAX_PAGES && hasNext && Date.now() < deadline; pageNum++) {
            const variables: Record<string, any> = {
                shortcode,
                first: PER_PAGE,
            };
            if (endCursor) variables.after = endCursor;

            let data: any = null;
            for (const hash of queryHashes) {
                const url =
                    `https://www.instagram.com/graphql/query/?query_hash=${hash}` +
                    `&variables=${encodeURIComponent(JSON.stringify(variables))}`;
                data = await this.igFetch(page, url);
                if (data) break;
            }

            if (!data) {
                log(`GraphQL page ${pageNum + 1}: no response from any query hash`, "scraper");
                break;
            }

            const media =
                data?.data?.shortcode_media ??
                data?.data?.xdt_shortcode_media ??
                data?.shortcode_media;

            const commentEdge =
                media?.edge_media_to_parent_comment ??
                media?.edge_media_to_comment;

            if (!commentEdge) {
                log(`GraphQL page ${pageNum + 1}: no comment edge found in response`, "scraper");
                break;
            }

            const edges = commentEdge.edges || [];
            let newCount = 0;

            for (const edge of edges) {
                const node = edge?.node;
                if (!node) continue;

                if (this.addComment(allComments, node)) newCount++;

                // Grab preview threaded replies included inline
                const threaded = node.edge_threaded_comments;
                const threadedEdges = threaded?.edges || [];
                for (const te of threadedEdges) {
                    if (te?.node && this.addComment(allComments, te.node)) newCount++;
                }

                // Queue full thread fetch if more replies exist beyond the preview
                if (threaded?.page_info?.has_next_page && threaded?.page_info?.end_cursor) {
                    threadsToFetch.push({
                        commentId: String(node.id),
                        cursor: threaded.page_info.end_cursor,
                    });
                }
            }

            // Pagination for parent comments
            const pageInfo = commentEdge.page_info;
            hasNext = pageInfo?.has_next_page === true;
            endCursor = pageInfo?.end_cursor || null;

            log(
                `GraphQL parents page ${pageNum + 1}: +${newCount} comments (total: ${allComments.size}), ` +
                `threads queued: ${threadsToFetch.length}, hasNext=${hasNext}`,
                "scraper"
            );

            if (allComments.size >= targetCount) break;
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
        }

        // ── Phase B: Fetch all threaded replies ───────────────────────
        if (allComments.size < targetCount && threadsToFetch.length > 0 && Date.now() < deadline) {
            log(`Fetching replies for ${threadsToFetch.length} comment threads (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

            for (let ti = 0; ti < threadsToFetch.length; ti++) {
                if (allComments.size >= targetCount || Date.now() >= deadline) break;

                const thread = threadsToFetch[ti];
                let threadCursor: string | null = thread.cursor;
                let threadHasNext = true;
                const MAX_THREAD_PAGES = 20;

                for (let tp = 0; tp < MAX_THREAD_PAGES && threadHasNext && threadCursor; tp++) {
                    const variables = {
                        comment_id: thread.commentId,
                        first: PER_PAGE,
                        after: threadCursor,
                    };
                    const url =
                        `https://www.instagram.com/graphql/query/?query_hash=${threadQueryHash}` +
                        `&variables=${encodeURIComponent(JSON.stringify(variables))}`;

                    const data = await this.igFetch(page, url);
                    if (!data) break;

                    const threadedEdge =
                        data?.data?.comment?.edge_threaded_comments;
                    if (!threadedEdge) break;

                    let newCount = 0;
                    for (const edge of threadedEdge.edges || []) {
                        if (edge?.node && this.addComment(allComments, edge.node)) newCount++;
                    }

                    threadHasNext = threadedEdge.page_info?.has_next_page === true;
                    threadCursor = threadedEdge.page_info?.end_cursor || null;

                    if (newCount > 0 && (ti % 10 === 0 || tp > 0)) {
                        log(
                            `Thread ${ti + 1}/${threadsToFetch.length} page ${tp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (allComments.size >= targetCount) break;
                    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
                }
            }
        }

        log(`GraphQL complete: ${allComments.size} total comments`, "scraper");
        return {
            comments: Array.from(allComments.values()),
            hasMore: hasNext,
        };
    }

    // ── v1 REST API Fetcher ───────────────────────────────────────────────

    private async fetchViaV1Api(
        page: Page,
        mediaId: string,
        targetCount: number,
        deadline: number
    ): Promise<{ comments: InstagramComment[]; hasMore: boolean }> {
        const allComments = new Map<string, InstagramComment>();
        let minId: string | null = null;
        let hasMore = true;
        const MAX_PAGES = Math.ceil(targetCount / 20) + 2;

        // Collect parent comment PKs with more child comments to fetch
        const childThreads: { commentPk: string; cursor: string }[] = [];

        // ── Phase A: parent comments ──────────────────────────────────
        for (let pageNum = 0; pageNum < MAX_PAGES && hasMore && Date.now() < deadline; pageNum++) {
            let apiUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/?can_support_threading=true&permalink_enabled=false`;
            if (minId) apiUrl += `&min_id=${minId}`;

            const data = await this.igFetch(page, apiUrl);

            if (!data) {
                log(`v1 API page ${pageNum + 1}: no response`, "scraper");
                break;
            }

            const rawComments: any[] = data.comments || [];
            let newCount = 0;

            for (const c of rawComments) {
                if (this.addComment(allComments, c)) newCount++;

                // Grab inline preview child comments
                const children: any[] = c.preview_child_comments || c.child_comments || [];
                for (const child of children) {
                    if (this.addComment(allComments, child)) newCount++;
                }

                // Queue full child thread fetch if there are more replies
                const childCount = c.child_comment_count || 0;
                const inlineCount = children.length;
                if (childCount > inlineCount && c.pk) {
                    childThreads.push({
                        commentPk: String(c.pk),
                        cursor: children.length > 0 ? String(children[children.length - 1]?.pk || "") : "",
                    });
                }
            }

            hasMore = data.has_more_comments === true || data.next_min_id != null;
            minId = data.next_min_id || null;

            log(
                `v1 API page ${pageNum + 1}: +${newCount} comments (total: ${allComments.size}), ` +
                `childThreads queued: ${childThreads.length}, hasMore=${hasMore}`,
                "scraper"
            );

            if (allComments.size >= targetCount) break;
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
        }

        // ── Phase B: fetch child comment threads ──────────────────────
        if (allComments.size < targetCount && childThreads.length > 0 && Date.now() < deadline) {
            log(`Fetching child replies for ${childThreads.length} threads via v1 API (${Math.round((deadline - Date.now()) / 1000)}s left)...`, "scraper");

            for (let ti = 0; ti < childThreads.length; ti++) {
                if (allComments.size >= targetCount || Date.now() >= deadline) break;

                const thread = childThreads[ti];
                let childMinId: string | null = thread.cursor || null;
                let childHasMore = true;
                const MAX_CHILD_PAGES = 20;

                for (let cp = 0; cp < MAX_CHILD_PAGES && childHasMore; cp++) {
                    let childUrl = `https://www.instagram.com/api/v1/media/${mediaId}/comments/${thread.commentPk}/child_comments/?`;
                    if (childMinId) childUrl += `min_id=${childMinId}&`;

                    const childData = await this.igFetch(page, childUrl);
                    if (!childData) break;

                    let newCount = 0;
                    const childComments: any[] = childData.child_comments || [];
                    for (const child of childComments) {
                        if (this.addComment(allComments, child)) newCount++;
                    }

                    childHasMore = childData.has_more_head_child_comments === true ||
                                   childData.next_min_child_cursor != null;
                    childMinId = childData.next_min_child_cursor || null;

                    if (newCount > 0 && (ti % 10 === 0 || cp > 0)) {
                        log(
                            `v1 child thread ${ti + 1}/${childThreads.length} page ${cp + 1}: +${newCount} (total: ${allComments.size})`,
                            "scraper"
                        );
                    }

                    if (allComments.size >= targetCount) break;
                    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
                }
            }
        }

        log(`v1 API complete: ${allComments.size} total comments`, "scraper");
        return {
            comments: Array.from(allComments.values()),
            hasMore,
        };
    }
}
