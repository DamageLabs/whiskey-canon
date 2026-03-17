# Whiskey Canon — Production Deployment Guide

This guide covers deploying Whiskey Canon on the DamageLabs GCP VM.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Deploy Application](#deploy-application)
4. [Configure Environment](#configure-environment)
5. [Database Setup](#database-setup)
6. [systemd Service](#systemd-service)
7. [Nginx Configuration](#nginx-configuration)
8. [SSL with Let's Encrypt](#ssl-with-lets-encrypt)
9. [Maintenance](#maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GCP VM running Ubuntu 24.04 LTS
- Node.js installed at `/usr/local/bin/node`
- Nginx installed and running
- Git installed
- Domain DNS pointing to the VM's external IP

## Production Details

| Setting | Value |
|---------|-------|
| Domain | whiskey-canon.com |
| Port | 3001 |
| Directory | `/var/www/whiskey-canon.com` |
| User | `fusion94` |
| Process Manager | systemd (`whiskey-canon.service`) |
| Database | SQLite (`backend/whiskey.db`) |
| Node Binary | `/usr/local/bin/node` |

---

## Server Setup

### Connect to the VM

```bash
gcloud compute ssh damagelabs-prod --zone=us-central1-a
# or via Tailscale
ssh fusion94@<tailscale-ip>
```

### Install Dependencies (if fresh server)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git build-essential sqlite3 certbot python3-certbot-nginx
```

---

## Deploy Application

### Initial Deploy

```bash
cd /var/www
sudo git clone https://github.com/DamageLabs/whiskey-canon.git whiskey-canon.com
sudo chown -R fusion94:fusion94 whiskey-canon.com
cd whiskey-canon.com

# Install all workspace dependencies
npm install

# Build backend
npm run build --workspace=backend

# Build frontend
npm run build --workspace=frontend
```

### Update Deploy

```bash
cd /var/www/whiskey-canon.com
git pull origin main
npm install
npm run build --workspace=backend
npm run build --workspace=frontend
sudo systemctl restart whiskey-canon
```

---

## Configure Environment

```bash
cat > /var/www/whiskey-canon.com/backend/.env << 'EOF'
# Server Configuration
PORT=3001
VITE_USER_NODE_ENV=production
FRONTEND_URL=https://whiskey-canon.com

# Secrets (generate unique values)
SESSION_SECRET=<run: openssl rand -base64 32>
API_KEY_ENCRYPTION_SECRET=<run: openssl rand -base64 32>

# Database
DATABASE_PATH=/var/www/whiskey-canon.com/backend/whiskey.db

# Email (optional)
RESEND_API_KEY=<your-key>
RESEND_FROM_EMAIL=noreply@whiskey-canon.com
CONTACT_EMAIL=noreply@whiskey-canon.com
EOF

chmod 600 /var/www/whiskey-canon.com/backend/.env
```

**Generate secrets:**
```bash
openssl rand -base64 32  # → SESSION_SECRET
openssl rand -base64 32  # → API_KEY_ENCRYPTION_SECRET
```

---

## Database Setup

```bash
# Run migrations
npm run db:migrate --workspace=backend

# Seed data (optional)
npm run db:seed --workspace=backend
npm run db:seed:scotch --workspace=backend
npm run db:seed:irish --workspace=backend
npm run db:seed:users --workspace=backend
```

---

## systemd Service

### Create the Service

```bash
sudo tee /etc/systemd/system/whiskey-canon.service > /dev/null << 'EOF'
[Unit]
Description=Whiskey Canon (whiskey-canon.com)
After=network.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
User=fusion94
Group=fusion94
WorkingDirectory=/var/www/whiskey-canon.com/backend
ExecStart=/usr/local/bin/node dist/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=HOST=127.0.0.1

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable whiskey-canon
sudo systemctl start whiskey-canon
```

### Common Commands

```bash
sudo systemctl status whiskey-canon      # Check status
sudo systemctl restart whiskey-canon     # Restart
sudo systemctl stop whiskey-canon        # Stop
sudo journalctl -u whiskey-canon -f      # Follow logs
sudo journalctl -u whiskey-canon -n 50   # Last 50 lines
```

---

## Nginx Configuration

The Nginx config is version-controlled in `DamageLabs/brain` at `infra/nginx/sites-available/whiskey-canon`.

```bash
sudo nano /etc/nginx/sites-available/whiskey-canon
```

Key points:
- Frontend static files served from `/var/www/whiskey-canon.com/frontend/dist`
- API requests proxied to `localhost:3001`
- Upload requests proxied to `localhost:3001`
- Max upload size: 10M
- Shared snippets: `security-headers.conf`, `static-cache.conf`

```bash
sudo ln -sf /etc/nginx/sites-available/whiskey-canon /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## SSL with Let's Encrypt

```bash
sudo certbot --nginx -d whiskey-canon.com -d www.whiskey-canon.com \
  --non-interactive --agree-tos -m fusion94@gmail.com
```

Auto-renewal is configured automatically. Test with:
```bash
sudo certbot renew --dry-run
```

---

## Maintenance

### Database Backup

```bash
# Manual backup
cp /var/www/whiskey-canon.com/backend/whiskey.db ~/backups/whiskey-$(date +%Y%m%d-%H%M%S).db

# Automated daily backup (add to crontab)
0 2 * * * cp /var/www/whiskey-canon.com/backend/whiskey.db /home/fusion94/backups/whiskey-$(date +\%Y\%m\%d).db
```

### Database Optimization

```bash
sqlite3 /var/www/whiskey-canon.com/backend/whiskey.db "VACUUM;"
sqlite3 /var/www/whiskey-canon.com/backend/whiskey.db "ANALYZE;"
```

### View Logs

```bash
# Application logs
sudo journalctl -u whiskey-canon -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check the error
sudo journalctl -u whiskey-canon -n 30 --no-pager

# Try running manually
sudo -u fusion94 bash -c 'cd /var/www/whiskey-canon.com/backend && NODE_ENV=production PORT=3001 /usr/local/bin/node dist/index.js'
```

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Exit code 203 | Node binary not accessible | Verify `/usr/local/bin/node` exists and is executable |
| Exit code 1 | Missing env var | Check `.env` has all required vars (SESSION_SECRET, API_KEY_ENCRYPTION_SECRET) |
| Port conflict | Another process on 3001 | `sudo ss -tlnp \| grep :3001` to identify |
| 502 Bad Gateway | Service not running | `sudo systemctl start whiskey-canon` |
| StartLimitBurst | Too many rapid restarts | `sudo systemctl reset-failed whiskey-canon && sudo systemctl start whiskey-canon` |

### Check Port Usage

```bash
sudo ss -tlnp | grep :3001
```

### Check Nginx

```bash
sudo nginx -t
sudo systemctl status nginx
```

---

## Security Notes

- `.env` file should be `chmod 600` and owned by `fusion94`
- Use strong random values for `SESSION_SECRET` and `API_KEY_ENCRYPTION_SECRET`
- SSL certificates auto-renewed by Certbot
- Nginx security headers applied via shared snippet
- Node binds to `127.0.0.1` (localhost only) — Nginx handles external traffic

---

*Last updated: March 17, 2026*
