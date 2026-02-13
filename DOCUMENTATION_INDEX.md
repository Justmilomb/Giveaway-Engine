# Documentation Index

Complete guide to all documentation in the PickUsAWinner Engine project.

## Quick Start
👉 **Start here for setup and first steps**

- **README.md** — Project overview, folder structure, commands, common tasks

## Architecture & Design
📐 **Understand how the system works**

- **CLAUDE.md** — Complete architecture documentation (tech stack, API routes, database schema)
- **CODE_ORGANIZATION.md** — File placement rules, naming conventions, quality standards

## Development Guides
🛠️ **How to work on different parts of the codebase**

- **client/README.md** — Frontend structure, React patterns, component development, styling
- **server/README.md** — Backend structure, API patterns, authentication, database, debugging
- **server/scraper/README.md** — Instagram scraper details, session management, network interception
- **script/README.md** — Build scripts, utility scripts, development workflow

## Release & Deployment
🚀 **Getting ready for production**

- **RELEASE_CHECKLIST.md** — Pre-release verification, deployment steps, rollback plan
- **RELEASE_NOTES.txt** — Key improvements, technical details, deployment checklist
- **CHANGES_SUMMARY.md** — Detailed changelog (v1.0.2)

## Documentation Map

```
Root Documentation:
├── README.md                          # START HERE — Quick start
├── CLAUDE.md                          # Architecture & tech stack
├── CODE_ORGANIZATION.md               # File structure & conventions
├── DOCUMENTATION_INDEX.md             # This file
├── CHANGES_SUMMARY.md                 # What changed in v1.0.2
├── RELEASE_CHECKLIST.md               # Deploy checklist
└── RELEASE_NOTES.txt                  # Release summary

Client Documentation:
└── client/README.md                   # Frontend guide

Server Documentation:
├── server/README.md                   # Backend guide
└── server/scraper/README.md           # Scraper guide

Scripts Documentation:
└── script/README.md                   # Build & utility scripts
```

## Documentation by Use Case

### "I'm new to the project"
1. Read: **README.md** (overview, quick start)
2. Read: **CODE_ORGANIZATION.md** (understand structure)
3. Read: **client/README.md** or **server/README.md** (depending on your focus)

### "I want to add a feature"
1. Check: **CODE_ORGANIZATION.md** (where does my code go?)
2. Read: **client/README.md** (if frontend) or **server/README.md** (if backend)
3. Look at: **CLAUDE.md** (architecture for context)
4. Update: **CLAUDE.md** (if architecture changes)

### "I found a bug"
1. Check: **server/README.md** (debugging section)
2. Look at: **CLAUDE.md** (understand the flow)
3. Add logs: Follow patterns in existing code
4. Test: `npm run dev` and check console output

### "I'm deploying to production"
1. Read: **RELEASE_CHECKLIST.md** (step-by-step)
2. Check: **RELEASE_NOTES.txt** (what to verify)
3. Review: **CHANGES_SUMMARY.md** (what's new)

### "I'm working on Instagram scraping"
1. Read: **server/scraper/README.md** (scraper specifics)
2. Read: **server/README.md** (Instagram orchestration)
3. Test: `npm run test-scraper`

### "I want to understand the database"
1. Check: **CLAUDE.md** (schema section)
2. Look at: **server/README.md** (database section)
3. Read: **shared/schema.ts** (actual schema)

### "I want to add a new page"
1. Read: **client/README.md** (how to add pages)
2. Check: **CODE_ORGANIZATION.md** (file placement)
3. Follow: React patterns in **client/README.md**

## Key Files Referenced in Docs

| File | Documented In |
|------|----------------|
| `client/src/pages/tool.tsx` | CLAUDE.md, client/README.md, CHANGES_SUMMARY.md |
| `server/instagram.ts` | CLAUDE.md, server/README.md, CHANGES_SUMMARY.md |
| `server/routes.ts` | CLAUDE.md, server/README.md |
| `shared/schema.ts` | CLAUDE.md, server/README.md |
| `package.json` | README.md, script/README.md |

## Search by Topic

### Authentication & Users
- **CLAUDE.md** → Environment Variables, API Routes
- **server/README.md** → Authentication section
- **RELEASE_CHECKLIST.md** → Security section

### API Endpoints
- **CLAUDE.md** → API Routes table
- **server/README.md** → API endpoints, routes.ts section
- **server/README.md** → Common tasks → Add API endpoint

### Database
- **CLAUDE.md** → Database Schema section
- **server/README.md** → Database section
- **server/README.md** → Common tasks → Add database table

### Instagram Scraping
- **CLAUDE.md** → Architecture Patterns (Instagram scraping)
- **server/README.md** → Key Files (instagram.ts section)
- **server/scraper/README.md** → Complete scraper guide

### Styling & UI
- **client/README.md** → Styling section
- **CODE_ORGANIZATION.md** → Frontend structure
- **CHANGES_SUMMARY.md** → UI/UX Improvements section

### Deployment & Production
- **README.md** → Build Details
- **RELEASE_CHECKLIST.md** → Complete deployment guide
- **RELEASE_NOTES.txt** → Deployment checklist

### Code Quality & Organization
- **CODE_ORGANIZATION.md** → Complete guide (folder rules, naming, etc.)
- **client/README.md** → Development section
- **server/README.md** → Development section

## Document Maintenance

### When to Update Documentation
- Architecture changes → Update **CLAUDE.md**
- New folder/file → Update **CODE_ORGANIZATION.md**
- Release → Update **RELEASE_CHECKLIST.md** and **CHANGES_SUMMARY.md**
- Development workflow changes → Update relevant README
- Deployment procedure changes → Update **RELEASE_CHECKLIST.md**

### Which Documentation to Update
| Change | Document(s) |
|--------|-------------|
| New feature | CHANGES_SUMMARY.md, relevant README |
| Architecture change | CLAUDE.md, CODE_ORGANIZATION.md |
| New folder | CODE_ORGANIZATION.md, README.md |
| Deployment procedure | RELEASE_CHECKLIST.md |
| API endpoint | CLAUDE.md (API Routes), server/README.md |
| Database schema | CLAUDE.md (schema), server/README.md |

## Contributing

When adding code to the project:
1. Follow **CODE_ORGANIZATION.md** for file placement
2. Follow patterns in relevant README (client/ or server/)
3. Update docs if architecture changes
4. Run `npm run check` (TypeScript)
5. Test locally before committing

## Feedback & Issues

- Found a documentation gap? Create an issue or update directly.
- Documentation out of date? Please fix it.
- Unclear explanation? Improve it for the next developer.

**Good documentation is everyone's responsibility.**

---

**Last Updated:** February 13, 2026 (v1.0.2 release)
**Status:** ✅ Complete and current
