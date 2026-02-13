# Whiskey Canon Roadmap

> Prioritized development roadmap covering all open issues.
> Last updated: 2026-02-12

## How to Read This Roadmap

Issues are grouped into **6 phases** ordered by priority. Within each phase, issues are sorted by implementation order — earlier items often unblock later ones. Dependency chains are called out explicitly.

**Phase rationale:**
- **Phase 1** — Developer experience and infrastructure. Unblocks safe, efficient work on everything that follows.
- **Phase 2** — UX polish and performance. Quick wins and quality-of-life improvements for existing users.
- **Phase 3** — Collection feature expansion. Deepens the core collection management workflow.
- **Phase 4** — Advanced features. Net-new capabilities that expand beyond collection tracking.
- **Phase 5** — Discord bot integration. A new `bot/` workspace with slash commands for collection interaction.
- **Phase 6** — Platform expansion. Large initiatives that depend on a stable, feature-rich core.

---

## Completed Work

### ~~Milestone 1: Security & Stability~~ (Complete — v1.5.0)

*All 8 issues resolved as of 2026-02-08. The application now has a hardened security baseline.*

| Issue | Status |
|-------|--------|
| [#46 — Add Helmet middleware for HTTP security headers](https://github.com/DamageLabs/whiskey-canon/issues/46) | Closed |
| [#43 — Add express-rate-limit to auth endpoints](https://github.com/DamageLabs/whiskey-canon/issues/43) | Closed |
| [#49 — Validate required environment variables at startup](https://github.com/DamageLabs/whiskey-canon/issues/49) | Closed |
| [#44 — Replace in-memory session store with persistent store](https://github.com/DamageLabs/whiskey-canon/issues/44) | Closed |
| [#52 — Enforce stronger password policy](https://github.com/DamageLabs/whiskey-canon/issues/52) | Closed |
| [#45 — Add CSRF token validation](https://github.com/DamageLabs/whiskey-canon/issues/45) | Closed |
| [#47 — Add express-validator to all routes](https://github.com/DamageLabs/whiskey-canon/issues/47) | Closed |
| [#51 — Create security hardening checklist](https://github.com/DamageLabs/whiskey-canon/issues/51) | Closed |

See [docs/security-hardening.md](docs/security-hardening.md) for the full deployment security checklist and architecture overview.

### Other Completed Issues

| Issue | Release |
|-------|---------|
| [#56 — Add ESLint and Prettier to CI](https://github.com/DamageLabs/whiskey-canon/issues/56) | Post-v1.6.0 |
| [#89 — Add scheduled automatic backups and on-demand backup/restore](https://github.com/DamageLabs/whiskey-canon/issues/89) | v1.6.0 |
| [#77 — Add JSON import/export for collection backup](https://github.com/DamageLabs/whiskey-canon/issues/77) | v1.6.0 |
| [#35 — Add user data export (GDPR)](https://github.com/DamageLabs/whiskey-canon/issues/35) | v1.6.0 |
| [#86 — Add public profiles directory page](https://github.com/DamageLabs/whiskey-canon/issues/86) | v1.4.0 |
| [#40 — Wire up Contact Us form with Resend email](https://github.com/DamageLabs/whiskey-canon/issues/40) | v1.3.0 |
| [#34 — Add public/private visibility toggle for user profiles](https://github.com/DamageLabs/whiskey-canon/issues/34) | v1.2.0 |
| [#6 — OnlyDrams Import](https://github.com/DamageLabs/whiskey-canon/issues/6) | v1.0.1 |
| [#1 — Add SSL/TLS Support for HTTPS Connection](https://github.com/DamageLabs/whiskey-canon/issues/1) | v1.0.4 |

---

## Phase 1: Developer Experience & Infrastructure

*Build the foundation for safe, efficient development. These reduce friction and increase confidence for all future feature work.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 1 | [#101 — Evaluate Prisma ORM as database layer](https://github.com/DamageLabs/whiskey-canon/issues/101) | Evaluation | Backend | Prisma would replace raw better-sqlite3 (193 sync calls), provide built-in migrations, generated types, and database-agnostic abstraction. **If adopted, supersedes #88, #57, and accelerates #68, #70, #58.** Evaluate first, then decide. |
| 2 | [#88 — Implement lightweight custom migration runner](https://github.com/DamageLabs/whiskey-canon/issues/88) | Refactor | Backend | Replaces monolithic `initializeDatabase()` with numbered migration files and a `migrations` table. **Critical prerequisite** for #60, #72, #75, #71, #80, and #100. Supersedes #57. **May be superseded by #101 (Prisma).** |
| 3 | [#54 — Improve integration test infrastructure](https://github.com/DamageLabs/whiskey-canon/issues/54) | Testing | Backend | Isolated test database lifecycle with file-based test DB option; unblocks reliable test expansion. |
| 4 | [#53 — Expand backend test coverage](https://github.com/DamageLabs/whiskey-canon/issues/53) | Testing | Backend | Auth flows, CRUD, and admin endpoints need deeper coverage. Depends on #54. |
| 5 | [#55 — Add React Testing Library tests](https://github.com/DamageLabs/whiskey-canon/issues/55) | Testing | Frontend | Login, dashboard, WhiskeyForm, and analytics have zero test coverage. CI doesn't run frontend tests. |
| 6 | [#48 — Add npm audit to CI](https://github.com/DamageLabs/whiskey-canon/issues/48) | Security | Full-stack | 9 known vulnerabilities (6 high, 3 moderate). Automated audit catches new ones before merge. |
| 7 | [#50 — Add structured logging with request IDs](https://github.com/DamageLabs/whiskey-canon/issues/50) | Enhancement | Backend | 314 `console.log` calls across 28 files. Structured logging with request IDs enables production debugging. |
| 8 | [#70 — Extract shared types into workspace package](https://github.com/DamageLabs/whiskey-canon/issues/70) | Refactor | Full-stack | Types duplicated between frontend/backend with silent discrepancies (e.g., frontend `Role` enum missing `VIEWER`). **May be accelerated by #101 (Prisma generated types).** |
| 9 | [#58 — Add Zod schemas for whiskey validation](https://github.com/DamageLabs/whiskey-canon/issues/58) | Enhancement | Full-stack | Only 13 of ~50 fields validated; 37+ fields pass through unvalidated. Shared schemas replace ad-hoc checks. Depends on #70. **May be accelerated by #101 (zod-prisma-types).** |

**Scope:** 9 issues. Mix of testing, tooling, and refactoring. #101 is the first item to evaluate — its outcome determines whether #88 or Prisma Migrate handles the migration system.

**Dependencies:**
```
#101 (Prisma evaluation) → decides fate of #88, #57
#88 or #101 (migration system) → unlocks #60, #72, #75, #71, #80, #100
#54 (test infra) → #53 (backend tests)
#70 (shared types) → #58 (Zod schemas)
```

---

## Phase 2: UX Polish & Performance

*Quick wins and quality-of-life improvements that deliver visible value to existing users with moderate effort.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 9 | [#36 — Improve table row contrast](https://github.com/DamageLabs/whiskey-canon/issues/36) | UX | Frontend | ~30 min effort. WCAG 1.4.11 concern; improves readability for the primary view every user sees. |
| 10 | [#63 — Add Quick Add mode](https://github.com/DamageLabs/whiskey-canon/issues/63) | Feature | Frontend | The 7-tab, 57-field form is intimidating. A 3-field quick-add reduces friction for casual entries. |
| 11 | [#67 — Bundle analysis and lazy-load routes](https://github.com/DamageLabs/whiskey-canon/issues/67) | Performance | Frontend | Single 780KB bundle; Vite already warns. Lazy loading cuts initial load time significantly. ~2 hours effort. |
| 12 | [#37 — Add light mode theme](https://github.com/DamageLabs/whiskey-canon/issues/37) | Feature | Frontend | Dark-mode only; light mode with system preference detection broadens accessibility. |
| 13 | [#59 — Add pagination to whiskey endpoints](https://github.com/DamageLabs/whiskey-canon/issues/59) | Performance | Full-stack | `GET /api/whiskeys` returns all rows unbounded; critical for collections >100 bottles. |
| 14 | [#66 — Add API caching with ETags and TanStack Query](https://github.com/DamageLabs/whiskey-canon/issues/66) | Performance | Full-stack | Every page mount triggers a fresh fetch. Caching reduces server load and enables instant navigation. |
| 15 | [#69 — Add OpenAPI/Swagger API documentation](https://github.com/DamageLabs/whiskey-canon/issues/69) | Docs | Backend | 39 endpoints, documented only in README (~14) and CLAUDE.md (~5). Interactive docs at `/api/docs`. |

**Scope:** 7 issues. #36 and #67 are quick wins (< 1 day). #63 and #37 are frontend-only. #59 and #66 are full-stack performance work.

---

## Phase 3: Collection Feature Expansion

*Deepen the core collection management workflow with capabilities users expect from a mature collection tool.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 16 | [#60 — Add soft deletes](https://github.com/DamageLabs/whiskey-canon/issues/60) | Feature | Full-stack | Hard deletes are irreversible and cascade-destroy comments. `deleted_at` timestamp enables recovery. **Depends on #88.** |
| 17 | [#61 — Add bulk status change and selective export](https://github.com/DamageLabs/whiskey-canon/issues/61) | Feature | Full-stack | Bulk delete exists but no bulk update; status changes (consumed, sold) are common batch operations. |
| 18 | [#62 — Add whiskey image file upload](https://github.com/DamageLabs/whiskey-canon/issues/62) | Feature | Full-stack | Image fields are URL-only text inputs with no upload or display. Multer already installed for profile photos. |
| 19 | [#74 — Add side-by-side whiskey comparison](https://github.com/DamageLabs/whiskey-canon/issues/74) | Feature | Frontend | Leverages existing multi-select checkboxes and Recharts. High-value UX with no backend changes. |
| 20 | [#73 — Add collection sharing via tokenized links](https://github.com/DamageLabs/whiskey-canon/issues/73) | Feature | Full-stack | Read-only share links with configurable filters and expiry; builds on public profile system. |
| 21 | [#100 — Add AI-powered whiskey field auto-completion (BYOK)](https://github.com/DamageLabs/whiskey-canon/issues/100) | Feature | Full-stack | Users provide their own Anthropic API key; typing a whiskey name auto-populates ~20 fields via Claude Haiku. Complements #63 (Quick Add) and #65 (barcode scanning). **Depends on #88.** |

**Scope:** 6 issues. #60 and #100 require the migration runner from Phase 1. #74 is frontend-only and can be done anytime.

**Dependencies:**
```
#88 (migration runner, Phase 1) → #60 (soft deletes), #100 (AI lookup — new anthropic_api_key column)
```

---

## Phase 4: Advanced Features

*Expand beyond collection tracking into tasting, investment analysis, discovery, and data portability.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 22 | [#72 — Add tasting journal](https://github.com/DamageLabs/whiskey-canon/issues/72) | Feature | Full-stack | Tasting sessions as first-class entities with timeline and multi-bottle logs. New `tasting_sessions` table. **Depends on #88.** |
| 23 | [#75 — Add price history tracking](https://github.com/DamageLabs/whiskey-canon/issues/75) | Feature | Full-stack | Time-series `price_history` table with LineChart/AreaChart visualizations. Enables trend analysis. **Depends on #88.** |
| 24 | [#71 — Add wishlist with price drop alerts](https://github.com/DamageLabs/whiskey-canon/issues/71) | Feature | Full-stack | "Want list" alongside collection with email alerts via Resend. New `wishlist` table. **Depends on #88, benefits from #75.** |
| 25 | [#65 — Add barcode scanning](https://github.com/DamageLabs/whiskey-canon/issues/65) | Feature | Full-stack | Camera-based UPC/EAN scanning to auto-populate bottle details from external databases. Complements #100 (AI lookup). |
| 26 | [#68 — Document PostgreSQL migration path](https://github.com/DamageLabs/whiskey-canon/issues/68) | Docs | Backend | 193 synchronous better-sqlite3 calls across 15+ files. Database abstraction layer design and migration guide. |

**Scope:** 5 issues. #72, #75, and #71 each require new database tables and depend on the Phase 1 migration runner. #65 is independent but benefits from #76 (native camera).

**Dependencies:**
```
#88 (migration runner, Phase 1) → #72 (tasting journal), #75 (price history), #71 (wishlist)
#75 (price history) → #71 (wishlist price alerts — meaningful threshold detection)
```

---

## Phase 5: Discord Bot Integration

*Add a Discord bot for interacting with collections via slash commands. See [`Discord.md`](Discord.md) for full architecture.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 27 | [#80 — Add API key authentication](https://github.com/DamageLabs/whiskey-canon/issues/80) | Feature | Backend | Adds `x-api-key` header auth alongside session auth. Foundation for all external integrations. **Depends on #88.** |
| 28 | [#81 — Add Discord bot workspace with account linking](https://github.com/DamageLabs/whiskey-canon/issues/81) | Feature | Bot | Scaffold `bot/` workspace with discord.js v14, `/link` and `/unlink` commands. **Depends on #80.** |
| 29 | [#85 — Add API key management UI to Profile page](https://github.com/DamageLabs/whiskey-canon/issues/85) | Feature | Frontend | Generate, view, and revoke API keys from the web UI. **Depends on #80.** |
| 30 | [#82 — Add /collection and /profile commands](https://github.com/DamageLabs/whiskey-canon/issues/82) | Feature | Bot | First useful commands with rich embed formatting utilities. **Depends on #81.** |
| 31 | [#83 — Add /search and /top commands](https://github.com/DamageLabs/whiskey-canon/issues/83) | Feature | Bot | Search collection and view top-rated bottles. **Depends on #82.** |
| 32 | [#84 — Add /investment, /random, and /drink commands](https://github.com/DamageLabs/whiskey-canon/issues/84) | Feature | Bot | Investment portfolio, random bottle picker, drink suggestion. **Depends on #82.** Can run in parallel with #83. |

**Scope:** 6 issues. Linear dependency chain from #80 → #81 → #82 → #83/#84. #85 can be built in parallel with #81. #83 and #84 can be built in parallel after #82.

**Dependencies:**
```
#88 (migration runner, Phase 1) → #80 (API key auth — new api_keys table)
#80 → #81 (bot workspace) → #82 (collection/profile) → #83 (search/top) + #84 (investment/random/drink)
#80 → #85 (API key UI, parallel with #81)
```

---

## Phase 6: Platform Expansion

*Transform Whiskey Canon from a web app into a multi-platform product.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 33 | [#64 — Add PWA support with offline browsing](https://github.com/DamageLabs/whiskey-canon/issues/64) | Feature | Frontend | Service worker, manifest, offline caching. Foundation for mobile experience. |
| 34 | [#76 — Add native mobile app with Capacitor](https://github.com/DamageLabs/whiskey-canon/issues/76) | Feature | Frontend | Native iOS/Android shell wrapping the web app. Enables camera (#65), push notifications (#71), biometric login. **Depends on #64.** |

**Scope:** 2 issues, but each is large and multi-phase. #76 benefits from a stable, feature-complete core.

**Dependencies:**
```
#64 (PWA) → #76 (Capacitor mobile)
#62 (image upload) + #65 (barcode scanning) → #76 (native camera access)
```

---

## Full Dependency Graph

All cross-phase dependency chains:

```
Phase 1:
  #101 (Prisma evaluation) ──→ decides: adopt Prisma (supersedes #88) or proceed with #88
  #88 or Prisma ────────────┬──→ #60 (soft deletes, Phase 3)
                            ├──→ #100 (AI whiskey lookup, Phase 3)
                            ├──→ #72 (tasting journal, Phase 4)
                            ├──→ #75 (price history, Phase 4) → #71 (wishlist, Phase 4)
                            └──→ #80 (API key auth, Phase 5) → #81 (bot) → #82 → #83 + #84
  #54 (test infra) → #53 (backend tests)
  #70 (shared types) → #58 (Zod schemas)
  #101 (if adopted) ──→ accelerates #70 (generated types) + #58 (zod-prisma-types)

Phase 3:
  #100 (AI lookup) ←→ #65 (barcode scanning, Phase 4) — complementary features

Phase 5:
  #80 → #85 (API key UI, parallel with #81)

Phase 6:
  #64 (PWA) → #76 (Capacitor)
  #62 (image upload, Phase 3) + #65 (barcode, Phase 4) → #76 (native camera)
```

---

## Open Issues Summary

| Category | Count | Issues |
|----------|-------|--------|
| Infrastructure / DX | 4 | #50, #70, #88, #101 |
| Testing | 3 | #53, #54, #55 |
| Security | 2 | #48, #58 |
| Performance | 3 | #59, #66, #67 |
| UX / Theming | 3 | #36, #37, #63 |
| Core Features | 6 | #60, #61, #62, #73, #74, #100 |
| Advanced Features | 5 | #65, #68, #71, #72, #75 |
| Documentation | 2 | #68, #69 |
| Platform | 2 | #64, #76 |
| Discord Bot | 6 | #80, #81, #82, #83, #84, #85 |

**Total open issues: 35** (down from 42; 9 closed, 2 new since last update)

> Note: Some issues span multiple categories; each is counted once under its primary category.

---

## Quick Wins

Issues that deliver visible value with minimal effort (< 1 day each):

| Issue | Phase | Effort | Impact |
|-------|-------|--------|--------|
| [#36 — Table row contrast](https://github.com/DamageLabs/whiskey-canon/issues/36) | 2 | ~30 min | Medium (readability, WCAG compliance) |
| [#67 — Bundle analysis + lazy loading](https://github.com/DamageLabs/whiskey-canon/issues/67) | 2 | ~2 hours | High (780KB → split bundles) |
| [#63 — Quick Add mode](https://github.com/DamageLabs/whiskey-canon/issues/63) | 2 | ~3 hours | High (reduces friction for most common action) |
