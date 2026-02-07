import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import { log } from "../log";
import { ProxyManager, ProxyConfig } from "./proxy-manager";
import { SessionManager } from "./session-manager";
import { InstagramComment, FetchCommentsResult } from "../instagram";

// Add stealth plugin to evade detection
puppeteer.use(StealthPlugin());

export class InstagramScraper {
    private browser: Browser | null = null;
    private proxyManager: ProxyManager;
    private sessionManager: SessionManager;

    constructor() {
        this.proxyManager = new ProxyManager();
        this.sessionManager = new SessionManager();
    }

    /**
     * Launch browser with proxy if available
     */
    private async launchBrowser(): Promise<Browser> {
        const args = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            "--window-size=1366,768",
            "--disable-blink-features=AutomationControlled",
        ];

        const proxy = this.proxyManager.getNextProxy();
        if (proxy) {
            args.push(`--proxy-server=${this.proxyManager.getProxyServer(proxy)}`);
            log(`Using proxy: ${proxy.host}:${proxy.port}`, "scraper");
        }

        // Set headless to false to see the browser (for debugging)
        // Set SCRAPER_HEADLESS=true in .env to hide the browser (for production)
        const isHeadless = process.env.SCRAPER_HEADLESS === "true";
        log(`Launching browser (headless: ${isHeadless})...`, "scraper");
        const browser = await puppeteer.launch({
            headless: isHeadless,
            args,
            defaultViewport: { width: 1366, height: 768 },
        });

