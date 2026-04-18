# Scraper

## Goal
Fetch Instagram post comments for a given URL. Handles login, session persistence, and multiple fallback strategies to work around Instagram's anti-bot measures.

## Implementation
`server/scraper/instagram-scraper.ts` (41KB — hub within the scraper module). Uses Puppeteer + stealth plugin to launch a headless browser, intercepts the Instagram GraphQL API network response to extract comments, and falls back to DOM scraping if interception fails. `session-manager.ts` automates Instagram login and persists cookies to disk. `proxy-manager.ts` rotates proxies to avoid IP bans. `instagram-api-client.ts` provides utilities for parsing Instagram API responses.

## Key Code
```typescript
// Entry point used by server/instagram.ts
const scraper = new InstagramScraper(config);
const comments = await scraper.getComments(postUrl, { maxComments: 500 });
```

## Notes
- Requires `INSTAGRAM_USERNAME` + `INSTAGRAM_PASSWORD` env vars
- Session cookies persisted to disk — login only runs when cookies expire
- Two dispatch modes: local Puppeteer or WebSocket relay to Raspberry Pi worker
- `SCRAPER_EXECUTABLE_PATH` env var needed on Linux/ARM if Chromium not auto-detected
- Instagram frequently changes its API — the network-interception approach is fragile
