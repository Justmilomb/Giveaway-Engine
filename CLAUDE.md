# CLAUDE.md — Giveaway Engine

## Project Overview

Full-stack Instagram giveaway runner (PickUsAWinner Engine). Scrapes comments from Instagram posts, applies filtering rules, and selects random winners. Built with TypeScript across client and server with shared schema definitions.

## Tech Stack

- **Frontend:** React 19, Vite 7, TailwindCSS 4, shadcn/ui (Radix), Wouter (routing), React Query, React Hook Form + Zod
- **Backend:** Express 5, Passport.js (local + Google OAuth20 strategies), cookie-session, express-rate-limit
- **Database:** PostgreSQL 16, Drizzle ORM, drizzle-kit (migrations)
- **Scraping:** Puppeteer + puppeteer-extra-plugin-stealth
- **Payments:** Stripe (PaymentIntent API + Stripe Elements)
- **Email:** Nodemailer (SMTP)
- **Build:** Vite (client), esbuild (server), tsx (dev runner)

## Repository Structure

```
client/src/           # React frontend
  pages/              # Route page components (tool, analytics, schedule, auth, home, etc.)
  components/         # Reusable UI (ui/ has shadcn components)
  hooks/              # Custom hooks (use-user, use-toast, use-mobile)
  lib/                # Utilities (queryClient, protected-route, utils, stripe)
  App.tsx             # Root component with Wouter routes
  main.tsx            # React entry point

server/               # Express backend
  index.ts            # Server entry point — sets up Express, HTTP server, scheduler
  routes.ts           # Route registration — imports and mounts all route modules
  routes/             # Route modules split by feature
    admin.ts          # Admin endpoints (analytics, token generation, security stats)
    ads.ts            # Ad serving endpoints
    articles.ts       # Blog/article endpoints (markdown-based)
    giveaways.ts      # Giveaway CRUD and scheduling
    instagram.ts      # Instagram comment fetching
    payment.ts        # Stripe payment and credit redemption
    public.ts         # Public/unauthenticated endpoints
  auth.ts             # Passport.js local + Google OAuth20 strategies, cookie-session config
  security.ts         # Rate limiters, credit system, IP blocking, admin auth
  instagram.ts        # Instagram scraper dispatch (relay + custom Puppeteer)
  scraper-relay.ts    # WebSocket relay server (forwards scrape jobs to local worker)
  scheduler.ts        # Background job processor (polls every 60s for pending giveaways)
  storage.ts          # In-memory storage with JSON file persistence fallback
  email.ts            # Nodemailer SMTP config and sending
  email-templates.ts  # HTML/text email templates
  image.ts            # Image processing (sharp)
  markdown.ts         # Markdown article parsing and querying
  indexnow.ts         # IndexNow/Bing search engine submission
  seo-routes.ts       # SEO metadata per route (titles, descriptions, canonical URLs)
  log.ts              # Logging utility
  vite.ts             # Vite dev server middleware setup
  static.ts           # Production static file serving
  types/              # Shared server-side TypeScript types
  scraper/            # Custom Instagram scraper module
    instagram-scraper.ts      # Main scraper class (Puppeteer, network interception, DOM fallback)
    session-manager.ts        # Login automation & cookie persistence
    proxy-manager.ts          # Proxy rotation
    instagram-api-client.ts   # Instagram API utilities
    test-scraper.ts           # Manual scraper testing

shared/               # Shared between client and server
  schema.ts           # Drizzle ORM schema (users, giveaways) + Zod validation schemas

script/               # Build and utility scripts
  build.ts            # Production build (Vite + esbuild)
  manual-login.ts     # Instagram login automation
  local-worker.ts     # Local Puppeteer worker (connects to scraper relay)
  force-index.ts      # Force IndexNow submission for all routes
  update-lastmod.ts   # Update sitemap last-modified timestamps
  debug-api.ts        # API endpoint debugging
  test-apify.ts       # Test Apify integration
  test-api-debug.ts   # Extended API debugging

content/              # Markdown blog articles served via /api/articles
  articles/           # Article files
  articles.json       # Article index/metadata

migrations/           # Drizzle-kit database migrations
```