        return browser;
    }

    /**
     * Ensure we're logged in (restore session or login)
     */
    private async ensureLoggedIn(page: Page): Promise<boolean> {
        // Try to restore session first
        if (this.sessionManager.hasSession()) {
            await this.sessionManager.restoreSession(page);
            
            // Verify session is still valid
            const isValid = await this.sessionManager.verifySession(page);
            if (isValid) {
                return true;
            }
        }

        // Need to login
        const username = process.env.INSTAGRAM_USERNAME;
        const password = process.env.INSTAGRAM_PASSWORD;

        if (!username || !password) {
            log("INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD not set. Cannot login.", "scraper");
            return false;
        }

        return await this.sessionManager.login(this.browser!, username, password);
    }

    /**
     * Wait for a random amount of time (human-like behavior)
     */
    private async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * CRITICAL FIX 1: Enhanced button clicking for loading comments
     * This handles more variations of Instagram's comment loading buttons
     */
    private async clickLoadMoreButtons(page: Page): Promise<number> {
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('span, button, div, a, svg'));
            let clickedCount = 0;
            
            for (const el of elements) {
                const text = (el.textContent || '').trim();
                const ariaLabel = el.getAttribute('aria-label') || '';
                const className = el.className || '';
                
                // Pattern 1: "View all X comments" with comma separators (e.g., "View all 2,000 comments")
                if (/^View all\s+[\d,]+\s+comments?$/i.test(text)) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 2: "View X replies" or "View all X replies"
                else if (/^View (all\s+)?[\d,]+\s+replies?$/i.test(text)) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 3: "View replies" without number
                else if (/^View replies?$/i.test(text)) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 4: Text starting with "——" (Instagram's visual ellipsis for collapsed replies)
                else if (/^——/i.test(text)) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 5: Any element with text "Load more" (case insensitive)
                else if (/load more/i.test(text) || /show more/i.test(text)) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 6: Plus button with "Load more" in aria-label
                else if ((text === '+' || text.trim() === '+') &&
                    (ariaLabel.includes('Load more') || ariaLabel.includes('more comment'))) {
                    (el as HTMLElement).click();
                    clickedCount++;
                }
                
                // Pattern 7: Instagram's specific class for view all buttons
                else if (typeof className === 'string' && (className.includes('_acan') || className.includes('_acao'))) {
                    // Check if nearby text indicates comment loading
                    const parent = el.parentElement;
                    if (parent && /view|comment|reply|load/i.test(parent.textContent || '')) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                }
                
                // Pattern 8: Buttons whose parent contains comment loading text
                else {
                    const parent = el.parentElement;
                    if (parent && /^view (all\s+)?[\d,]*(comments?|replies?)$/i.test(parent.textContent || '')) {
                        (el as HTMLElement).click();
                        clickedCount++;
                    }
                }
            }
            
            return clickedCount;
        });

        if (clicked > 0) {
            log(`Clicked ${clicked} comment loading button(s)`, "scraper");
            // Wait longer after clicking load more to allow Instagram to fetch data
            await this.randomDelay(2000, 3500);
        }

        return clicked;
    }

    /**
     * CRITICAL FIX 2: Improved scroll logic with better bottom detection and patience
     * 
     * Key improvements:
     * - Increased maxScrolls to 1000 (was 200 in fast version)
     * - Increased noProgress threshold to 25 (was 10)
     * - Better scrollable element detection
     * - Adjustable scroll distance based on viewport
     * - More reliable bottom detection
     */
    private async scrollCommentsSection(
        page: Page,
        capturedComments: Map<string, InstagramComment>,
        lastApiResponseTime: { value: number },
        maxScrolls: number = 1000,
        targetCommentCount: number = 2000
    ): Promise<void> {
        let noProgressCount = 0;
        let lastCommentCount = capturedComments.size;
        let consecutiveZeroScrolls = 0;
        const maxNoProgress = 25; // Was 10 - give Instagram more time to load batches
        const maxZeroScrolls = 50; // Completely stuck after this many zero scrolls
        
        log(`Starting scroll loop: target=${targetCommentCount}, maxScrolls=${maxScrolls}, maxNoProgress=${maxNoProgress}`, "scraper");

        for (let i = 0; i < maxScrolls; i++) {
            // Periodically click load more buttons (every 10 iterations)
            if (i % 10 === 0) {
                await this.clickLoadMoreButtons(page);
            }

            // CRITICAL FIX 3: Better scroll distance calculation
            // Instagram loads comments in batches, so we need to scroll enough to trigger loading
            // but not so much that we skip over comments
            const scrollResult = await page.evaluate(() => {
                let bestScrollAmount = 0;
                let bestElement: HTMLElement | null = null;
                let foundScrollable = false;
                let atBottom = false;

                // Strategy 1: Look for the main comments container
                // Instagram's comments are typically in a scrollable div within the dialog
                const allElements = Array.from(document.querySelectorAll('div, section, ul, article'));
                
                for (const el of allElements) {
                    const htmlEl = el as HTMLElement;
                    const style = window.getComputedStyle(htmlEl);
                    const hasScroll = style.overflowY === 'scroll' || style.overflowY === 'auto';
                    
                    if (!hasScroll) continue;
                    
                    const canScroll = htmlEl.scrollHeight > htmlEl.clientHeight + 50;
                    if (!canScroll) continue;
                    
                    // Check if this element contains comments
                    // Look for profile links or username patterns
                    const hasProfileLinks = htmlEl.querySelectorAll('a[href^="/"][href$="/"]').length > 3;
                    const hasUsernamePattern = /@[a-zA-Z0-9._]+/.test(htmlEl.textContent || '');
                    
                    if (hasProfileLinks || hasUsernamePattern) {
                        // This looks like a comments container!
                        foundScrollable = true;
                        
                        // Calculate optimal scroll amount
                        const scrollAmount = Math.min(
                            Math.max(htmlEl.clientHeight * 0.6, 400), // At least 400px or 60% of viewport
                            htmlEl.scrollHeight - htmlEl.scrollTop - htmlEl.clientHeight // Don't overshoot
                        );
                        
                        if (scrollAmount > bestScrollAmount) {
                            bestScrollAmount = scrollAmount;
                            bestElement = htmlEl;
                        }
                    }
                }

                // Strategy 2: Document body scroll (for mobile/desktop views)
                if (bestScrollAmount === 0) {
                    const htmlEl = document.body;
                    const canScroll = htmlEl.scrollHeight > htmlEl.clientHeight + 100;
                    if (canScroll && htmlEl.textContent && htmlEl.textContent.length > 1000) {
                        foundScrollable = true;
                        bestScrollAmount = Math.min(
                            window.innerHeight * 0.7,
                            htmlEl.scrollHeight - htmlEl.scrollTop - htmlEl.clientHeight
                        );
                        bestElement = htmlEl;
                    }
                }

                // Execute the scroll
                let actuallyScrolled = 0;
                if (bestElement && bestScrollAmount > 10) {
                    const before = bestElement.scrollTop;
                    bestElement.scrollTop += bestScrollAmount;
                    const after = bestElement.scrollTop;
                    actuallyScrolled = after - before;
                    
                    // Check if at bottom
                    atBottom = (after + bestElement.clientHeight) >= (bestElement.scrollHeight - 20);
                }

                return {
                    scrolled: actuallyScrolled > 0,
                    scrollAmount: actuallyScrolled,
                    atBottom,
                    foundScrollable
                };
            });

            if (!scrollResult.foundScrollable) {
                log("WARNING: No scrollable comments container found!", "scraper");
                // Try to scroll the page anyway as fallback
                await page.evaluate(() => {
                    window.scrollBy(0, 500);
                });
                await this.randomDelay(1000, 1500);
                continue;
            }

            // Track consecutive zero scrolls
            if (!scrollResult.scrolled || scrollResult.scrollAmount === 0) {
                consecutiveZeroScrolls++;
            } else {
                consecutiveZeroScrolls = 0;
            }

            // Log progress periodically
            if (i % 20 === 0 || scrollResult.atBottom) {
                log(`Scroll ${i + 1}/${maxScrolls}: +${scrollResult.scrollAmount}px, ` +
                    `${capturedComments.size} comments, atBottom=${scrollResult.atBottom}`, "scraper");
            }

            // CRITICAL FIX 4: Adaptive delay based on scroll state
            // When we're actively scrolling, use shorter delays
            // When stuck or at bottom, use longer delays to allow API responses
            if (scrollResult.atBottom || consecutiveZeroScrolls > 5) {
                // Longer delay when at bottom or stuck - give API time to respond
                await this.randomDelay(2000, 4000);
            } else if (scrollResult.scrolled) {
                // Normal delay when scrolling successfully
                await this.randomDelay(800, 1500); // Increased from 300-500ms
            } else {
                // Short delay when scroll had no effect (will likely exit soon)
                await this.randomDelay(500, 1000);
            }

            // Check if we've reached the target
            const currentCount = capturedComments.size;
            if (currentCount >= targetCommentCount) {
                log(`Reached target comment count: ${currentCount}`, "scraper");
                break;
            }

            // Check for progress
            if (currentCount > lastCommentCount) {
                noProgressCount = 0;
                lastCommentCount = currentCount;
                
                if (currentCount % 100 === 0) {
                    const percentageValue = currentCount / targetCommentCount;
                    const percentageDisplay = Math.round(percentageValue * 100 * 10) / 10;
                    const progressMsg = `Progress: ${currentCount} comments captured (${percentageDisplay.toFixed(1)}%)`;
                    log(progressMsg, "scraper");
                }
            } else {
                noProgressCount++;
                
                if (noProgressCount >= maxNoProgress) {
                    log(`No progress for ${maxNoProgress} iterations. Stopping at ${currentCount} comments.`, "scraper");
                    break;
                }
            }

            // Check if completely stuck
            if (consecutiveZeroScrolls >= maxZeroScrolls) {
                log(`Completely stuck (${maxZeroScrolls} zero scrolls). Stopping at ${currentCount} comments.`, "scraper");
                break;
            }

            // Check if at bottom for several consecutive iterations
            if (scrollResult.atBottom) {
                log(`At bottom of comments (iteration ${i + 1})`, "scraper");
                // Give it a few more iterations in case more comments load
                if (capturedComments.size > 0 && noProgressCount >= 5) {
                    log(`Bottom confirmed with no progress. Stopping at ${currentCount} comments.`, "scraper");
                    break;
                }
            }
        }

        log(`Scroll loop complete. Final comment count: ${capturedComments.size}`, "scraper");
    }

    /**
     * CRITICAL FIX 5: Enhanced comment extraction with multiple strategies
     */
    private async extractComments(page: Page): Promise<InstagramComment[]> {
        const debugInfo = await page.evaluate(() => {
            const info = {
                url: window.location.href,
                totalDivs: document.querySelectorAll('div').length,
                totalLinks: document.querySelectorAll('a').length,
                totalSpans: document.querySelectorAll('span').length,
                scrollableElements: 0,
                bodyTextSample: document.body.innerText.substring(0, 500),
            };

            // Count scrollable elements
            const allElements = document.querySelectorAll('div, section, article');
            for (const el of allElements) {
                const style = window.getComputedStyle(el as HTMLElement);
                if (style.overflowY === 'scroll' || style.overflowY === 'auto') {
                    if ((el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight) {
                        info.scrollableElements++;
                    }
                }
            }

            return info;
        });

        log(`DOM debug: ${debugInfo.totalDivs} divs, ${debugInfo.totalLinks} links, ${debugInfo.scrollableElements} scrollable elements`, "scraper");
        log(`URL: ${debugInfo.url}`, "scraper");

        // Strategy 1: DOM-based extraction (parsing the rendered page structure)
        const domComments = await page.evaluate(() => {
            const results = new Map<string, any>();
            const seenKeys = new Set<string>();

            // Helper function to generate unique key
            const generateKey = (username: string, text: string): string => {
                return `${username.toLowerCase()}:${text.substring(0, 50).toLowerCase()}`;
            };

            // Strategy 1a: Look for Instagram's comment items in the DOM
            // Instagram typically structures comments as: li/div > a (username) + span (text)
            const commentItems = document.querySelectorAll('ul li, article div');
            
            for (const item of commentItems) {
                // Look for username link
                const usernameLink = item.querySelector('a[href^="/"]');
                if (!usernameLink) continue;

                const href = usernameLink.getAttribute('href') || '';
                // Must be a profile link (not a post link)
                if (href.includes('/p/') || href.includes('/reel/') || href.includes('/tv/')) continue;

                // Extract username
                let username = href.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
                if (!username || username.length > 30 || !/^[a-zA-Z0-9._]+$/.test(username)) continue;

                // Look for comment text near the username
                // It could be in a span, div, or text node
                let text = '';
                const nearbyElements = Array.from(item.querySelectorAll('span, div'));
                
                for (const el of nearbyElements) {
                    const elText = (el.textContent || '').trim();
                    // Skip very short text (likely a timestamp or count)
                    if (elText.length < 3) continue;
                    // Skip usernames
                    if (/^[a-zA-Z0-9._]{1,30}$/.test(elText)) continue;
                    // Skip timestamps
                    if (/^(Edited\s*•?\s*)?\d+\s*[hdwm]$/i.test(elText)) continue;
                    // Skip "X likes" text
                    if (/^\d+\s*likes?$/i.test(elText)) continue;
                    // Skip button labels
                    if (/^(Reply|View|Load|Like|Save|Share|More)$/i.test(elText)) continue;
                    
                    // Found comment text!
                    text = elText;
                    break;
                }

                if (!text) continue;

                // Check if we've seen this comment
                const key = generateKey(username, text);
                if (seenKeys.has(key)) continue;

                // Get avatar if available (img before username link)
                let avatar: string | undefined;
                const parent = usernameLink.parentElement;
                if (parent) {
                    const avatarImg = parent.querySelector('img');
                    if (avatarImg) {
                        const src = avatarImg.getAttribute('src') || '';
                        if (src.includes('instagram') || src.includes('cdninstagram') || src.includes('scontent')) {
                            avatar = src;
                        }
                    }
                }

                const comment = {
                    id: `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    username,
                    text,
                    timestamp: new Date().toISOString(),
                    likes: 0,
                    avatar,
                };

                seenKeys.add(key);
                results.set(username, comment);
            }

            // Strategy 1b: Alternative approach - parse from body text
            // This catches comments that might be in unusual DOM structures
            const bodyText = document.body.innerText || '';
            const lines = bodyText.split('\n');
            const usernamePattern = /^[a-zA-Z0-9._]{1,30}$/;
            const timestampPattern = /^(Edited\s*•?\s*)?\d+\s*[hdwm]$/i;
            
            let currentUsername: string | null = null;
            let currentText: string[] = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Check if this is a username
                if (usernamePattern.test(line) && i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    
                    // Check if next line is a timestamp
                    if (timestampPattern.test(nextLine)) {
                        // Save previous comment if exists
                        if (currentUsername && currentText.length > 0) {
                            const text = currentText.join(' ').trim();
                            const key = generateKey(currentUsername, text);
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                results.set(currentUsername, {
                                    id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                    username: currentUsername,
                                    text,
                                    timestamp: new Date().toISOString(),
                                    likes: 0,
                                });
                            }
                        }
                        
                        // Start new comment
                        currentUsername = line;
                        currentText = [];
                        i++; // Skip timestamp line
                        continue;
                    }
                }
                
                // Collect text for current comment
                if (currentUsername) {
                    // Skip timestamps
                    if (timestampPattern.test(line)) continue;
                    // Skip "X likes"
                    if (/^\d+\s*likes?$/i.test(line)) continue;
                    // Skip "Reply"
                    if (/^Reply$/i.test(line)) {
                        // End of comment
                        if (currentText.length > 0) {
                            const text = currentText.join(' ').trim();
                            const key = generateKey(currentUsername, text);
                            if (!seenKeys.has(key)) {
                                seenKeys.add(key);
                                results.set(currentUsername, {
                                    id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                    username: currentUsername,
                                    text,
                                    timestamp: new Date().toISOString(),
                                    likes: 0,
                                });
                            }
                        }
                        currentUsername = null;
                        currentText = [];
                        continue;
                    }
                    // Skip "View replies" etc.
                    if (/^View/i.test(line)) continue;
                    // Skip "See translation"
                    if (/^See translation$/i.test(line)) continue;
                    // Skip empty lines
                    if (!line) continue;
                    
                    currentText.push(line);
                }
            }
            
            // Save last comment
            if (currentUsername && currentText.length > 0) {
                const text = currentText.join(' ').trim();
                const key = generateKey(currentUsername, text);
                if (!seenKeys.has(key)) {
                    results.set(currentUsername, {
                        id: `${currentUsername}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        username: currentUsername,
                        text,
                        timestamp: new Date().toISOString(),
                        likes: 0,
                    });
                }
            }
            
            return Array.from(results.values());
        });

        // Deduplicate by username + text
        const uniqueComments = new Map<string, InstagramComment>();
        for (const comment of domComments as any[]) {
            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
            if (!uniqueComments.has(key)) {
                uniqueComments.set(key, {
                    id: comment.id,
                    username: comment.username,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    likes: comment.likes || 0,
                    avatar: comment.avatar,
                });
            }
        }

        return Array.from(uniqueComments.values());
    }

    /**
     * CRITICAL FIX 6: Enhanced API response extraction
     * Handles more GraphQL response structures
     */
    private extractCommentsFromApiResponse(data: any): InstagramComment[] {
        const comments: InstagramComment[] = [];
        
        const findComments = (obj: any, path: string = ''): void => {
            if (!obj || typeof obj !== 'object') return;
            
            // Array - recurse
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findComments(item, path);
                }
                return;
            }
            
            // Pattern 1: Direct comment object with owner and text
            if (obj.owner && obj.text && typeof obj.owner === 'object') {
                const username = obj.owner.username || obj.owner?.username || obj.user?.username;
                if (username && obj.text) {
                    comments.push({
                        id: obj.id || obj.pk || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        username: username,
                        text: obj.text,
                        timestamp: obj.created_at || obj.timestamp || new Date().toISOString(),
                        likes: obj.like_count || obj.likes_count || 0,
                        avatar: obj.owner?.profile_pic_url || obj.owner?.profile_picture_url || 
                                obj.user?.profile_pic_url || undefined,
                    });
                }
            }
            
            // Pattern 2: GraphQL edge_media_to_comment structure
            if (obj.edge_media_to_comment?.edges) {
                for (const edge of obj.edge_media_to_comment.edges) {
                    if (edge.node) {
                        const node = edge.node;
                        const username = node.owner?.username || node.user?.username;
                        if (username && node.text) {
                            comments.push({
                                id: node.id || `${username}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                username: username,
                                text: node.text,
                                timestamp: node.created_at || node.timestamp || new Date().toISOString(),
                                likes: node.edge_liked_by?.count || node.like_count || 0,
                                avatar: node.owner?.profile_pic_url || node.user?.profile_pic_url || undefined,
                            });
                        }
                        
                        // Recursively check for threaded replies
                        if (node.edge_threaded_comments?.edges) {
                            findComments(node, path + '.edge_threaded_comments');
                        }
                    }
                }
            }
            
            // Pattern 3: Comments array directly
            if (obj.comments && Array.isArray(obj.comments)) {
                findComments(obj.comments, path + '.comments');
            }
            
            // Pattern 4: Items array (common in API responses)
            if (obj.items && Array.isArray(obj.items)) {
                findComments(obj.items, path + '.items');
            }
            
            // Pattern 5: Data wrapper
            if (obj.data) {
                findComments(obj.data, path + '.data');
            }
            
            // Pattern 6: Page info with edges
            if (obj.page_info?.edges) {
                findComments(obj.page_info.edges, path + '.page_info.edges');
            }

            // Pattern 7: Recursive search for text/owner pairs
            // This catches comments in unusual structures
            if (obj.text && typeof obj.text === 'string' && obj.text.length > 2) {
                // Look for username nearby in the object tree
                const parentPath = path.split('.');
                for (let i = 0; i < parentPath.length; i++) {
                    const key = parentPath.slice(-i - 1)[0];
                    if (key === 'owner' || key === 'user') {
                        // Found username field, go back up to get username value
                        // We can't easily go back up, so skip this pattern for now
                        break;
                    }
                }
            }
            
            // Recursively check all properties
            for (const key in obj) {
                if (obj.hasOwnProperty(key) && key !== '__proto__') {
                    findComments(obj[key], `${path}.${key}`);
                }
            }
        };
        
        findComments(data);
        
        // Deduplicate
        const unique = new Map<string, InstagramComment>();
        for (const comment of comments) {
            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
            if (!unique.has(key)) {
                unique.set(key, comment);
            }
        }
        
        return Array.from(unique.values());
    }

    /**
     * CRITICAL FIX 7: Main fetch function with improved logic
     * 
     * Key improvements:
     * - Better initial button clicking
    * - Enhanced network interception
     * - Hybrid scrolling with patience
     * - DOM extraction as fallback
     */
    async fetchComments(postUrl: string, targetCommentCount: number = 2000): Promise<FetchCommentsResult> {
        log(`Starting comment scraper for: ${postUrl} (target: ${targetCommentCount})`, "scraper");

        try {
            // Launch browser
            this.browser = await this.launchBrowser();
            const page = await this.browser.newPage();

            // Set user agent
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            );

            // Enable request interception for network debugging
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                // Block images and unnecessary resources for speed
                if (req.resourceType() === 'image' || 
                    req.resourceType() === 'font' || 
                    req.resourceType() === 'media') {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // Ensure logged in
            const loggedIn = await this.ensureLoggedIn(page);
            if (!loggedIn) {
                throw new Error("Failed to login to Instagram");
            }

            // Set up network interception to capture API responses
            const capturedComments = new Map<string, InstagramComment>();
            const lastApiResponseTime = { value: Date.now() };
            const apiResponseLog: number[] = [];
            
            page.on('response', async (response) => {
                const url = response.url();
                const status = response.status();
                
                // Only log successful responses to avoid noise
                if (status < 200 || status >= 400) return;

                // Check if this is an Instagram API endpoint that might contain comments
                const isInstagramApi = 
                    url.includes('graphql') || 
                    url.includes('/api/v1/') || 
                    url.includes('/api/graphql/') || 
                    url.includes('query_hash') ||
                    url.includes('comments') || 
                    url.includes('edge_media_to_comment') ||
                    (url.includes('instagram.com') && url.includes('/api/')) ||
                    url.includes('/web/');

                if (!isInstagramApi) return;

                try {
                    const responseText = await response.text();
                    if (!responseText || responseText.length < 50) return;
                    
                    let data: any;
                    try {
                        data = JSON.parse(responseText);
                    } catch {
                        return; // Not JSON, skip
                    }
                    
                    const comments = this.extractCommentsFromApiResponse(data);
                    if (comments.length === 0) return;
                    
                    let newCount = 0;
                    for (const comment of comments) {
                        if (comment.username && comment.text) {
                            const key = `${comment.username}:${comment.text.substring(0, 50)}`;
                            if (!capturedComments.has(key)) {
                                capturedComments.set(key, comment);
                                newCount++;
                            }
                        }
                    }
                    
                    if (newCount > 0) {
                        lastApiResponseTime.value = Date.now();
                        apiResponseLog.push(Date.now());
                        // Keep only last 100 timestamps
                        if (apiResponseLog.length > 100) {
                            apiResponseLog.shift();
                        }
                        
                        log(`API: +${newCount} comments (total: ${capturedComments.size})`, "scraper");
                    }
                } catch (error) {
                    // Silently ignore parsing errors - might be binary data or HTML
                }
            });

            // Navigate to the post
            log(`Navigating to post: ${postUrl}`, "scraper");
            await page.goto(postUrl, { waitUntil: "networkidle2", timeout: 60000 });
            await this.randomDelay(3000, 5000);

            // CRITICAL FIX 8: Aggressive button clicking initially
            // Try multiple times to find and click "View all comments"
            log("Looking for 'View all comments' button...", "scraper");
            let totalClicked = 0;
            
            // Attempt 1: Immediate click
            let clicked = await this.clickLoadMoreButtons(page);
            totalClicked += clicked;
            
            // Wait and attempt 2: After page settles
            await this.randomDelay(2000, 3000);
            clicked = await this.clickLoadMoreButtons(page);
            totalClicked += clicked;
            
            // Attempt 3: After scrolling a bit
            await page.evaluate(() => {
                window.scrollBy(0, 300);
            });
            await this.randomDelay(1500, 2500);
            clicked = await this.clickLoadMoreButtons(page);
            totalClicked += clicked;

            log(`Total buttons clicked initially: ${totalClicked}`, "scraper");

            // CRITICAL FIX 9: Hybrid approach - scroll and extract
            // First, scroll to capture network responses
            log("Phase 1: Scrolling to capture API responses...", "scraper");
            await this.scrollCommentsSection(page, capturedComments, lastApiResponseTime, 1000, targetCommentCount);

            // Phase 2: Check if we got enough comments from API
            const apiCommentCount = capturedComments.size;
            log(`API captured ${apiCommentCount} comments`, "scraper");

            // If we didn't get enough, extract from DOM
            let domComments: InstagramComment[] = [];
            if (apiCommentCount < targetCommentCount) {
                log("Phase 2: Extracting comments from DOM...", "scraper");
                await this.randomDelay(2000, 3000);
                domComments = await this.extractComments(page);
                log(`DOM extracted ${domComments.length} comments`, "scraper");
            }

            // Merge API and DOM comments (DOM as fallback/new comments)
            const allComments = Array.from(capturedComments.values());
            const domOnly = new Set<string>(
                Array.from(capturedComments.keys())
            );

            for (const domComment of domComments) {
                const key = `${domComment.username}:${domComment.text.substring(0, 50)}`;
                if (!domOnly.has(key)) {
                    allComments.push(domComment);
                }
            }

            const comments = allComments;

            // Get post info
            const postInfo = await page.evaluate(() => {
                const url = window.location.href;
                const match = url.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
                const id = match ? match[2] : undefined;

                return {
                    id,
                };
            });

            await page.close();

            log(`Extraction complete. Total comments: ${comments.length} (API: ${apiCommentCount}, DOM: ${domComments.length})`, "scraper");

            return {
                comments,
                total: comments.length,
                postInfo: postInfo.id ? {
                    id: postInfo.id,
                } : undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log(`Scraping error: ${errorMessage}`, "scraper");
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }

    /**
     * Cleanup resources
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
