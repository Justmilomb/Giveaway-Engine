# Security

## Goal
Rate-limit API abuse, block malicious IPs, and enforce the credit system.

## Implementation
`server/security.ts` — three layers:
1. **Global rate limiter** — `express-rate-limit` applied to all `/api/*` routes. Configurable window + max per IP.
2. **IP block list** — maintains a Set of blocked IPs (persisted to `security-data.json`). Checked before every request. Admin can add/remove via `GET /api/admin/security`.
3. **Credit system** — IP-based counter. 2 free credits per IP on first use. Decremented on `POST /api/instagram/comments`. Returns HTTP 402 when exhausted. Paid credits loaded via token redemption.

## Key Code
```typescript
// Middleware order in server/index.ts:
// globalRateLimiter → ipBlockCheck → requestValidation → routeHandlers
```

## Notes
- `security-data.json` is in `.gitignore` — never commit it (contains IP block list)
- Admin endpoints require `X-Admin-Key: <ADMIN_API_KEY>` header
- Credit counts reset if `MemStorage` is cleared (server restart without `db.json`)
- Rate limiter uses IP from `req.ip` — ensure `trust proxy` is set correctly behind a reverse proxy
