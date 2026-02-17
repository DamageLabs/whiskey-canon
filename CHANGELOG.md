# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-02-17

### Added

- "Total Bottles" stats card showing sum of all quantities across the collection
- `collectionTotals` field in `GET /api/whiskeys` and `GET /api/whiskeys/search` responses with collection-wide MSRP, secondary value, and bottle count
- `getCollectionTotals()` method on `WhiskeyModel` for efficient aggregate queries

### Changed

- "Total Whiskeys" stats card renamed to "Unique Whiskeys" to distinguish from total bottle count
- MSRP Value and Secondary Value stats cards now show collection-wide totals instead of only the current page

### Fixed

- Statistics endpoint financial queries now multiply by quantity for accurate totals (MSRP, secondary, purchase price, market value)

## [1.8.0] - 2026-02-16

### Added

- Offset-based pagination for whiskey list endpoints with `page` and `limit` query parameters ([#59](https://github.com/DamageLabs/whiskey-canon/issues/59))
- Pagination controls on DashboardPage with page size selector (10/25/50/100) and page navigation
- `PaginationMeta` response metadata (`page`, `limit`, `total`, `totalPages`) on `GET /api/whiskeys`, `GET /api/whiskeys/search`, and `GET /api/admin/whiskeys`
- Database index on `whiskeys.created_at` for efficient paginated queries (migration 018)
- 10 new backend tests for pagination across models and routes

### Fixed

- `@eslint/js` peer dependency conflict with eslint 9.x causing CI failures
- Backup schedule interval validation test using a now-valid value (`hourly`)

### Issues Resolved

- [#59](https://github.com/DamageLabs/whiskey-canon/issues/59) — Add pagination to whiskey list endpoints

## [1.7.0] - 2026-02-14

### Added

- AI-powered whiskey field auto-completion via label photo scan or text lookup ([#100](https://github.com/DamageLabs/whiskey-canon/issues/100))
- Bring Your Own Key (BYOK) support for Anthropic Claude and OpenAI APIs ([#126](https://github.com/DamageLabs/whiskey-canon/issues/126))
- Ollama local AI provider for fully offline whiskey lookups with no API key required ([#128](https://github.com/DamageLabs/whiskey-canon/issues/128))
- Provider selection UI on Profile page (Anthropic / OpenAI / Ollama) with per-provider API key management
- Ollama status indicator showing connection state and available models
- `OLLAMA_BASE_URL`, `OLLAMA_TEXT_MODEL`, and `OLLAMA_VISION_MODEL` environment variables for Ollama configuration
- 18 new backend tests for Ollama lookup service and route dispatch
- 4 new frontend tests for Ollama provider UI and status display

### Fixed

- Admin backup restore handling schema mismatches between backup and current database ([#125](https://github.com/DamageLabs/whiskey-canon/issues/125))

### Issues Resolved

- [#100](https://github.com/DamageLabs/whiskey-canon/issues/100) — Add AI-powered whiskey field auto-completion
- [#125](https://github.com/DamageLabs/whiskey-canon/issues/125) — Handle schema mismatches in admin backup restore
- [#126](https://github.com/DamageLabs/whiskey-canon/issues/126) — Add OpenAI API support for AI whiskey lookup (BYOK)
- [#128](https://github.com/DamageLabs/whiskey-canon/issues/128) — Add Ollama as local AI provider for whiskey lookup

## [1.6.0] - 2026-02-09

### Added

- Per-user backup system with JSON and CSV export formats ([#89](https://github.com/DamageLabs/whiskey-canon/issues/89), [#77](https://github.com/DamageLabs/whiskey-canon/issues/77))
- JSON import/export for collection backup and cross-instance migration ([#35](https://github.com/DamageLabs/whiskey-canon/issues/35))
- Backup restore with dry-run preview and conflict resolution (skip/overwrite strategies)
- Scheduled automatic backups with configurable intervals (daily/weekly/monthly) via node-cron
- Admin full database backup using SQLite native `db.backup()` API
- Admin backup import with SQLite file validation and restore via `ATTACH DATABASE`
- BackupManager component on Profile page for per-user backup management
- Database Backup tab on Admin panel with create, import, restore, download, and delete
- CSRF token auto-retry on 403 to handle stale sessions after server restarts or restores
- 74 new backend tests: Backup model (13), BackupSchedule model (10), backup routes (31), admin backup routes (20)
- `BACKUP_DIR` and `BACKUP_MAX_SIZE_MB` environment variables
- Rate limiter for backup endpoints (5 requests per 15 minutes)

### Issues Resolved

- [#89](https://github.com/DamageLabs/whiskey-canon/issues/89) — Add scheduled automatic backups and on-demand manual backup/restore
- [#77](https://github.com/DamageLabs/whiskey-canon/issues/77) — Add JSON import/export for collection backup and cross-instance migration
- [#35](https://github.com/DamageLabs/whiskey-canon/issues/35) — Add user data export functionality for personal records and GDPR compliance

## [1.5.0] - 2026-02-08

### Security

- **Milestone 1: Security & Stability — Complete.** All 8 issues resolved, establishing a hardened security baseline for the application.
- Add Helmet middleware with strict Content Security Policy and HSTS ([#46](https://github.com/DamageLabs/whiskey-canon/issues/46))
- Add express-rate-limit to auth, password reset, and contact endpoints ([#43](https://github.com/DamageLabs/whiskey-canon/issues/43))
- Add CSRF token validation via double-submit cookie pattern on all state-changing requests ([#45](https://github.com/DamageLabs/whiskey-canon/issues/45))
- Add express-validator to all routes that accept user input — params, body, and query fields ([#47](https://github.com/DamageLabs/whiskey-canon/issues/47))
- Enforce stronger password policy: 12+ characters, 3/4 character types, Have I Been Pwned breach check ([#52](https://github.com/DamageLabs/whiskey-canon/issues/52))
- Replace in-memory session store with persistent SQLite-backed store ([#44](https://github.com/DamageLabs/whiskey-canon/issues/44))
- Validate required environment variables (`SESSION_SECRET`, `FRONTEND_URL`) at startup in production ([#49](https://github.com/DamageLabs/whiskey-canon/issues/49))

### Added

- `SECURITY.md` with vulnerability disclosure policy and supported versions ([#51](https://github.com/DamageLabs/whiskey-canon/issues/51))
- `docs/security-hardening.md` with pre-deployment checklist, security architecture overview, environment variable reference, and known limitations ([#51](https://github.com/DamageLabs/whiskey-canon/issues/51))
- Shared `validate` middleware to eliminate repeated validation boilerplate across routes
- Security section in `CLAUDE.md` referencing the new security documentation

### Issues Resolved

- [#46](https://github.com/DamageLabs/whiskey-canon/issues/46) — Add Helmet middleware for HTTP security headers
- [#43](https://github.com/DamageLabs/whiskey-canon/issues/43) — Add express-rate-limit to auth endpoints
- [#45](https://github.com/DamageLabs/whiskey-canon/issues/45) — Add CSRF token validation for session-based authentication
- [#47](https://github.com/DamageLabs/whiskey-canon/issues/47) — Add express-validator to all routes that accept user input
- [#52](https://github.com/DamageLabs/whiskey-canon/issues/52) — Enforce stronger password policy with minimum complexity requirements
- [#44](https://github.com/DamageLabs/whiskey-canon/issues/44) — Replace in-memory session store with persistent store
- [#49](https://github.com/DamageLabs/whiskey-canon/issues/49) — Validate required environment variables at startup
- [#51](https://github.com/DamageLabs/whiskey-canon/issues/51) — Create security hardening checklist for deployment

## [1.4.0] - 2026-02-07

### Added

- Community page at `/community` listing all public user profiles with search/filter
- Profile cards with avatars, display names, collection stats (bottles, avg rating, distilleries)
- Community navigation links in landing page navbar and site footer
- Community seed script with two public-profile demo users (whiskey_wanderer, cask_hunter)
- Frontend tests for CommunityPage (17 new tests)
- Discord bot integration plan (Discord.md)
- Milestone 6 (Discord Bot Integration) added to development roadmap

### Fixed

- Footer tagline capitalization ("Track, Taste, and Treasure your Whiskey collection")

### Issues Resolved

- [#86](https://github.com/DamageLabs/whiskey-canon/issues/86) — Add public profiles directory page

## [1.3.0] - 2026-02-06

### Added

- Contact Us page with form submission at `/contact`
- Contact form email endpoint via Resend with rate limiting (5 per IP per 15 min)
- Input validation on contact form (name, email, subject, message) with express-validator
- Subject categories for contact form (General Inquiry, Bug Report, Feature Request, Account Issue, Other)
- Confirmation copy sent to the sender's email alongside the site contact address
- Backend and frontend unit tests for contact form (295 new test lines)
- Beta environment setup documentation
- Prioritized development roadmap covering all open issues (ROADMAP.md)

### Issues Resolved

- [#40](https://github.com/DamageLabs/whiskey-canon/issues/40) — Wire up Contact Us form with Resend email

## [1.2.0] - 2026-02-05

### Added

- Public/private profile visibility toggle with collection stats on public profiles
- Public profile pages accessible at `/u/:username`
- Collection statistics on public profiles (total bottles, average rating, distilleries, countries, type breakdown)
- Comprehensive test coverage for profile visibility feature (78 new tests)

### Issues Resolved

- [#34](https://github.com/DamageLabs/whiskey-canon/issues/34) — Add public/private visibility toggle for user profiles

## [1.1.0] - 2026-02-05

### Added

- Client-side filtering system for whiskey collections with support for type, distillery, region, and country dropdowns
- Tri-state toggle filters for limited edition, chill filtered, natural color, and opened status
- Range filters for age, ABV, rating, and price
- FilterPanel component with collapsible UI and filter count badge
- "Danger Zone" section on Profile page with Clear Collection functionality
- Comprehensive test coverage for FilterPanel (57 tests) and ProfilePage Clear Collection (20 tests)
- Currency formatting utilities (format.ts)
- Vitest setup for jest-dom matchers

### Changed

- Moved Clear Collection button from Dashboard to Profile page for safer access to destructive actions
- Simplified Dashboard bulk actions to only show when items are selected
- Statistics now update based on filtered results

## [1.0.5] - 2026-02-04

### Added

- Proof field to whiskey UI components (WhiskeyForm, WhiskeyCard, WhiskeyTable, WhiskeyDetailModal)
- Accounting format for currency display with parentheses for negative values
- Bulk delete functionality for whiskey collection
- Tests for auth, admin, and comments routes
- Tests for User model and whiskey route error handling
- Tests for profile photo upload and delete routes
- Codecov coverage badge to README
- GitHub Actions test status badge to README

### Changed

- Use secondary market prices in collection value calculations

## [1.0.4] - 2026-02-03

### Added

- Nginx reverse proxy configuration with Let's Encrypt SSL support ([#1](https://github.com/DamageLabs/whiskey-canon/issues/1))
- `obtained_from` field to track who gifted a bottle
- Comments system for whiskeys with full CRUD operations
- Unit tests for comments and obtained_from field

### Fixed

- Session cookies for production behind Nginx reverse proxy
- WhiskeyModel.create() to insert all fields from seed data

### Issues Resolved

- [#1](https://github.com/DamageLabs/whiskey-canon/issues/1) — Add SSL/TLS Support for HTTPS Connection

## [1.0.3] - 2026-02-02

### Added

- Email verification system with 6-digit codes
- Password reset functionality via email
- Integration with Resend email service
- Git workflow rules to CLAUDE.md documentation

## [1.0.2] - 2026-02-01

### Added

- GitHub Actions workflow for automated testing
- Vitest test infrastructure for backend
- Comprehensive test coverage for User model
- Tests for Admin and Statistics routes
- Tests for RBAC (Role-Based Access Control)
- Tests for CSV import/export functionality
- Whiskey model tests with 100% coverage
- Whiskey routes integration tests
- Auth middleware and routes tests

### Fixed

- TypeScript compilation errors caught by CI
- GitHub Actions test-summary job conditional syntax

### Changed

- Improved table row contrast on dashboard for better readability

## [1.0.1] - 2026-01-25

### Added

- New dark UI theme with amber accents
- Landing page outlining site features
- OnlyDrams CSV import support ([#6](https://github.com/DamageLabs/whiskey-canon/issues/6))

### Changed

- Updated header and footer design
- Improved registration page styling

### Issues Resolved

- [#6](https://github.com/DamageLabs/whiskey-canon/issues/6) — OnlyDrams Import

## [1.0.0] - 2026-01-20

### Added

- Initial release of Whiskey Canon
- User authentication with session-based auth and RBAC (admin/editor/viewer roles)
- Whiskey collection management with full CRUD operations
- Dashboard with card and table view modes
- Analytics page with Recharts visualizations
- Admin panel for user management
- CSV import/export functionality
- Profile page with photo upload
- 57-field whiskey schema including:
  - Basic info (name, type, distillery, region, age, ABV)
  - Purchase tracking (date, price, location)
  - Inventory management (opened status, remaining volume, storage location)
  - Cask details (type, finish, barrel/bottle numbers)
  - Tasting notes (nose, palate, finish, color)
  - Investment tracking (market value, gain/loss)
  - Production details (limited edition, chill filtered, natural color)
- Demo seed data with 6 users and 170 whiskeys
- WhiskeyStats component with collection statistics
- EnhancedStats component with detailed analytics
