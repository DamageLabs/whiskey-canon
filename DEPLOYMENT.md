# Whiskey Canon - GCP Ubuntu Server Deployment Guide

This guide will walk you through deploying the Whiskey Canon application on an Ubuntu server in Google Cloud Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create GCP VM Instance](#create-gcp-vm-instance)
3. [Server Setup](#server-setup)
4. [Install Dependencies](#install-dependencies)
5. [Deploy Application](#deploy-application)
6. [Configure Database](#configure-database)
7. [Run Application](#run-application)
8. [Production Setup (Optional)](#production-setup-optional)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed on your local machine (optional, can use GCP Console)
- SSH client
- Domain name (optional, for custom domain setup)

---

## Create GCP VM Instance

### Option 1: Using GCP Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Compute Engine** > **VM Instances**
3. Click **Create Instance**
4. Configure the instance:
   - **Name**: `whiskey-canon-server` (or your preferred name)
   - **Region**: Choose closest to your users (e.g., `us-central1`)
   - **Zone**: Any available zone
   - **Machine type**: `e2-small` (1 vCPU, 2 GB memory) - sufficient for small-medium traffic
   - **Boot disk**:
     - Operating System: **Ubuntu**
     - Version: **Ubuntu 22.04 LTS**
     - Boot disk type: **Balanced persistent disk**
     - Size: **20 GB** (minimum)
   - **Firewall**:
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic
5. Click **Create**

### Option 2: Using gcloud CLI

```bash
gcloud compute instances create whiskey-canon-server \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-balanced \
  --tags=http-server,https-server
```

### Configure Firewall Rules

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server \
  --description="Allow HTTP traffic"

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server \
  --description="Allow HTTPS traffic"

# Allow custom port (if not using reverse proxy)
gcloud compute firewall-rules create allow-whiskey-canon \
  --allow tcp:3000,tcp:5173 \
  --target-tags http-server \
  --description="Allow Whiskey Canon application traffic"
```

---

## Server Setup

### 1. Connect to Your Instance

**Via GCP Console:**
- Go to VM Instances
- Click **SSH** next to your instance

**Via gcloud CLI:**
```bash
gcloud compute ssh whiskey-canon-server --zone=us-central1-a
```

**Via SSH (if you have external IP):**
```bash
ssh username@EXTERNAL_IP
```

### 2. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Install Dependencies

### 1. Install Node.js (via nvm - recommended)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

### 2. Install Git

```bash
sudo apt install git -y
git --version
```

### 3. Install Build Essentials

```bash
sudo apt install build-essential -y
```

### 4. Install SQLite3 (optional, for CLI access)

```bash
sudo apt install sqlite3 -y
sqlite3 --version
```

---

## Deploy Application

### 1. Clone Repository

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/YOUR_USERNAME/whiskey-canon.git
# OR upload your code via SCP/SFTP

cd whiskey-canon
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### 3. Build Application

```bash
# Build backend
npm run build --workspace=backend

# Build frontend
npm run build --workspace=frontend
```

### 4. Configure Environment

```bash
# Create environment file for backend
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_PATH=/home/$USER/apps/whiskey-canon/whiskey.db
SESSION_SECRET=$(openssl rand -base64 32)
EOF

# Create environment file for frontend
cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000
EOF
```

---

## Configure Database

### 1. Initialize Database

```bash
# Run database migration
npm run db:migrate --workspace=backend
```

### 2. Seed Initial Data (Optional)

```bash
# Seed bourbon data
npm run db:seed --workspace=backend

# Seed scotch data
npm run db:seed:scotch --workspace=backend

# Seed Irish whiskey data
npm run db:seed:irish --workspace=backend

# Update MSRP prices
npm run db:update-msrp --workspace=backend

# Update secondary prices
npm run db:update-secondary --workspace=backend

# Update quantities
npm run db:update-quantity --workspace=backend

# Update remaining prices
npm run db:update-remaining --workspace=backend

# Create test users
npm run db:seed:users --workspace=backend
```

### 3. Create Admin User (Manual Method)

```bash
# Access SQLite database
sqlite3 whiskey.db

# Create admin user (replace with your details)
-- Note: This password hash is for "admin123" - CHANGE IT!
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@example.com', '$2a$10$rOzJv3xH.YqKLPX8Lk9zKOqGxQYQYGZvZ0xNZ8KxGZvZ0xNZ8KxGZ', 'admin');

-- Exit SQLite
.quit
```

**To generate a proper password hash:**

```bash
# Create a quick Node script
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

---

## Run Application

### Option 1: Development Mode (Testing)

```bash
# In one terminal, run backend
cd ~/apps/whiskey-canon
npm run dev --workspace=backend

# In another terminal, run frontend
npm run dev --workspace=frontend
```

### Option 2: Production Mode with PM2

#### Install PM2

```bash
npm install -g pm2
```

#### Create PM2 Ecosystem File

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'whiskey-canon-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
EOF
```

#### Start Application with PM2

```bash
# Start the backend
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd

# View logs
pm2 logs whiskey-canon-backend

# Check status
pm2 status
```

### Option 3: Serve Frontend with Simple HTTP Server

```bash
# Install serve globally
npm install -g serve

# Serve the built frontend
cd ~/apps/whiskey-canon/frontend
pm2 start "serve -s dist -l 5173" --name whiskey-canon-frontend

# Save configuration
pm2 save
```

---

## Production Setup (Optional)

### Quick Setup with Automated Scripts (Recommended)

The project includes automated scripts for Nginx and SSL setup:

```bash
# 1. Setup Nginx (installs nginx, copies snippets, generates DH params)
sudo ./scripts/nginx-setup.sh

# 2. Obtain SSL certificate (test with --staging first)
sudo ./scripts/ssl-setup.sh -d yourdomain.com -e admin@yourdomain.com --staging  # Test
sudo ./scripts/ssl-setup.sh -d yourdomain.com -e admin@yourdomain.com            # Production

# 3. Deploy production configuration
sudo ./scripts/deploy-prod.sh -d yourdomain.com -u $USER
```

For development with Nginx (optional):
```bash
sudo ./scripts/nginx-setup.sh
sudo ./scripts/deploy-dev.sh
echo "127.0.0.1 whiskey-canon.local" | sudo tee -a /etc/hosts
npm run dev
# Access at http://whiskey-canon.local
```

### Manual Nginx Setup (Alternative)

If you prefer manual configuration:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/whiskey-canon
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;  # Replace with your domain or server IP

    # Frontend - serve static files
    location / {
        root /home/YOUR_USERNAME/apps/whiskey-canon/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase max upload size (for future image uploads)
    client_max_body_size 10M;
}
```

**Enable the site:**

```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/whiskey-canon /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### SSL with Let's Encrypt

**Using automated script (recommended):**
```bash
sudo ./scripts/ssl-setup.sh -d YOUR_DOMAIN.com -e admin@YOUR_DOMAIN.com
```

**Manual setup:**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Certificate will auto-renew. Test renewal:
sudo certbot renew --dry-run
```

### 3. Setup UFW Firewall (Optional)

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow Nginx
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Application Management

### Useful PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs whiskey-canon-backend
pm2 logs whiskey-canon-frontend

# Restart application
pm2 restart whiskey-canon-backend

# Stop application
pm2 stop whiskey-canon-backend

# Delete application from PM2
pm2 delete whiskey-canon-backend

# Monitor resources
pm2 monit
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
cp ~/apps/whiskey-canon/whiskey.db ~/backups/whiskey-$(date +%Y%m%d-%H%M%S).db

# Create automated backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DB_PATH="$HOME/apps/whiskey-canon/whiskey.db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/whiskey-$TIMESTAMP.db"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "whiskey-*.db" -mtime +7 -delete

echo "Backup completed: whiskey-$TIMESTAMP.db"
EOF

chmod +x ~/backup-db.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-db.sh") | crontab -
```

### Update Application

```bash
cd ~/apps/whiskey-canon

# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build --workspace=backend
npm run build --workspace=frontend

# Restart services
pm2 restart whiskey-canon-backend
```

---

## Troubleshooting

### Check Application Logs

```bash
# Backend logs
pm2 logs whiskey-canon-backend --lines 100

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Check Port Usage

```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check if port 80 is in use
sudo lsof -i :80
```

### Database Issues

```bash
# Check database file permissions
ls -la ~/apps/whiskey-canon/whiskey.db

# Fix permissions if needed
chmod 644 ~/apps/whiskey-canon/whiskey.db

# Access database
sqlite3 ~/apps/whiskey-canon/whiskey.db
```

### Nginx Issues

```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx
```

### Memory Issues

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# If running low on memory, add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Security Best Practices

1. **Change default passwords** - Update admin user password immediately
2. **Keep system updated** - Run `sudo apt update && sudo apt upgrade` regularly
3. **Use SSL/HTTPS** - Always use Let's Encrypt certificates in production
4. **Firewall** - Enable UFW and only allow necessary ports
5. **Backup regularly** - Automate database backups
6. **Session secrets** - Use strong random SESSION_SECRET in production
7. **Restrict SSH** - Consider disabling password authentication, use SSH keys only
8. **Monitor logs** - Regularly check application and system logs

---

## Performance Optimization

### Enable Gzip Compression (Nginx)

Add to your Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### Database Optimization

```bash
# Vacuum database to optimize
sqlite3 ~/apps/whiskey-canon/whiskey.db "VACUUM;"

# Analyze database for query optimization
sqlite3 ~/apps/whiskey-canon/whiskey.db "ANALYZE;"
```

---

## Monitoring

### Setup Basic Monitoring with PM2 Plus (Optional)

```bash
# Install PM2 Plus
pm2 plus

# Or use free monitoring
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY
```

### Check System Resources

```bash
# Install htop for better process monitoring
sudo apt install htop -y

# Run htop
htop
```

---

## Access Your Application

- **Without Nginx**: `http://YOUR_SERVER_IP:3000`
- **With Nginx (HTTP)**: `http://YOUR_DOMAIN.com` or `http://YOUR_SERVER_IP`
- **With SSL (HTTPS)**: `https://YOUR_DOMAIN.com`

Default test users (if you ran seed script):
- Username: `alice_admin`, Password: `password123` (Admin)
- Username: `bob_editor`, Password: `password123` (Editor)
- Username: `charlie_viewer`, Password: `password123` (Viewer)
- Username: `diana_editor`, Password: `password123` (Editor)

**IMPORTANT**: Change these passwords immediately in production!

---

## Support

For issues or questions:
- Check application logs: `pm2 logs`
- Check system logs: `journalctl -xe`
- Review this documentation
- Check the project repository for updates

---

## License

This deployment guide is part of the Whiskey Canon project.

Last updated: November 2025