## Commands

```bash
# Development
npm run dev              # Start backend dev server (tsx, port 5000)
npm run dev:client       # Start frontend dev server only (Vite, port 5000)

# Build & Production
npm run build            # Build client (Vite → dist/public) and server (esbuild → dist/index.cjs)
npm run start            # Run production build (node dist/index.cjs)

# Type Checking
npm run check            # Run TypeScript compiler (tsc --noEmit)

# Database
npm run db:push          # Push schema changes to database (drizzle-kit push)

# Scraper
npm run instagram:login  # Manual Instagram login automation
npm run test-scraper     # Test the custom Instagram scraper
npm run scraper:worker   # Start local Puppeteer worker (connects to relay, headed)
npm run scraper:worker:pi # Start local worker in headless mode (Raspberry Pi)

# SEO
npm run index-now        # Force-submit all routes to IndexNow/Bing
```

## Path Aliases

Configured in `tsconfig.json` and `vite.config.ts`:

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets` (Vite only)

## Database Schema

Defined in `shared/schema.ts` using Drizzle ORM:

- **users** — id (varchar UUID), firstName, username (optional, unique), email (unique), password (nullable, hashed with scrypt), googleId (nullable, for OAuth), createdAt
- **giveaways** — id (varchar UUID), userId (FK → users), scheduledFor, status (pending/completed/failed), config (JSONB), winners (JSONB), accessToken (unique varchar for sharing), createdAt
- **ads** — id (varchar UUID), imageUrl, linkUrl, active (boolean), clicks (integer), impressions (integer), createdAt

Zod insert schemas (`insertUserSchema`, `insertGiveawaySchema`, `insertAdSchema`) are auto-derived from Drizzle schema via `drizzle-zod`.

## API Routes

All under `/api` with global rate limiting, block checking, and request validation middleware.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/register` | POST | No | Create user account |
| `/api/login` | POST | No | Authenticate (Passport local) |
| `/api/logout` | POST | Yes | End session |
| `/api/user` | GET | Yes | Get current user |
| `/api/credits` | GET | No | Check remaining credits (IP-based) |
| `/api/credits/redeem` | POST | No | Redeem payment token |
| `/api/config` | GET | No | Stripe publishable key for frontend |
| `/api/payment/create-intent` | POST | No | Create Stripe PaymentIntent (returns clientSecret) |
| `/api/payment/confirm` | POST | No | Verify Stripe payment succeeded, issue purchase token |
| `/api/instagram/validate` | POST | No | Validate Instagram post URL |
| `/api/instagram/comments` | POST | No | Fetch comments (consumes credit) |
| `/api/giveaways` | POST | Yes | Create/schedule a giveaway |
| `/api/giveaways` | GET | Yes | List user's giveaways |
| `/api/giveaways/:token` | GET | No | Get giveaway by public access token |
| `/api/giveaways/:id` | PUT | Yes | Update a giveaway |
| `/api/giveaways/:id` | DELETE | Yes | Delete a giveaway |
| `/api/articles` | GET | No | List blog articles (paginated, filterable by category) |
| `/api/articles/:slug` | GET | No | Get single article by slug |
| `/api/ads/random` | GET | No | Get a random active ad |
| `/api/ads/:id/click` | POST | No | Track ad click |
| `/api/check-username` | GET | No | Check username availability |
| `/api/health` | GET | No | Server health check |
| `/api/contact` | POST | No | Submit contact form (sends email) |
| `/api/analytics` | GET | Admin | View stats |
| `/api/admin/generate-token` | POST | Admin | Generate payment token |
| `/api/admin/security` | GET | Admin | View security stats |
| `/api/admin/ads` | GET | Admin | List all ads |
| `/api/admin/ads` | POST | Admin | Create an ad |
| `/api/admin/ads/:id` | PUT | Admin | Update an ad |
| `/api/admin/ads/:id` | DELETE | Admin | Delete an ad |

