# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Whiskey Canon, **please do not open a public issue**. Instead, report it privately so we can address it before it is disclosed.

**Email:** [security@whiskey-canon.com](mailto:security@whiskey-canon.com)

Please include:
- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Any relevant logs, screenshots, or proof-of-concept code.

We will acknowledge receipt within 48 hours and aim to provide a fix or mitigation plan within 7 days for critical issues.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest `main` branch | Yes |
| Older releases | No |

Whiskey Canon is under active development. Security patches are applied to the latest code on `main`.

## Security Hardening Guide

For deployment operators, see [docs/security-hardening.md](docs/security-hardening.md) for a comprehensive pre-deployment checklist covering environment configuration, network security, middleware settings, and monitoring.

## Scope

The following are in scope for security reports:
- Authentication and session management bypass
- Authorization flaws (accessing other users' data)
- SQL injection or other injection attacks
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Sensitive data exposure
- Server-side request forgery (SSRF)

The following are out of scope:
- Denial of service (DoS) attacks
- Social engineering
- Vulnerabilities in third-party dependencies (report these upstream; we monitor via `npm audit`)
- Issues that require physical access to the server
