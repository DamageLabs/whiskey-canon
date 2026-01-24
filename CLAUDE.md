# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whiskey Canon is a full-stack TypeScript web application for whiskey collection management. It uses npm workspaces to manage a monorepo with separate backend and frontend packages.

- **Backend**: Express.js + SQLite (port 3000)
- **Frontend**: React 18 + Vite + Bootstrap 5 (port 5173)
- **Database**: SQLite with 57-field whiskey schema

## Common Commands

```bash
# Development (runs both backend and frontend concurrently)
npm run dev

# Individual services
npm run dev:backend          # Backend only with hot reload
npm run dev:frontend         # Frontend only with Vite

# Build
npm run build                # Build both workspaces

# Database seeding
npm run db:migrate           # Initialize schema
npm run seed:demo            # Recommended: 6 demo users with 170 whiskeys
npm run db:seed              # Bourbon data only
npm run db:seed:scotch       # Scotch data only
npm run db:seed:users        # 4 basic test users

# Database maintenance
npm run db:update-secondary  # Update secondary market pricing
npm run db:add-indexes       # Add performance indexes
```

## Architecture

### Backend (`backend/`)
- `src/index.ts` - Express server, middleware, route registration
- `src/routes/` - API endpoints (auth, whiskeys, admin, statistics)
- `src/middleware/` - Auth middleware with RBAC (admin/editor/viewer roles)
- `src/models/` - User and Whiskey models with CRUD operations
- `src/utils/database.ts` - Schema initialization and migrations

### Frontend (`frontend/`)
- `src/App.tsx` - React Router setup with protected routes
- `src/pages/` - Page components (Dashboard, Analytics, Admin, Profile, etc.)
- `src/components/` - Reusable components including WhiskeyForm (7-tab form), analytics charts
- `src/context/AuthContext.tsx` - Authentication state management
- `src/services/api.ts` - API client for backend communication

### Key Architectural Decisions
- Session-based authentication (not JWT), stored with express-session
- User isolation: users only see/modify their own whiskeys
- Context API for state management (not Redux)
- Recharts for data visualization (10+ chart types)
- Bootstrap 5 with whiskey-themed blue (#5B9BD5)

## Test Users

After running `npm run seed:demo`:
- `bourbon_lover`, `scotch_fan`, `curator`, `beginner`, `investor`, `admin` (password: `demo123`)

After running `npm run db:seed:users`:
- `alice_admin`, `bob_editor`, `charlie_viewer`, `diana_editor` (password: `password123`)

## API Endpoints

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Whiskeys: `GET/POST /api/whiskeys`, `GET/PUT/DELETE /api/whiskeys/:id`
- Statistics: `GET /api/whiskeys/statistics/collection`, `GET /api/whiskeys/statistics/overview`
- Admin: `GET /api/admin/users`, `PUT /api/admin/users/:id/role`
- Health: `GET /api/health`