## Client Routes

Defined in `client/src/App.tsx` using Wouter:

- `/` — Redirects to `/giveaway-generator`
- `/home` — Home/landing page
- `/giveaway-generator` — Main landing page (Instagram giveaway runner)
- `/tool` — Giveaway tool UI (comment fetch, filter, pick winners)
- `/spin-the-wheel` — Spin the wheel tool
- `/random-name-picker` — Random name picker tool
- `/random-option-picker` — Random option picker tool
- `/wheel` — Wheel page
- `/picker` — Picker page
- `/youtube` — YouTube giveaway picker
- `/tiktok` — TikTok giveaway picker
- `/facebook-picker` — Facebook giveaway picker
- `/twitter-picker` — Twitter/X giveaway picker
- `/how-it-works` — How it works page
- `/instagram-giveaway-guide` — Instagram giveaway guide (content page)
- `/analytics` — Giveaway statistics (admin)
- `/schedule/:token` — Scheduled giveaway detail (public access token)
- `/article/:slug` — Blog article page
- `/faq` — FAQ page
- `/contact` — Contact form page
- `/press` — Press page
- `/coming-soon`, `/privacy`, `/terms` — Static pages
- `/sitemap` — HTML sitemap

## Architecture Patterns

- **Frontend state:** React Context for auth (`use-user`), React Query for server state, local state for UI
- **Component library:** shadcn/ui (New York style, Lucide icons) — components live in `client/src/components/ui/`
- **Sessions:** `cookie-session` (not express-session). Session data lives in a signed cookie, no server-side session store needed.
- **Auth strategies:** Passport local (email+password) + Google OAuth20 (optional). `googleId` stored on user for OAuth users; `password` is nullable.
- **Backend middleware chain:** Global rate limiter → IP block check → request validation → route-specific limiters → handlers
- **Credit system:** IP-based, 2 free credits per IP, paid credits via token redemption. HTTP 402 when credits exhausted.
- **Storage:** `MemStorage` class (Map-based) with JSON persistence to `db.json`. PostgreSQL via Drizzle when `DATABASE_URL` is set.
- **Background jobs:** `scheduler.ts` polls every 60 seconds for pending giveaways, processes them (fetch comments, filter, pick winners, send emails)
- **Instagram scraping:** Custom Puppeteer scraper via WebSocket relay or local, with network interception and DOM fallback.

## Environment Variables

Required variables (see `.env.example`):

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (served to frontend via /api/config) |
| `ADMIN_API_KEY` | For admin | Secret for admin endpoints |
| `SESSION_SECRET` | Production | Cookie-session signing key |
| `DATABASE_URL` | For DB | PostgreSQL connection string (default: in-memory + db.json) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | For email | SMTP config for sending emails |
| `SMTP_SECURE`, `SMTP_FROM_NAME`, `SMTP_REPLY_TO` | For email | Additional SMTP options |
| `ADMIN_ALERT_EMAIL` | Optional | Email address for contact-form notifications |
| `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` | For scraper | Credentials for custom Puppeteer scraper |
| `SCRAPER_RELAY_SECRET` | For relay | WebSocket relay authentication secret |
| `SCRAPER_RESULT_SECRET` | For relay | Callback auth (defaults to SCRAPER_RELAY_SECRET) |
| `SCRAPER_JOBS_FILE` | Optional | Worker schedule queue file (default: worker-jobs.json) |
| `SCRAPER_HEADLESS` | Optional | Run scraper worker in headless mode (set to `true` on Pi) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | For OAuth | Google OAuth20 credentials |
| `BASE_URL` | Optional | Domain for email links and OAuth callbacks (auto-detected if not set) |
| `DATA_FILE` | Optional | JSON persistence path (default: db.json) |
| `PORT` | Optional | Server port (default: 5000) |

## Build Details

