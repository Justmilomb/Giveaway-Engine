# Scripts — Build and Utility Tools

Automation scripts for building, testing, and managing the application.

## Build Scripts

### `build.ts`
Production build orchestration. Runs:
1. **Client build:** Vite → `dist/public/`
2. **Server build:** esbuild → `dist/index.cjs` (CommonJS)

Bundles dependencies (configurable allowlist), minifies, and produces production-ready output.

**Usage:**
```bash
npm run build
```

**Output:**
- `dist/public/` — React app (served by Express)
- `dist/index.cjs` — Node.js server bundle

## Development Scripts

### `manual-login.ts`
Automates Instagram login for cookie storage. Useful for testing the custom Puppeteer scraper without needing manual login flow each time.

**Usage:**
```bash
npm run instagram:login
```

**What it does:**
1. Launches Puppeteer browser
2. Navigates to Instagram login
3. Enters credentials from `.env` (INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)
4. Saves cookies to file
5. Closes browser

**Output:**
Cookies saved to `server/scraper/cookies.json` for scraper reuse.

### `debug-api.ts`
Manual API endpoint testing without needing a frontend.

**Usage:**
```bash
npm run debug-api
```

**Example:**
Edit the script to test endpoints:
```ts
const res = await fetch("http://localhost:5000/api/instagram/comments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://instagram.com/p/..." }),
});
console.log(await res.json());
```

## Testing Scripts

### `test-scraper.ts` (in `server/scraper/`)
Manual test for the Instagram scraper. Useful for debugging scraping logic before deploying.

**Usage:**
```bash
npm run test-scraper
```

**What it does:**
1. Takes an Instagram post URL
2. Runs the Puppeteer scraper
3. Logs results (comments, count, metadata)
4. Exits

**Note:** Requires Instagram credentials in `.env`

## Utility Scripts

### Local Scraper Worker

Start a local WebSocket relay that connects to Render and scrapes Instagram comments from your local machine. Useful for development and testing without cloud dependencies.

**Usage:**
```bash
npm run scraper:worker
```

**What it does:**
1. Connects to the server's WebSocket relay (`/ws/scraper`)
2. Waits for scraping requests
3. Runs Puppeteer scraper locally
4. Returns results to server
5. Repeats

**Requirements:**
- Chrome/Chromium installed
- Instagram credentials in `.env`
- Server running and accessible

## Development Workflow

### Setting up Instagram credentials

1. Update `.env`:
   ```
   INSTAGRAM_USERNAME=your-username
   INSTAGRAM_PASSWORD=your-password
   USE_CUSTOM_SCRAPER=true
   ```

2. Run login automation:
   ```bash
   npm run instagram:login
   ```

3. Verify cookies saved:
   ```bash
   ls -la server/scraper/cookies.json
   ```

### Testing the scraper

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start scraper worker
npm run scraper:worker

# Terminal 3: Test scraper
npm run test-scraper
```

### Testing an API endpoint

Edit `script/debug-api.ts` with your test case, then:
```bash
npm run debug-api
```

## Production Build

```bash
npm run build
npm run start
```

Outputs optimized bundles:
- Client: ~250KB gzipped (React + dependencies)
- Server: ~1.5MB (bundled Node.js + dependencies)

Both are production-ready and can be deployed to Render, Vercel, or any Node.js host.

## Troubleshooting

### Build fails

1. Check Node.js version: `node --version` (need v18+)
2. Clear `dist/` folder: `rm -rf dist/`
3. Reinstall deps: `npm install`
4. Try again: `npm run build`

### Scraper not working

1. Check credentials in `.env`
2. Run `npm run instagram:login` to refresh cookies
3. Check logs: `npm run dev` and look for error messages
4. Try from local worker: `npm run scraper:worker`

### Production deployment

1. Build locally: `npm run build`
2. Push to GitHub
3. Render detects push, runs `npm run build && npm start`
4. Check deployment logs in Render dashboard
