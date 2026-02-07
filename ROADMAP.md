# Whiskey Canon Roadmap

> Prioritized development roadmap covering all 38 open issues.
> Last updated: 2026-02-06

## How to Read This Roadmap

Issues are grouped into **5 milestones** ordered by priority. Within each milestone, issues are further sorted by implementation order — earlier items often unblock later ones.

**Priority rationale:**
- **Milestone 1** — Security and stability. These protect user data and fix foundational gaps that every other feature depends on.
- **Milestone 2** — Developer experience and infrastructure. These reduce friction for all future development.
- **Milestone 3** — Core feature enhancements. High-value improvements to the existing collection management workflow.
- **Milestone 4** — Advanced features. Net-new capabilities that expand the product beyond collection tracking.
- **Milestone 5** — Platform expansion. Large initiatives that depend on a stable, feature-rich core.

---

## Milestone 1: Security & Stability

*Protect user data, harden the server, and close security gaps before adding features.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 1 | [#46 — Add Helmet middleware for HTTP security headers](https://github.com/DamageLabs/whiskey-canon/issues/46) | Security | Backend | One-line middleware add; immediate protection against clickjacking, MIME sniffing, and XSS. |
| 2 | [#43 — Add express-rate-limit to auth endpoints](https://github.com/DamageLabs/whiskey-canon/issues/43) | Security | Backend | Prevents brute-force login attacks. Small, isolated change. |
| 3 | [#49 — Validate required environment variables at startup](https://github.com/DamageLabs/whiskey-canon/issues/49) | Security | Backend | Fail-fast on misconfiguration; prevents silent runtime errors with missing keys. |
| 4 | [#44 — Replace in-memory session store with persistent store](https://github.com/DamageLabs/whiskey-canon/issues/44) | Stability | Backend | In-memory sessions are lost on restart and leak memory in production. |
| 5 | [#52 — Enforce stronger password policy](https://github.com/DamageLabs/whiskey-canon/issues/52) | Security | Full-stack | Weak passwords are the #1 account compromise vector. |
| 6 | [#45 — Add CSRF token validation](https://github.com/DamageLabs/whiskey-canon/issues/45) | Security | Full-stack | Session-based auth without CSRF tokens is vulnerable to cross-site request forgery. |
| 7 | [#47 — Add express-validator to all routes](https://github.com/DamageLabs/whiskey-canon/issues/47) | Security | Backend | Many routes accept user input without validation; prevents injection and malformed data. |
| 8 | [#51 — Create security hardening checklist](https://github.com/DamageLabs/whiskey-canon/issues/51) | Docs | Backend | Documents the security posture after the above items are complete; guides deployment. |

**Estimated scope:** 8 issues, primarily backend, mostly small-to-medium changes.

---

## Milestone 2: Developer Experience & Infrastructure

*Improve the development workflow, test confidence, and codebase health so that feature work is faster and safer.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 9 | [#56 — Add ESLint and Prettier to CI](https://github.com/DamageLabs/whiskey-canon/issues/56) | Chore | Full-stack | Enforces consistent code style; catches bugs early. Foundation for all future PRs. |
| 10 | [#54 — Improve integration test infrastructure](https://github.com/DamageLabs/whiskey-canon/issues/54) | Testing | Backend | Isolated test database lifecycle; unblocks reliable test coverage expansion. |
| 11 | [#53 — Expand backend test coverage](https://github.com/DamageLabs/whiskey-canon/issues/53) | Testing | Backend | Auth flows, CRUD, and admin endpoints need coverage before refactors. Depends on #54. |
| 12 | [#55 — Add React Testing Library tests](https://github.com/DamageLabs/whiskey-canon/issues/55) | Testing | Frontend | Critical frontend flows (login, dashboard, form) need test coverage. |
| 13 | [#48 — Add npm audit to CI](https://github.com/DamageLabs/whiskey-canon/issues/48) | Chore | Full-stack | Catches known vulnerabilities in dependencies automatically. |
| 14 | [#57 — Adopt versioned migration system](https://github.com/DamageLabs/whiskey-canon/issues/57) | Refactor | Backend | Current ad-hoc ALTER TABLE blocks don't track state. Required before adding new tables (#60, #72, #75). |
| 15 | [#50 — Add structured logging with request IDs](https://github.com/DamageLabs/whiskey-canon/issues/50) | Enhancement | Backend | Traceability for debugging production issues. |
| 16 | [#70 — Extract shared types into workspace package](https://github.com/DamageLabs/whiskey-canon/issues/70) | Refactor | Full-stack | Eliminates type duplication between frontend/backend; fixes known mismatches (Role enum, PublicProfile). |
| 17 | [#58 — Add Zod schemas for whiskey validation](https://github.com/DamageLabs/whiskey-canon/issues/58) | Enhancement | Full-stack | Shared validation schemas replace ad-hoc checks. Builds on #70 shared types. |
| 18 | [#69 — Add OpenAPI/Swagger API documentation](https://github.com/DamageLabs/whiskey-canon/issues/69) | Docs | Backend | Self-documenting API; reduces onboarding friction and enables client generation. |
| 19 | [#67 — Bundle analysis and lazy-load routes](https://github.com/DamageLabs/whiskey-canon/issues/67) | Performance | Frontend | Single 780KB bundle; lazy loading cuts initial load time significantly. |

**Estimated scope:** 11 issues. Mix of tooling, testing, refactoring, and documentation.

---

## Milestone 3: Core Collection Enhancements

*Improve the day-to-day collection management experience with high-impact, moderate-effort features.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 20 | [#36 — Improve table row contrast](https://github.com/DamageLabs/whiskey-canon/issues/36) | UX | Frontend | Quick visual fix; improves readability for the primary view every user sees. |
| 21 | [#59 — Add pagination to whiskey endpoints](https://github.com/DamageLabs/whiskey-canon/issues/59) | Performance | Full-stack | GET /api/whiskeys returns all rows unbounded; critical for collections >100 bottles. |
| 22 | [#63 — Add Quick Add mode](https://github.com/DamageLabs/whiskey-canon/issues/63) | Feature | Frontend | The 7-tab, 57-field form is intimidating; a compact 3-field quick-add reduces friction for casual entries. |
| 23 | [#60 — Add soft deletes](https://github.com/DamageLabs/whiskey-canon/issues/60) | Feature | Full-stack | Hard deletes are irreversible and cascade-destroy comments. Soft deletes enable recovery. Depends on #57 for clean migration. |
| 24 | [#61 — Add bulk status change and selective export](https://github.com/DamageLabs/whiskey-canon/issues/61) | Feature | Full-stack | Bulk delete exists but no bulk update; status changes (consumed, sold) are common batch operations. |
| 25 | [#62 — Add whiskey image file upload](https://github.com/DamageLabs/whiskey-canon/issues/62) | Feature | Full-stack | Image fields are URL-only text inputs; multer is already installed for profile photos. Bug: image fields missing from INSERT. |
| 26 | [#74 — Add side-by-side whiskey comparison](https://github.com/DamageLabs/whiskey-canon/issues/74) | Feature | Frontend | Leverages existing multi-select checkboxes; high-value UX with no backend changes. |
| 27 | [#66 — Add API caching with ETags and TanStack Query](https://github.com/DamageLabs/whiskey-canon/issues/66) | Performance | Full-stack | Every page mount triggers a fresh fetch; caching reduces server load and improves perceived speed. |
| 28 | [#37 — Add light mode theme](https://github.com/DamageLabs/whiskey-canon/issues/37) | Feature | Frontend | Currently dark-mode only; light mode with system preference detection broadens accessibility. |
| 29 | [#35 — Add user data export (GDPR)](https://github.com/DamageLabs/whiskey-canon/issues/35) | Feature | Full-stack | GDPR data portability compliance; exports all user data (profile + collection + comments). |
| 30 | [#77 — Add JSON import/export for backup](https://github.com/DamageLabs/whiskey-canon/issues/77) | Feature | Full-stack | Lossless backup format with versioning; complements CSV and satisfies #35 portability needs. |

**Estimated scope:** 11 issues. Mix of quick wins (#36, #63) and medium features.

---

## Milestone 4: Advanced Features

*Expand beyond collection tracking into tasting, sharing, investment, and discovery.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 31 | [#72 — Add tasting journal](https://github.com/DamageLabs/whiskey-canon/issues/72) | Feature | Full-stack | Tasting sessions as first-class entities with multi-bottle logs, companions, and timeline. New tables required. |
| 32 | [#75 — Add price history tracking](https://github.com/DamageLabs/whiskey-canon/issues/75) | Feature | Full-stack | Time-series price storage; enables trend charts (first LineChart/AreaChart usage). New tables required. |
| 33 | [#71 — Add wishlist with price alerts](https://github.com/DamageLabs/whiskey-canon/issues/71) | Feature | Full-stack | Separate list for desired bottles with price drop notifications via Resend. New table required. |
| 34 | [#73 — Add collection sharing via tokenized links](https://github.com/DamageLabs/whiskey-canon/issues/73) | Feature | Full-stack | Read-only share links with configurable filters and expiry; builds on public profile system. |
| 35 | [#65 — Add barcode scanning](https://github.com/DamageLabs/whiskey-canon/issues/65) | Feature | Full-stack | Camera-based barcode scanning to auto-populate bottle details. |
| 36 | [#68 — Document PostgreSQL migration path](https://github.com/DamageLabs/whiskey-canon/issues/68) | Docs | Backend | Database abstraction layer and migration guide for scaling beyond SQLite. |

**Estimated scope:** 6 issues. Multiple new database tables; significant backend and frontend work per issue.

---

## Milestone 5: Platform Expansion

*Transform Whiskey Canon from a web app into a multi-platform product.*

| # | Issue | Type | Area | Rationale |
|---|-------|------|------|-----------|
| 37 | [#64 — Add PWA support with offline browsing](https://github.com/DamageLabs/whiskey-canon/issues/64) | Feature | Frontend | Service worker, manifest, offline caching. Foundation for mobile experience. Should precede #76. |
| 38 | [#76 — Add native mobile app with Capacitor](https://github.com/DamageLabs/whiskey-canon/issues/76) | Feature | Frontend | Native iOS/Android shell wrapping the web app. Depends on stable core (#64) and enables camera (#65), push notifications (#71). |

**Estimated scope:** 2 issues, but each is large and multi-phase.

---

## Dependency Graph

Key dependency chains that affect implementation order:

```
#54 (test infra) → #53 (backend tests) → #55 (frontend tests)
#57 (migration system) → #60 (soft deletes), #72 (tasting journal), #75 (price history), #71 (wishlist)
#70 (shared types) → #58 (Zod schemas)
#64 (PWA) → #76 (Capacitor mobile)
#75 (price history) → #71 (wishlist price alerts, meaningful threshold detection)
#62 (image upload) + #65 (barcode scanning) → #76 (native camera access)
```

## Issue Summary by Category

| Category | Count | Issues |
|----------|-------|--------|
| Security | 8 | #43, #45, #46, #47, #48, #49, #51, #52 |
| Testing | 3 | #53, #54, #55 |
| Infrastructure / DX | 5 | #50, #56, #57, #67, #70 |
| Performance | 3 | #59, #66, #67 |
| Core Features | 10 | #35, #36, #37, #60, #61, #62, #63, #74, #77, #58 |
| Advanced Features | 6 | #65, #68, #71, #72, #73, #75 |
| Documentation | 3 | #51, #68, #69 |
| Platform | 2 | #64, #76 |

> Note: Some issues span multiple categories; each is counted once under its primary category.

## Quick Wins

Issues that deliver visible value with minimal effort (< 1 day each):

| Issue | Effort | Impact |
|-------|--------|--------|
| [#46 — Helmet middleware](https://github.com/DamageLabs/whiskey-canon/issues/46) | ~30 min | High (security headers) |
| [#43 — Rate limiting](https://github.com/DamageLabs/whiskey-canon/issues/43) | ~1 hour | High (brute-force protection) |
| [#49 — Env validation](https://github.com/DamageLabs/whiskey-canon/issues/49) | ~1 hour | Medium (fail-fast startup) |
| [#36 — Table row contrast](https://github.com/DamageLabs/whiskey-canon/issues/36) | ~30 min | Medium (readability) |
| [#67 — Bundle analysis + lazy loading](https://github.com/DamageLabs/whiskey-canon/issues/67) | ~2 hours | High (780KB → split bundles) |
