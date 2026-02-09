# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-02-09

### Added

- Per-user backup system with JSON and CSV export formats ([#89](https://github.com/DamageLabs/whiskey-canon/issues/89), [#77](https://github.com/DamageLabs/whiskey-canon/issues/77))
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

## [1.2.0] - 2026-02-05

### Added

- Public/private profile visibility toggle with collection stats on public profiles
- Public profile pages accessible at `/u/:username`
- Collection statistics on public profiles (total bottles, average rating, distilleries, countries, type breakdown)
- Comprehensive test coverage for profile visibility feature (78 new tests)

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

- Nginx reverse proxy configuration with Let's Encrypt SSL support
- `obtained_from` field to track who gifted a bottle
- Comments system for whiskeys with full CRUD operations
- Unit tests for comments and obtained_from field

### Fixed

- Session cookies for production behind Nginx reverse proxy
- WhiskeyModel.create() to insert all fields from seed data

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
- OnlyDrams CSV import support (PR #7)

### Changed

- Updated header and footer design
- Improved registration page styling

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
