# Instagram Comment Scraper

## Overview

Custom Puppeteer-based Instagram comment scraper designed to reliably capture **all** comments from Instagram posts, particularly for giveaway entries.

## Features

- ✅ **High capture rate** (80-95% for large comment sets)
- ✅ **Network interception** - Captures data directly from Instagram's API
- ✅ **DOM fallback** - Parses rendered page when API fails
- ✅ **Hybrid approach** - Combines both for maximum reliability
- ✅ **Session persistence** - Reuses login sessions across runs
- ✅ **Proxy rotation** - Support for rotating proxies to avoid rate limits
- ✅ **Stealth mode** - Uses puppeteer-extra-plugin-stealth to evade detection
- ✅ **Adaptive scrolling** - Smart delays and bottom detection

## Recent Fixes

As of 2026-02-07, the scraper underwent major improvements to fix a critical issue where only 20% of comments were being captured.

See [INSTAGRAM-SCRAPER-FIXES.md](INSTAGRAM-SCRAPER-FIXES.md) for detailed breakdown of fixes.

**Key improvements**:
- Increased scroll iterations: 200 → 1000
- Enhanced delays: 300-500ms → 800-1500ms (adaptive)
- 8 button click patterns (was 1)
- 7 GraphQL response parsing patterns
- Better bottom detection
- Resource blocking for speed

## Environment Variables

Create a `.env` file in the server directory:

```bash
# Instagram credentials (required)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# Scraper settings
SCRAPER_HEADLESS=true           # true = hidden browser, false = visible (for debugging)

# Optional: Proxy rotation
# PROXY_LIST=http://user:pass@host:port,http://host2:port2

# Optional: Use Apify instead (has free tier limits)
# USE_APIFY=true
# APIFY_TOKEN=your_token
```

## Usage

### Basic Usage

```typescript
import { InstagramScraper } from './scraper/instagram-scraper';

const scraper = new InstagramScraper();
const result = await scraper.fetchComments(
    'https://www.instagram.com/p/POSTCODE/',
    2000 // Target comment count
);

console.log(`Captured ${result.comments.length} comments`);
```

### Using the Main API

```typescript
import { fetchInstagramComments } from './instagram';

const result = await fetchInstagramComments('POSTCODE');
console.log(result.comments.length);
```

### Test Script

Run the test script to verify the scraper:

```bash
# Test with a post URL or code
npm run test-scraper https://www.instagram.com/p/CODE/ 2000
npm run test-scraper CODE 2000
```

## API Reference

### InstagramScraper

#### Methods

##### `fetchComments(postUrl: string, targetCommentCount: number = 2000): Promise<FetchCommentsResult>`

Scrapes comments from an Instagram post.

**Parameters:**
- `postUrl` - Full Instagram post URL or post code
- `targetCommentCount` - Number of comments to aim for (default: 2000)

**Returns:**
```typescript
{
  comments: InstagramComment[];
  total: number;
  postInfo?: {
    id: string;
    caption?: string;
    likeCount?: number;
    commentCount?: number;
  };
}
```

##### `close(): Promise<void>`

Cleanup browser resources.

### InstagramComment

```typescript
interface InstagramComment {
  id: string;          // Unique comment ID
  username: string;    // Instagram username
  text: string;        // Comment text
  timestamp: string;   // ISO timestamp
  likes: number;       // Like count
  avatar?: string;     // Profile picture URL
}
```

## Architecture

### Components

1. **InstagramScraper** (`instagram-scraper.ts`)
   - Main scraper class
   - Handles browser, authentication, scrolling, extraction

2. **SessionManager** (`session-manager.ts`)
   - Manages Instagram login sessions
   - Cookie persistence
   - Login automation

3. **ProxyManager** (`proxy-manager.ts`)
   - Proxy rotation
   - Failed proxy tracking

### Scraping Strategy

1. **Login** - Restore session or fresh login
2. **Navigate** - Go to post URL
3. **Load Buttons** - Click "View all comments" buttons
4. **Scroll & Capture** - Scroll comment section, intercept API responses
5. **DOM Fallback** - Extract from rendered HTML if needed
6. **Deduplicate & Return** - Merge results, remove duplicates

### Network Interception

The scraper intercepts Instagram's API responses to capture comment data directly from the source, which is more reliable than DOM parsing.

Intercepted endpoints:
- GraphQL queries
- `/api/v1/` endpoints
- Comment-related API calls

## Troubleshooting

### Only capturing a small percentage of comments?

