# Security Hardening Guide

This document is the single source of truth for Whiskey Canon's security posture. It covers the pre-deployment checklist, security architecture, environment variable guidance, and known limitations.

## Pre-Deployment Checklist

Work through each section before exposing the application to production traffic.

### Environment & Secrets

- [ ] `SESSION_SECRET` is set to a cryptographically random string (min 64 chars).
      Generate one with: `openssl rand -base64 48`
- [ ] `NODE_ENV` is set to `production`
- [ ] `FRONTEND_URL` is set to the actual production domain (e.g., `https://whiskey-canon.com`), not `localhost`
- [ ] `RESEND_API_KEY` is set if email features (verification, password reset) are required
- [ ] `.env` file is **not** committed to version control (`.gitignore` covers this)
- [ ] Database file (`whiskey.db`) has restricted file permissions: `chmod 600 whiskey.db`
- [ ] Database file is located outside the web-accessible directory

### Network & Transport

- [ ] SSL/TLS is configured with a valid certificate (Let's Encrypt via `scripts/ssl-setup.sh` or equivalent)
- [ ] HTTP traffic on port 80 redirects to HTTPS (configured in `nginx/sites-available/whiskey-canon.prod.conf`)
- [ ] HSTS is enabled in Nginx (`Strict-Transport-Security` header in `nginx/snippets/security-headers.conf`)
- [ ] Nginx `ssl-params.conf` enforces TLS 1.2+ with modern cipher suites (no SSLv3, TLSv1, TLSv1.1)
- [ ] DH parameters are generated: `openssl dhparam -out /etc/nginx/dhparam.pem 2048`
- [ ] OCSP stapling is enabled (configured in `nginx/snippets/ssl-params.conf`)

### Application Middleware

All items below have been implemented. Verify they are active in your deployment:

- [ ] **Rate limiting** is enabled on auth endpoints — 10 requests/15 min for login/register, 3/15 min for password reset (#43)
- [ ] **Session store** uses persistent SQLite (not in-memory `MemoryStore`) with 15-min cleanup interval (#44)
- [ ] **CSRF protection** is enabled via double-submit cookie pattern on all non-GET methods (#45)
- [ ] **Helmet** middleware is configured with strict CSP and HSTS (#46)
- [ ] **Input validation** covers all routes via `express-validator` — params, body, and query (#47)
- [ ] **Environment validation** runs at startup and rejects missing required vars in production (#49)
- [ ] **Password policy** enforces 12+ chars, 3 of 4 character types, and checks against Have I Been Pwned (#52)

### Headers & CORS

- [ ] `Content-Security-Policy` restricts sources to `'self'` (styles allow `'unsafe-inline'` for Bootstrap)
- [ ] `X-Frame-Options` is set — Helmet sets `frame-ancestors: 'none'`; Nginx sets `SAMEORIGIN`
- [ ] `X-Content-Type-Options` is set to `nosniff` (Helmet + Nginx)
- [ ] `Referrer-Policy` is set to `strict-origin-when-cross-origin` (Nginx)
- [ ] `Permissions-Policy` restricts geolocation, microphone, camera (Nginx)
- [ ] CORS origin is set to the production domain only (via `FRONTEND_URL`), not `*`
- [ ] Session cookie flags: `secure: true`, `httpOnly: true`, `sameSite: 'strict'`
- [ ] CSRF cookie flags: `secure: true`, `sameSite: 'strict'` (httpOnly is `false` by design — JavaScript must read the token)

### Monitoring & Maintenance

- [ ] Error responses do not leak stack traces or internal details (automatic when `NODE_ENV=production`)
- [ ] Nginx access and error logs are configured (`/var/log/nginx/whiskey-canon.*.log`)
- [ ] Certbot auto-renewal is scheduled (daily at 3 AM via systemd timer or cron)
- [ ] Dependencies are kept up to date — run `npm audit` regularly

---

## Security Architecture

Whiskey Canon uses a layered defense model. Each layer provides independent protections.

### Nginx Layer (Reverse Proxy)

| Protection | Configuration |
|---|---|
| SSL/TLS termination | TLS 1.2+, modern ciphers, ECDHE key exchange |
| HSTS | 2-year max-age, includeSubDomains |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Rate limiting | 5 req/min on `/api/auth/login` (burst 3) |
| Hidden files | Blocked via `location ~ /\.` rule (except `.well-known`) |
| HTTP/2 | Enabled for performance |

### Express Layer (Application Server)

| Protection | Middleware | Configuration |
|---|---|---|
| HTTP headers | Helmet | Strict CSP, HSTS (production), X-Content-Type-Options |
| CORS | cors | Origin restricted to `FRONTEND_URL`, credentials allowed |
| CSRF | csrf-csrf | Double-submit cookie (`__csrf`), protects POST/PUT/DELETE/PATCH |
| Rate limiting | express-rate-limit | Per-route limits on auth, password reset, contact endpoints |
| Sessions | express-session + better-sqlite3-session-store | Persistent, httpOnly, secure, 7-day expiry |
| Input validation | express-validator | All route params, body fields, and query params validated |
| Environment validation | Custom config module | Required vars checked at startup; logs redact secrets |

### Application Layer (Business Logic)

| Protection | Implementation |
|---|---|
| Authentication | Session-based with bcrypt password hashing (12 salt rounds) |
| Authorization | RBAC with admin/editor/viewer roles via `requirePermission` middleware |
| User isolation | All whiskey queries scoped to `created_by = user.id` |
| Password policy | 12+ chars, 3/4 character types, Have I Been Pwned breach check |
| Email verification | Required before login; verification codes with expiry |
| Password reset | Time-limited tokens, rate-limited endpoint |

### Database Layer (SQLite)

| Protection | Implementation |
|---|---|
| SQL injection prevention | Parameterized queries via `better-sqlite3` prepared statements |
| File permissions | Database file should be `chmod 600` |
| Session cleanup | Expired sessions purged every 15 minutes |

---

## Environment Variable Reference

| Variable | Required | Default | Security Notes |
|---|---|---|---|
| `SESSION_SECRET` | **Production** | Random (dev) | Must be cryptographically random, min 64 chars. Generate with `openssl rand -base64 48`. Never reuse across environments. |
| `NODE_ENV` | No | `development` | Set to `production` to enable secure cookies, HSTS, and disable verbose error output. |
| `FRONTEND_URL` | **Production** | `http://localhost:5173` | Controls CORS origin and CSRF cookie scope. Must match the actual frontend domain. |
| `PORT` | No | `3000` | Server listen port. No security implications unless exposed directly (use Nginx). |
| `DATABASE_PATH` | No | `./whiskey.db` | Path to SQLite database file. Ensure it is not web-accessible and has `600` permissions. |
| `RESEND_API_KEY` | No | — | API key for Resend email service. Without it, email verification and password reset are disabled. Treat as a secret. |
| `RESEND_FROM_EMAIL` | No | `noreply@whiskey-canon.com` | Sender address for transactional emails. |
| `CONTACT_EMAIL` | No | `noreply@whiskey-canon.com` | Recipient for contact form submissions. |

---

## Known Limitations & Open Work

The following security improvements are tracked but not yet implemented:

| Issue | Description | Mitigation |
|---|---|---|
| [#48](https://github.com/DamageLabs/whiskey-canon/issues/48) | `npm audit` not yet integrated into CI | Run `npm audit` manually before deployments |
| [#50](https://github.com/DamageLabs/whiskey-canon/issues/50) | No structured logging with request IDs | Nginx access logs provide basic request tracing |

### Additional Considerations

- **Backup encryption**: SQLite database backups should be encrypted at rest if stored off-server.
- **Secret rotation**: `SESSION_SECRET` rotation will invalidate all active sessions. Plan rotation during low-traffic windows.
- **Admin account**: Change the default admin password immediately after initial deployment. Do not use seed data passwords in production.
- **File uploads**: Profile photo uploads are validated for file type (JPEG, PNG, GIF, WebP) and size (5 MB limit). Uploaded files are stored on disk — consider malware scanning for high-risk deployments.

---

## Completed Security Work

For reference, the following security issues have been resolved:

| Issue | Title | PR |
|---|---|---|
| [#43](https://github.com/DamageLabs/whiskey-canon/issues/43) | Rate limiting on auth endpoints | Merged |
| [#44](https://github.com/DamageLabs/whiskey-canon/issues/44) | Persistent session store | Merged |
| [#45](https://github.com/DamageLabs/whiskey-canon/issues/45) | CSRF token validation | Merged |
| [#46](https://github.com/DamageLabs/whiskey-canon/issues/46) | Helmet middleware | Merged |
| [#47](https://github.com/DamageLabs/whiskey-canon/issues/47) | Input validation on all routes | Merged |
| [#49](https://github.com/DamageLabs/whiskey-canon/issues/49) | Environment variable validation | Merged |
| [#52](https://github.com/DamageLabs/whiskey-canon/issues/52) | Stronger password policy | Merged |
