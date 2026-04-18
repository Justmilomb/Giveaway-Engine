# Storage

## Goal
Persist users and giveaways across server restarts. Works with or without a database.

## Implementation
`server/storage.ts` exports a `storage` singleton implementing an `IStorage` interface. Two implementations: `MemStorage` (Map-based, serialises to `db.json` on every write) and `DrizzleStorage` (PostgreSQL via Drizzle ORM). `DrizzleStorage` is activated automatically when `DATABASE_URL` is set; otherwise `MemStorage` is used. All routes and the scheduler interact with `storage` only — never with the DB or file directly.

## Key Code
```typescript
// storage.ts exports a ready-to-use singleton
import { storage } from './storage.js';
await storage.createGiveaway(data);
const users = await storage.listUsers();
```

## Notes
- `db.json` path is configurable via `DATA_FILE` env var (default: `db.json`)
- `db.json` is in `.gitignore` — never commit it
- `MemStorage` flushes synchronously on every write; no batching
- Schema defined in `shared/schema.ts` — shared Drizzle + Zod definitions
- Migrations: `npm run db:push` (drizzle-kit push, not migration files)
