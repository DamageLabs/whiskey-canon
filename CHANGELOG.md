# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