- **Client build:** Vite outputs to `dist/public/`
- **Server build:** esbuild bundles `server/index.ts` into `dist/index.cjs` (CommonJS, minified). Bundled deps are allowlisted in `script/build.ts`; other deps are external.
- **Docker:** Node.js 20 Alpine, runs as non-root `appuser`, expects pre-built `dist/` folder, exposes port 5000.

---

## Reading Order (cold start)
1. Read `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — your project brain
2. Read `E:\Coding\Second Brain\_index\MASTER_INDEX.md` — cross-project awareness
3. Read `E:\Coding\Second Brain\_index\SKILL_TRANSFERS.md` — applicable lessons
4. This file (`CLAUDE.md`) — project rules and architecture

---

## Coding Conventions

- **TypeScript strict mode** is enabled. All source files use `.ts` / `.tsx`.
- **ES modules** (`"type": "module"` in package.json). Server builds to CJS for production.
- **Imports:** Use path aliases (`@/`, `@shared/`) not relative paths from client code. Server code uses relative imports.
- **Validation:** Zod schemas for all input validation, derived from Drizzle schema where possible.
- **Components:** shadcn/ui pattern — copy-paste components in `client/src/components/ui/`, customized locally.
- **Styling:** TailwindCSS utility classes. No separate CSS modules or styled-components.
- **Forms:** React Hook Form with `@hookform/resolvers` for Zod integration.
- **Error handling:** Express error middleware in `server/index.ts` catches unhandled errors. Rate limiters and security middleware handle abuse.
- **Logging:** Custom `log()` function in `server/log.ts` for all server-side logging.

## Testing

No automated test framework is configured. Manual testing scripts exist:

- `npm run test-scraper` — Test the custom Instagram scraper
- `tsx script/test-apify.ts` — Test Apify integration
- `tsx script/debug-api.ts` — Debug API endpoints
- `tsx script/test-api-debug.ts` — Extended API debugging

Use `npm run check` (TypeScript compiler) as the primary correctness check.

## Key Files by Size/Complexity

These files contain the most logic and are most likely to need changes:

- `client/src/pages/tool.tsx` — Main giveaway tool UI, comment fetching, filtering, winner selection
- `server/scraper/instagram-scraper.ts` — Puppeteer-based Instagram scraper
- `server/routes/` — All API endpoints (split across admin.ts, ads.ts, articles.ts, giveaways.ts, instagram.ts, payment.ts, public.ts)
- `server/scraper/instagram-api-client.ts` — Instagram API utilities
- `server/security.ts` — Rate limiting, credit system, IP blocking
- `server/email-templates.ts` — Email HTML/text templates
- `server/instagram.ts` — Instagram scraper dispatch (relay + local Puppeteer)

---

## Before You Finish

### Minimum write-back (every session):
1. `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` — add entry if anything important happened
2. `E:\Coding\Second Brain\Giveaway-Engine\KNOWN_ISSUES.md` — add/remove bugs if any changed

### Full write-back (when project state materially changed):
3. `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — update changed sections only
4. `E:\Coding\Second Brain\Giveaway-Engine\PATTERNS.md` — add if you learned something new
5. `E:\Coding\Second Brain\_index\MASTER_INDEX.md` — update if you added new knowledge files
6. `E:\Coding\Second Brain\_index\SKILL_TRANSFERS.md` — add if lesson applies elsewhere

### Notion database updates (use Notion MCP tools):

Database IDs are in `E:\Coding\Second Brain\_system\conventions\notion-config.md`.
Use `data_source_id` (not `database_id`) when creating pages via `notion-create-pages`.

7. **Projects database** — update status/health for Giveaway-Engine after significant work
8. **Tasks database** — update status of any tasks you worked on
9. **Bugs database** — add/update bugs found or fixed
10. **Agent Log** — add entry ONLY if important (decision, error, breakthrough, blocker)

If Notion MCP is unavailable, log pending updates to `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` with `[NOTION_PENDING]` tag.

### If session is interrupted:
Prioritise: SESSION_LOG > KNOWN_ISSUES > CONTEXT > everything else.
Notion updates are non-critical — Obsidian is the source of truth.
