# Giveaway Engine (PickUsAWinner)

**A free, simple Instagram giveaway tool designed for creators who don't want to pay subscriptions or hand over their data.**

[Live Demo](https://pickusawinner.com) | [GitHub](https://github.com/Justmilomb/Giveaway-Engine)

---

## Project Story

My mum runs Instagram giveaways to grow her following, but she was frustrated. Every giveaway platform wanted monthly subscriptions, required sign-ups (meaning sharing personal info), and kept forgetting to cancel. She asked me to build something simpler.

**So I built Giveaway Engine** — a one-time payment, zero personal info, zero subscriptions approach. Just visit the site, pay once per giveaway, and run it. No accounts. No tracking. No subscriptions to forget.

This was my first real AI-coded website, built with **Cursor**, **AntiGravity**, **Claude Code**, and **Codex**. I learned how to prompt properly and discovered that different AI tools excel at different tasks — small, focused work vs. larger architectural chunks. The workflow was efficient, and the result is a tool I'm proud to have built with my mum's feedback driving the UX.

---

## What It Does

1. **Paste an Instagram post URL** → Scrape all public comments
2. **Set filters** → Filter by followers, engagement, keyword mentions, custom rules
3. **Pick winners** → Select random winners from filtered comments
4. **Get results** → Download winner list, optionally auto-email them
5. **Schedule giveaways** → Set a time and let the system handle it

**One-time payment per giveaway.** No subscriptions. No personal info required.

---

## Tech Stack

A full-stack TypeScript application built for reliability and real-world use:

- **Frontend:** React 19, Vite 7, TailwindCSS 4, shadcn/ui (Radix), Wouter (routing), React Query, React Hook Form + Zod
- **Backend:** Express 5, Passport.js (optional auth), express-session, express-rate-limit
- **Database:** PostgreSQL 16, Drizzle ORM (optional; in-memory with JSON fallback available)
- **Scraping:** Puppeteer + puppeteer-extra-plugin-stealth for reliable comment fetching
- **Payments:** Stripe (PaymentIntent API + Stripe Elements)
- **Email:** Nodemailer (SMTP) for winner notifications
- **Build:** Vite (client), esbuild (server), tsx (dev runner)

---

## Quick Start

```bash
npm install
npm run dev                    # Start backend + frontend dev server
npm run build                 # Production build
npm run start                 # Run production build

# Optional: Local Instagram scraper (if running custom scraper)
npm run test-scraper          # Test the Instagram scraper
npm run instagram:login       # Manual Instagram login for testing
```

**Development:** Start `npm run dev`, then open `http://localhost:5000`
**Type checking:** `npm run check` (TypeScript strict mode)

## Repository Structure

The codebase is organized for clarity and maintainability:

```
client/src/
├── pages/              # Route pages (tool, home, analytics, schedule, auth)
├── components/         # Reusable UI (ui/ contains shadcn components)
├── hooks/              # Custom hooks (use-user, use-toast, use-mobile)
├── lib/                # Utilities (stripe, queryClient, protected-route)
├── App.tsx             # Root component with Wouter routes
└── main.tsx            # React entry point

server/
├── index.ts            # Express setup, HTTP server, scheduler
├── routes.ts           # All API endpoints (~400 lines)
├── auth.ts             # Passport.js local strategy, session config
├── security.ts         # Rate limiters, credit system, IP blocking
├── instagram.ts        # Instagram scraper dispatch
├── scheduler.ts        # Background job processor (polls every 60s)
├── storage.ts          # In-memory + JSON file persistence
├── email.ts            # Nodemailer SMTP config
├── email-templates.ts  # HTML/text email templates
├── image.ts            # Image processing (sharp)
├── log.ts              # Logging utility
├── vite.ts             # Vite dev middleware setup
├── static.ts           # Production static file serving
└── scraper/
    ├── instagram-scraper.ts      # Main Puppeteer scraper
    ├── session-manager.ts        # Login automation & cookie persistence
    ├── proxy-manager.ts          # Proxy rotation
    ├── instagram-api-client.ts   # Instagram API utilities
    └── test-scraper.ts           # Manual scraper testing

shared/
└── schema.ts           # Drizzle ORM schema + Zod validation schemas

script/
├── build.ts            # Production build orchestration
├── manual-login.ts     # Instagram login automation
└── debug-api.ts        # API endpoint debugging

migrations/             # Drizzle-kit database migrations
CLAUDE.md               # Architecture deep-dive documentation
```

## Key Features

### Authentication & Sessions
- **Passport.js** local strategy with optional user accounts
- Guest mode (no sign-up required) for casual users
- Sessions stored in memory or PostgreSQL (if `DATABASE_URL` set)

### Credit System
- **2 free credits** per IP address
- **Paid credits** via Stripe one-time payment
- Credits consumed per comment fetch
- Returns HTTP 402 when credits exhausted

### Instagram Scraping
- **Strategy 1:** Custom Puppeteer scraper with network interception
- **Strategy 2:** WebSocket relay to local worker (for parallel processing)
- **Strategy 3:** DOM fallback if API fails
- Handles login, session management, and proxy rotation

### Scheduled Giveaways
- Queue giveaways for future execution
- Background scheduler polls every 60 seconds
- Automatic winner selection and email notification (if SMTP configured)
- Results accessible via public access token

### Email Notifications
- Sent via Nodemailer (SMTP)
- HTML + plain text templates
- For scheduled giveaway results and optional winner notifications
- Easy setup with Gmail or iCloud app passwords (see [Email Setup](#email-setup-icloudgmail))

---

## API Routes

All endpoints under `/api` with middleware chain:
1. Global rate limiting
2. IP block checking
3. Request validation (Zod)
4. Route-specific handlers

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/register` | POST | No | Create user account |
| `/api/login` | POST | No | Authenticate (Passport local) |
| `/api/logout` | POST | Yes | End session |
| `/api/user` | GET | Yes | Get current user |
| `/api/credits` | GET | No | Check remaining credits (IP-based) |
| `/api/credits/redeem` | POST | No | Redeem payment token |
| `/api/config` | GET | No | Stripe publishable key for frontend |
| `/api/payment/create-intent` | POST | No | Create Stripe PaymentIntent |
| `/api/payment/confirm` | POST | No | Verify payment, issue purchase token |
| `/api/instagram/validate` | POST | No | Validate Instagram post URL |
| `/api/instagram/comments` | POST | No | Fetch comments (consumes credit) |
| `/api/giveaways` | POST | Yes | Create/schedule a giveaway |
| `/api/giveaways` | GET | Yes | List user's giveaways |
| `/api/giveaways/:token` | GET | No | Get giveaway by public token |
| `/api/giveaways/:id` | PUT | Yes | Update a giveaway |
| `/api/giveaways/:id` | DELETE | Yes | Delete a giveaway |
| `/api/analytics` | GET | Admin | View stats |
| `/api/admin/generate-token` | POST | Admin | Generate payment token |
| `/api/admin/security` | GET | Admin | View security stats |

Response format: `{ message: string, data?: unknown }` or `{ error: string }`

---

## Architecture & Design

### Client Routes (Wouter)
- `/` — Home/landing page
- `/tool` — Main giveaway tool UI
- `/analytics` — Statistics dashboard
- `/schedule/:token` — Scheduled giveaway detail
- `/login`, `/register` — Authentication pages
- `/privacy`, `/terms`, `/coming-soon` — Static pages

### Frontend Architecture
- **State:** React Context for auth (`use-user`), React Query for server state
- **Components:** shadcn/ui (New York style) + Lucide icons
- **Forms:** React Hook Form + Zod for validation
- **Styling:** TailwindCSS utilities (no CSS modules)

### Backend Architecture
- **Framework:** Express 5 with custom middleware chain
- **Storage:** MemStorage (in-memory Map) with JSON persistence, or PostgreSQL
- **Scheduler:** Polls for pending giveaways every 60s
- **Error handling:** Global middleware catches unhandled errors, returns JSON

### Code Maintenance Standards

#### Folder Organization

Each folder contains specific, related code:
- **client/src/pages/** — One file per route (tool.tsx, home.tsx, etc.)
- **client/src/components/** — Reusable UI components
- **client/src/lib/** — Utilities, helpers, configuration
- **server/** — Backend logic at root or in focused subfolders
- **server/scraper/** — Only Instagram scraping logic (don't mix with other features)
- **shared/** — Only code used by both client and server

#### File Naming

- **Pages/Components:** PascalCase, `.tsx` (e.g., `GiveawayTool.tsx`)
- **Utilities:** camelCase, `.ts` (e.g., `stripe.ts`)
- **Schemas/Types:** Define in same file or `shared/schema.ts` if shared
- **Tests:** Suffix with `.test.ts` or `.spec.ts`

#### Code Style

- **TypeScript:** Strict mode enabled. No `any` unless unavoidable.
- **Imports:** Use path aliases (`@/`, `@shared/`) in client; relative imports in server
- **Functions:** Named exports for tree-shaking; small, focused functions
- **Comments:** Only when logic is non-obvious; avoid redundant comments
- **Formatting:** 2-space indentation, semicolons required

#### Component Example

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: (data: string) => void;
}

export default function MyComponent({ onSubmit }: Props) {
  const [state, setState] = useState("");

  const handleClick = () => {
    onSubmit(state);
  };

  return <Button onClick={handleClick}>Submit</Button>;
}
```

#### API Route Pattern

Routes return JSON with `message` or `error` fields. HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request (validation failed)
- `401`: Unauthorized (auth required)
- `402`: Payment required (no credits)
- `404`: Not found
- `500`: Server error

Error handling:
- **Client:** Use `useToast()` hook to display errors
- **Server:** Throw errors to middleware; global handler returns JSON
- **Database:** Catch transaction errors; don't let constraints fail silently

---

## Email Setup (iCloud/Gmail)

Enable winner notifications by configuring SMTP. No SMTP = giveaways still work, just no emails sent.

### Steps

1. **Create an app password** with your email provider:
   - **iCloud:** appleid.apple.com → Sign-In and Security → App-Specific Passwords
   - **Gmail:** myaccount.google.com → Security → 2-Step Verification → App passwords

2. **Set environment variables** in `.env`:
   ```
   SMTP_HOST=smtp.icloud.com          # or smtp.gmail.com
   SMTP_PORT=587                       # or 465
   SMTP_SECURE=false                   # true if port 465
   SMTP_USER=your-email@icloud.com
   SMTP_PASS=your-app-password         # (not your regular password)
   SMTP_FROM=your-email@icloud.com     # Usually same as SMTP_USER
   SMTP_FROM_NAME=PickUsAWinner        # Display name
   SMTP_REPLY_TO=support@yoursite.com  # Optional reply-to
   ```

3. **Test SMTP connectivity** (no email sent):
   ```bash
   curl -X GET http://localhost:5000/api/admin/email/health \
     -H "x-admin-key: YOUR_ADMIN_API_KEY"
   ```
   Success response: `{ "configured": true, "verified": true }`

---

## Environment Variables

Create a `.env` file at the project root (see `.env.example`):

### Required (Production)

```
STRIPE_SECRET_KEY=sk_...               # Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_...          # Stripe public key
ADMIN_API_KEY=your-secret-key          # For admin endpoints
SESSION_SECRET=random-string           # For session encryption
```

### Optional (Features)

```
DATABASE_URL=postgresql://user:pass... # PostgreSQL (default: in-memory)
INSTAGRAM_USERNAME=...                 # For Instagram scraper
INSTAGRAM_PASSWORD=...                 # For Instagram scraper
SCRAPER_RELAY_SECRET=...               # WebSocket relay authentication
SCRAPER_RESULT_SECRET=...              # Callback authentication (defaults to relay secret)
SCRAPER_JOBS_FILE=worker-jobs.json     # Worker schedule queue file path
```

### Email (Optional)

```
SMTP_HOST=smtp.icloud.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@icloud.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@icloud.com
SMTP_FROM_NAME=PickUsAWinner
SMTP_REPLY_TO=support@yoursite.com
```

### Server/Storage

```
PORT=5000                              # Server port (default: 5000)
DATA_FILE=/var/data/db.json            # JSON persistence path (default: db.json)
NODE_ENV=production                    # Set in production
BASE_URL=https://pickusawinner.com     # For email links (auto-detected if not set)
```

---

## Database

### Optional PostgreSQL

By default, Giveaway Engine uses **in-memory storage** with JSON file persistence (in `db.json`). For production or ephemeral hosting:

1. Set `DATABASE_URL` in `.env`
2. Run migrations: `npm run db:push`

**Drizzle ORM** schema (`shared/schema.ts`):
- **users** — id (UUID), firstName, username (optional, unique), email (unique), password, createdAt
- **giveaways** — id (UUID), userId (FK), scheduledFor, status (pending/completed/failed), config (JSONB), winners (JSONB), accessToken (unique), createdAt

### Without PostgreSQL

In-memory storage (Map) persists to `db.json`. Data is lost if server restarts unless you set `DATA_FILE` to a persistent volume.

---

## Testing & Type Checking

No automated test framework. Use these for manual testing:

```bash
npm run check              # TypeScript type checking (strict mode)
npm run test-scraper      # Test Instagram scraper
npm run instagram:login   # Manual Instagram login
npm run debug-api         # Test API endpoints
```

For browser testing: `npm run dev` and visit `http://localhost:5000`

---

## Deployment

### Build & Production

```bash
npm run build     # Outputs to dist/
npm run start     # Run production build (dist/index.cjs)
```

**Build outputs:**
- **Client:** `dist/public/` (served by Express)
- **Server:** `dist/index.cjs` (CommonJS, minified, dependencies bundled)

### Environment

```bash
NODE_ENV=production    # Critical for production
PORT=5000              # Server port
DATABASE_URL=...       # Use PostgreSQL for persistence
DATA_FILE=/var/data/db.json  # Persistent storage path
```

### Docker

A `Dockerfile` is included (Node.js 20 Alpine, runs as non-root). Ensure:
- `.env` is configured with required variables
- `dist/` folder is pre-built
- Volume mounted for persistent data

### Hosting

Deployed on Render; works anywhere Node.js runs (Vercel, Fly.io, Docker, VPS, etc.).

---

## Search Engine Optimization

### Bing/Microsoft Edge

1. Submit your sitemap at [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sitemap URL: `https://pickusawinner.com/sitemap.xml`
3. Verify domain and monitor indexing

---

## Common Development Tasks

### Add a new API endpoint

1. Define route in `server/routes.ts` (or break into `server/routes/feature.ts`)
2. Add validation schema (Zod) in `shared/schema.ts` if needed
3. Implement handler with proper error handling
4. Return JSON: `{ message: "...", data: ... }` or `{ error: "..." }`

Example:
```typescript
app.post("/api/my-endpoint", validate(mySchema), async (req, res) => {
  const result = await doSomething(req.body);
  res.json({ message: "Success", data: result });
});
```

### Add a new frontend page

1. Create component in `client/src/pages/YourPage.tsx`
2. Add route in `client/src/App.tsx` using Wouter
3. Import and render in root layout

### Modify the Instagram scraper

1. Edit `server/scraper/instagram-scraper.ts`
2. Test: `npm run test-scraper`
3. Check logs: `server/log.ts` has the `log()` utility
4. Server runs at `http://localhost:5000`

### Debug an issue

1. **Server logs:** Check real-time output from `npm run dev`
2. **Add logging:** Use `log()` from `server/log.ts`
3. **Browser console:** Press `F12` in your browser for client errors
4. **Network tab:** Check API requests/responses
5. **Database:** Query directly if using PostgreSQL

---

## Resources

- **[CLAUDE.md](./CLAUDE.md)** — Detailed architecture and conventions
- **[Stripe Documentation](https://stripe.com/docs)** — Payment integration reference
- **[Drizzle ORM](https://orm.drizzle.team)** — Database schema and migrations
- **[React Query](https://tanstack.com/query)** — Server state management
- **[TailwindCSS](https://tailwindcss.com)** — Styling reference
- **[shadcn/ui](https://ui.shadcn.com)** — Component library

---

## License & Credits

Built with **Cursor**, **AntiGravity**, **Claude Code**, and **Codex**. Open source and free to use.

**Version:** 1.0.2
**Live:** [pickusawinner.com](https://pickusawinner.com)
