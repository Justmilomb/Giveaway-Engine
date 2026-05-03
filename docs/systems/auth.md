# Auth

## Goal
Authenticate users via email + password. Maintain sessions across requests.

## Implementation
`server/auth.ts` — Passport.js local strategy. Registration hashes passwords with Node's `scrypt` (salt + hash stored together). Login verifies against the stored hash. Sessions managed by `express-session` with a secret from `SESSION_SECRET` env var. Session store defaults to in-memory (MemoryStore); swap for a Redis store in production for multi-process deployments.

## Key Code
```typescript
// All routes check auth via this middleware
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
```

## Notes
- `SESSION_SECRET` must be set in production — server will warn but continue without it
- Sessions are not persisted across server restarts (MemoryStore) unless a session DB is configured
- No OAuth / social login — local strategy only
- Admin auth is separate: `ADMIN_API_KEY` header check in `server/security.ts`