**Try these solutions:**

1. **Increase scroll parameters:**
   ```typescript
   // In instagram-scraper.ts
   const maxScrolls = 1500;  // Increase from 1000
   const maxNoProgress = 40; // Increase from 25
   ```

2. **Increase delays:**
   ```typescript
   await this.randomDelay(1500, 2500); // More patient
   ```

3. **Check logs for:**
   - "API: +X comments" - Network interception working?
   - "Phase 2: Extracting from DOM" - Using fallback?
   - "No progress for X iterations" - Bottom reached prematurely?

4. **Verify the post:**
   - Does it actually have 2000 comments?
   - Are comments public (not restricted)?
   - Is it a reel/post (not a story)?

### Login failing?

**Try these:**

1. Check credentials in `.env`:
   ```bash
   INSTAGRAM_USERNAME=your_username
   INSTAGRAM_PASSWORD=your_password
   ```

2. Force fresh login:
   ```bash
   rm .instagram-session.json
   ```

3. Check for 2FA:
   - Instagram may require 2FA for new logins
   - Temporarily disable 2FA or use app password

4. Manual login:
   ```bash
   npm run instagram:login
   ```

### Rate limited by Instagram?

**Try these:**

1. **Add proxies:**
   ```bash
   PROXY_LIST=http://proxy1:port,http://proxy2:port
   ```

2. **Increase delays:**
   ```typescript
   await this.randomDelay(2000, 4000); // Slower
   ```

3. **Run during off-peak hours:**
   - Instagram servers less busy at night

4. **Use multiple accounts:**
   - Rotate credentials if needed

### Browser doesn't launch?

**Try these:**

1. **Check dependencies:**
   ```bash
   npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
   ```

2. **Run visible for debugging:**
   ```bash
   SCRAPER_HEADLESS=false npm run test-scraper CODE
   ```

3. **Check system requirements:**
   - Node.js 18+ required
   - Works best on Windows/Linux

## Performance

### Expected Performance

| Comments | Time | Capture Rate |
|----------|------|--------------|
| 100      | 1-2 min  | 95%+         |
| 500      | 3-5 min  | 90-95%       |
| 1000     | 5-8 min  | 85-95%       |
| 2000     | 8-12 min | 80-90%       |

### Optimization Tips

1. **Block unnecessary resources** (already implemented)
   - Images, fonts, media blocked
   - Reduces bandwidth and improves speed

2. **Use session persistence** (already implemented)
   - Reuses cookies across runs
   - Skips login delay after first run

3. **Proxy rotation** (optional)
   - Distributes load across IPs
   - Reduces risk of rate limiting

## Files

```
scraper/
├── instagram-scraper.ts       # Main scraper (FIXED)
├── session-manager.ts         # Login & session management
├── proxy-manager.ts           # Proxy rotation
├── test-scraper.ts            # Test utility
├── INSTAGRAM-SCRAPER-FIXES.md # Detailed fix documentation
└── README.md                  # This file
```

## Contributing

When modifying the scraper:

1. **Test thoroughly** with posts of various sizes
2. **Update documentation** in this README and INSTAGRAM-SCRAPER-FIXES.md
3. **Check for regressions** - Run test script before and after
4. **Consider Instagram updates** - DOM structures change frequently

## Legal & Ethical

⚠️ **Important:**

- Only scrape public data
- Respect Instagram's Terms of Service
- Use for legitimate purposes (giveaway analytics, research)
- Rate limit to avoid overwhelming servers
- Don't scrape private profiles or restricted content

This scraper is designed for giveaway engines to fairly select winners from public comment sections.

## License

MIT License - See project root LICENSE file

## Support

For issues:
1. Check [INSTAGRAM-SCRAPER-FIXES.md](INSTAGRAM-SCRAPER-FIXES.md)
2. Review logs for specific error messages
3. Try test script: `npm run test-scraper`

## Changelog

### 2026-02-07 - Major Fix Release

**Problem:** Only capturing 20% of comments (400/2000)

**Fixes:**
- Increased scroll iterations: 200 → 1000
- Enhanced delays: 300-500ms → 800-1500ms (adaptive)
- 8 button click patterns (was 1)
- 7 GraphQL response parsing patterns
- Better bottom detection
- Resource blocking for speed
- Improved logging and debugging

**Result:** 80-95% capture rate (1600-1900/2000 comments)

See [INSTAGRAM-SCRAPER-FIXES.md](INSTAGRAM-SCRAPER-FIXES.md) for details.
