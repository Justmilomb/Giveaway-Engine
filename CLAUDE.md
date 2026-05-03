# CLAUDE.md — Giveaway Engine (PickUsAWinner)

## 1 — What This Is

Full-stack Instagram giveaway runner for [pickusawinner.com](https://pickusawinner.com) — scrapes comments from Instagram posts, applies filtering rules, and selects random winners. Supports scheduled giveaways, Stripe payments, and email notifications.

**Tech stack:** React 19 + Vite 7 + TailwindCSS 4 (frontend), Express 5 + Node.js (backend), PostgreSQL 16 + Drizzle ORM (database), Puppeteer + stealth plugin (scraping), Stripe PaymentIntent API (payments), Nodemailer (email)
**Platform:** Windows 10
**Language(s):** English British

---

## 2 — Rules (non-negotiable)

- **Don't ask permission.** Just execute. User trusts technical decisions.
- **No git operations.** User commits manually (except when explicitly told to commit).
- **No hardcoded secrets.** API keys, passwords, and tokens go in environment variables only. Never commit `.env` or `credentials.json`.
- **No over-engineering.** Implement what's asked. Three similar lines beats a premature abstraction.
- **Strict TypeScript.** `strict: true` is enabled. No `any`, no `@ts-ignore`.
- **Functional components + hooks only.** No class components.
- **CSS via Tailwind utility classes.** No CSS-in-JS, no `.css` files.
- **Validate at boundaries, trust internals.** Validate user input and external API responses. No defensive checks inside your own code.
- **No TODO comments in code** — track in `docs/CURRENT_TASKS.md`.
- **File size guideline:** Leaf modules stay under ~400 lines. Hub files may exceed this. Cohesion over line counts.
- **Comments explain *why*, not *what*.** If removing the comment wouldn't confuse a future reader, don't write it.
- **No backwards-compatibility shims** for removed code. Delete it; git has the history.

---

## 3 — Reading Order (cold start)

1. **This file** (`CLAUDE.md`) — rules, architecture, conventions
2. `docs/ARCHITECTURE.md` — system graph + subsystem responsibilities
3. `docs/CURRENT_TASKS.md` — what's done, what's in progress, what's next
4. `docs/CONTRACTS.md` — interface contracts (do not break these)
5. `docs/systems/<relevant>.md` — deep-dive on the system you'll touch
6. `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — project brain (decisions, history, known issues)

---

## 4 — Architecture Quick Reference

```
Browser (React 19 + Vite + TailwindCSS)          ← hub: App.tsx + client/src/
  │ HTTP /api/*
Express 5 Server (port 5000)                      ← hub: server/index.ts + routes.ts
  ├─ Middleware chain: Rate Limiter → IP Block → Validation → Handler
  ├─ auth.ts          Passport.js local strategy  ← leaf
  ├─ security.ts      Rate limits, credit system  ← leaf
  ├─ instagram.ts     Scraper dispatch            ← leaf
  ├─ scheduler.ts     Background job loop (60s)   ← leaf
  ├─ storage.ts       MemStorage / PostgreSQL      ← leaf
  ├─ email.ts         Nodemailer SMTP             ← leaf
  └─ scraper/         Puppeteer scraper module    ← hub (within scraper/)
       ├─ instagram-scraper.ts    Main scraper    ← leaf
       ├─ session-manager.ts      Login/cookies   ← leaf
       ├─ proxy-manager.ts        Proxy rotation  ← leaf
       └─ instagram-api-client.ts API utilities   ← leaf

shared/schema.ts   Drizzle tables + Zod schemas   ← hub: shared by client + server

External:
  ├─ PostgreSQL 16 (via Drizzle ORM)
  ├─ Stripe (PaymentIntent API)
  ├─ SMTP (Nodemailer)
  └─ WebSocket relay (Raspberry Pi scraper worker)
```

---

## 5 — Hub Files (BOSS ONLY — do not touch without orchestrator review)

These files wire everything together. Editing them risks breaking the whole system.

- `server/index.ts` — Express setup, HTTP server, scheduler init, Vite middleware
- `server/routes.ts` — all API endpoints (~400 lines)
- `shared/schema.ts` — Drizzle table definitions + Zod schemas (used by both client and server)
- `client/src/App.tsx` — React root + Wouter routes + providers
- `package.json` — dependency manifest
- `tsconfig.json` — TypeScript config + path aliases
- `vite.config.ts` — Vite config + path aliases

---

## 6 — Multi-Agent Team

| Role | Model | Responsibilities |
|------|-------|-----------------|
| **Boss / Orchestrator** | opus | Plans, owns hub files, integrates, reviews |
| **Feature Agent** | sonnet | Implements one system at a time (2–6 files) |
| **Support Agent** | haiku | Docs, review checklists, search |

See `docs/AGENT_WORKFLOW.md` for the dispatch protocol and change process.

---

## 7 — Key Conventions

### TypeScript
- Interfaces: PascalCase, no `I` prefix. Types over interfaces where possible.
- Functions/variables: camelCase. Constants: UPPER_SNAKE or camelCase.
- Components: PascalCase filenames matching export name.
- All env vars accessed through validated config — never `process.env` directly in business logic.

### Imports
- Client code: path aliases (`@/`, `@shared/`), not relative paths.
- Server code: relative imports.
- Barrel exports only at module boundaries.

### Components
- shadcn/ui pattern — copy-paste into `client/src/components/ui/`, customise locally.
- React Hook Form + `@hookform/resolvers/zod` for all forms.
- React Query for all server state. No `useEffect` for data fetching.

### Validation
- Zod schemas for all input validation. Derive from Drizzle schema via `drizzle-zod` where possible.
- Validate at the API boundary (`server/routes.ts`). Trust internal code.

### Logging
- All server-side logging via `server/log.ts` `log()` function.
- Never `console.log` in production paths.

---

## 8 — Current Phase

- **Phase 1: Foundation** — auth, storage, payments, email, Docker — `done`
- **Phase 2: Core feature** — scraper, comment filtering, winner selection, scheduler — `done`
- **Phase 3: Polish** — testing framework, CI/CD, performance, monitoring — `in progress`
- **Phase 4: Growth** — multi-platform support, analytics dashboard expansion — `planned`

---

## 9 — Dependency Management

Node project — dependencies are split in `package.json` (`dependencies` vs `devDependencies`).

### Rules
- **Lock file goes in git** (`package-lock.json`). It is not noise — it is reproducibility.
- **Update dependencies intentionally**, not automatically. Review changelogs before bumping.
- `package.json` is a hub file — Boss only.

---

## 10 — Environment & Config

```
.env.example    ← committed: template with all keys, no values
.env            ← NOT committed (in .gitignore)
credentials.json ← NOT committed (in .gitignore) — Google OAuth secret
```

All required environment variables are documented in `.env.example`. See the table below:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | For DB | PostgreSQL connection string |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | For email | SMTP config |
| `ADMIN_API_KEY` | For admin | Secret for admin endpoints |
| `SESSION_SECRET` | Production | Session encryption key |
| `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD` | For scraper | Credentials for Puppeteer scraper |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (served to frontend via `/api/config`) |
| `SCRAPER_RELAY_SECRET` | For relay | Shared secret for WebSocket scraper relay |
| `BASE_URL` | Optional | Domain for email links (auto-detected if not set) |
| `PORT` | Optional | Server port (default: 5000) |

---

## 11 — Testing

No automated test framework is configured (known gap — see `docs/CURRENT_TASKS.md`).

**Available checks:**

```bash
npm run check          # TypeScript compiler (tsc --noEmit) — primary correctness check
npm run test-scraper   # Manual scraper test
```

**Smoke test checklist:** See `docs/TESTING.md`.

---

## 12 — Error Handling

- **Fail loudly at startup** for missing env vars. Log a clear message and exit — don't crash 20 minutes in.
- **Never swallow errors silently.** At minimum, log with context before re-throwing.
- Express error middleware in `server/index.ts` catches unhandled errors — let it do its job.
- Log at the right level: debug, info, warning, error — via `server/log.ts`.

---

## 13 — Commands

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

# Utilities
npm run instagram:login  # Manual Instagram login automation
npm run test-scraper     # Test the custom Instagram scraper
```

**Path aliases** (`tsconfig.json` + `vite.config.ts`):
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets` → `./attached_assets` (Vite only)

---

## 14 — CI/CD

CI runs on every push to `main` and every pull request. See `.github/workflows/ci.yml`.

**Pipeline:** typecheck → (tests when added)

Main branch must always be green. Use PRs — never push directly to main.

---

## 15 — Before You Finish (Session Write-Back)

> Every session must leave the project in a state where the next agent can pick up without archaeology.

### Minimum write-back (every session):
1. `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` — add entry if anything important happened
2. `E:\Coding\Second Brain\Giveaway-Engine\KNOWN_ISSUES.md` — add/remove bugs if any changed

### Full write-back (when project state materially changed):
3. `docs/CURRENT_TASKS.md` — mark completed tasks, update In Progress, add Up Next
4. `docs/CHANGELOG.md` — one-line entry for anything architecturally significant
5. `E:\Coding\Second Brain\Giveaway-Engine\CONTEXT.md` — update changed sections only
6. `E:\Coding\Second Brain\Giveaway-Engine\PATTERNS.md` — add if you learned something new
7. `E:\Coding\Second Brain\_index\MASTER_INDEX.md` — update if you added new knowledge files
8. `E:\Coding\Second Brain\_index\SKILL_TRANSFERS.md` — add if lesson applies elsewhere

### Notion database updates (use Notion MCP tools):

Database IDs are in `E:\Coding\Second Brain\_system\conventions\notion-config.md`.
Use `data_source_id` (not `database_id`) when creating pages via `notion-create-pages`.

9. **Projects database** — update status/health for Giveaway-Engine after significant work
10. **Tasks database** — update status of any tasks you worked on
11. **Bugs database** — add/update bugs found or fixed
12. **Agent Log** — add entry ONLY if important (decision, error, breakthrough, blocker)

If Notion MCP is unavailable, log pending updates to `E:\Coding\Second Brain\Giveaway-Engine\SESSION_LOG.md` with `[NOTION_PENDING]` tag.

### If session is interrupted:
Prioritise: SESSION_LOG > KNOWN_ISSUES > CURRENT_TASKS > everything else.
Notion updates are non-critical — Obsidian is the source of truth.

---

## Key Files by Size/Complexity

| File | Size | Purpose |
|---|---|---|
| `client/src/pages/tool.tsx` | 68KB | Main giveaway tool UI — comment fetching, filtering, winner selection |
| `server/scraper/instagram-scraper.ts` | 41KB | Puppeteer-based Instagram scraper |
| `server/routes.ts` | 22KB | All API endpoints |
| `server/scraper/instagram-api-client.ts` | 18KB | Instagram API utilities |
| `server/security.ts` | 14KB | Rate limiting, credit system, IP blocking |
| `server/email-templates.ts` | 13KB | Email HTML/text templates |
| `server/instagram.ts` | 12KB | Instagram integration — dispatch strategy |
