# Scheduler

## Goal
Run pending giveaways in the background — fetch comments, pick winners, send emails — without user interaction.

## Implementation
`server/scheduler.ts` — a `setInterval` loop that polls every 60 seconds. On each tick it queries storage for giveaways with `status = 'pending'` and `scheduledFor <= now`. For each, it dispatches the Instagram scraper, applies the stored filtering config, selects random winners, saves results, and triggers email notifications via `server/email.ts`. Giveaway status transitions: `pending → completed` (success) or `pending → failed` (scraper/email error).

## Key Code
```typescript
// server/index.ts wires this up at startup
import { startScheduler } from './scheduler.js';
startScheduler();
```

## Notes
- Scheduler starts automatically when the server starts — no separate process needed
- Failed jobs stay in storage with `status = 'failed'` and an error message
- Poll interval is hard-coded at 60s — not configurable via env
- If the server restarts mid-run, the job will be re-picked up on next poll
