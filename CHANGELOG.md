# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [1.0.0] - 2025-01-01

### Added

- Initial release of Whiskey Canon
- User authentication with session-based auth
- Whiskey collection management (CRUD operations)
- Dashboard with card and table views
- Analytics page with charts
- Admin panel for user management
- CSV import/export functionality
- Profile page with photo upload
- 57-field whiskey schema with comprehensive tracking
