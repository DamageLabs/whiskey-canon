# Beta Environment Setup

This document describes how to run both production and beta versions of Whiskey Canon on the same GCP VM.

## Architecture

```
+---------------------------------------+
|         Nginx (ports 80/443)          |
+---------------------------------------+
            |                |
whiskey-canon.com    beta.whiskey-canon.com
            |                |
            v                v
+----------------+  +----------------+
|  App (3000)    |  |  App (3001)    |
|  /var/www/     |  |  /var/www/     |
|  production    |  |  beta          |
+----------------+  +----------------+
            |                |
+----------------+  +----------------+
| whiskey.db     |  | whiskey-beta.db|
+----------------+  +----------------+
```

| Environment | Domain | Port | Directory | PM2 Name | Deploys On |
|-------------|--------|------|-----------|----------|------------|
| Production | whiskey-canon.com | 3000 | /var/www/whiskey-canon | whiskey-production | GitHub release |
| Beta | beta.whiskey-canon.com | 3001 | /var/www/whiskey-canon-beta | whiskey-beta | Manual trigger |

## Prerequisites

### DNS Configuration

Add these A records to your domain:

| Type | Name | Value |
|------|------|-------|
| A | @ | `<VM_EXTERNAL_IP>` |
| A | www | `<VM_EXTERNAL_IP>` |
| A | beta | `<VM_EXTERNAL_IP>` |

## Directory Structure

```
/var/www/
+-- whiskey-canon/           # Production (main branch, release tags)
|   +-- backend/
|   +-- frontend/
|   +-- data/
|       +-- whiskey.db
+-- whiskey-canon-beta/      # Beta (feature branches)
|   +-- backend/
|   +-- frontend/
|   +-- data/
|       +-- whiskey-beta.db
+-- ecosystem.config.js      # PM2 configuration
```

## Initial Setup

### 1. Clone Repositories

```bash
# Production
cd /var/www
git clone git@github.com:DamageLabs/whiskey-canon.git whiskey-canon
cd whiskey-canon
npm install
npm run build

# Beta
cd /var/www
git clone git@github.com:DamageLabs/whiskey-canon.git whiskey-canon-beta
cd whiskey-canon-beta
npm install
npm run build
```

### 2. PM2 Ecosystem Configuration

Create `/var/www/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'whiskey-production',
      cwd: '/var/www/whiskey-canon',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_PATH: './data/whiskey.db'
      }
    },
    {
      name: 'whiskey-beta',
      cwd: '/var/www/whiskey-canon-beta',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_PATH: './data/whiskey-beta.db'
      }
    }
  ]
};
```

Start both apps:

```bash
pm2 start /var/www/ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start on reboot
```

### 3. Nginx Configuration

#### Production Site

Create `/etc/nginx/sites-available/whiskey-canon.com`:

```nginx
server {
    listen 80;
    server_name whiskey-canon.com www.whiskey-canon.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name whiskey-canon.com www.whiskey-canon.com;

    ssl_certificate /etc/letsencrypt/live/whiskey-canon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whiskey-canon.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
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
}
```

#### Beta Site

Create `/etc/nginx/sites-available/beta.whiskey-canon.com`:

```nginx
server {
    listen 80;
    server_name beta.whiskey-canon.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name beta.whiskey-canon.com;

    ssl_certificate /etc/letsencrypt/live/beta.whiskey-canon.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beta.whiskey-canon.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the sites:

```bash
sudo ln -s /etc/nginx/sites-available/whiskey-canon.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/beta.whiskey-canon.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificates (Let's Encrypt)

```bash
# Install Certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Get certificates for production
sudo certbot --nginx -d whiskey-canon.com -d www.whiskey-canon.com

# Get certificate for beta
sudo certbot --nginx -d beta.whiskey-canon.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## GitHub Actions Deployment

### Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `GCP_HOST` | VM external IP address |
| `GCP_USER` | SSH username (e.g., `deploy`) |
| `GCP_SSH_KEY` | Private SSH key for authentication |

### Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy to'
        required: true
        default: 'beta'
        type: choice
        options:
          - beta
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Set deployment target
        id: target
        run: |
          if [[ "${{ github.event_name }}" == "release" ]]; then
            echo "env=production" >> $GITHUB_OUTPUT
            echo "path=/var/www/whiskey-canon" >> $GITHUB_OUTPUT
            echo "pm2_name=whiskey-production" >> $GITHUB_OUTPUT
            echo "ref=${{ github.event.release.tag_name }}" >> $GITHUB_OUTPUT
          else
            echo "env=${{ inputs.environment }}" >> $GITHUB_OUTPUT
            if [[ "${{ inputs.environment }}" == "production" ]]; then
              echo "path=/var/www/whiskey-canon" >> $GITHUB_OUTPUT
              echo "pm2_name=whiskey-production" >> $GITHUB_OUTPUT
            else
              echo "path=/var/www/whiskey-canon-beta" >> $GITHUB_OUTPUT
              echo "pm2_name=whiskey-beta" >> $GITHUB_OUTPUT
            fi
            echo "ref=${{ github.ref }}" >> $GITHUB_OUTPUT
          fi

      - name: Deploy to ${{ steps.target.outputs.env }}
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.GCP_HOST }}
          username: ${{ secrets.GCP_USER }}
          key: ${{ secrets.GCP_SSH_KEY }}
          script: |
            cd ${{ steps.target.outputs.path }}
            git fetch --all --tags
            git checkout ${{ steps.target.outputs.ref }}
            npm install
            npm run build
            pm2 restart ${{ steps.target.outputs.pm2_name }}

      - name: Deployment summary
        run: |
          echo "## Deployment Complete" >> $GITHUB_STEP_SUMMARY
          echo "- **Environment:** ${{ steps.target.outputs.env }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Ref:** ${{ steps.target.outputs.ref }}" >> $GITHUB_STEP_SUMMARY
```

## Deployment Workflows

### Automatic Production Deployment

1. Create a GitHub release (e.g., v1.2.0)
2. Deployment automatically triggers
3. Production site updates at whiskey-canon.com

### Manual Beta Deployment

1. Go to Actions > Deploy > Run workflow
2. Select branch to deploy
3. Choose "beta" environment
4. Click "Run workflow"
5. Beta site updates at beta.whiskey-canon.com

### Manual Commands (SSH)

```bash
# Deploy specific branch to beta
cd /var/www/whiskey-canon-beta
git fetch --all
git checkout feature/my-feature
npm install
npm run build
pm2 restart whiskey-beta

# Deploy specific tag to production
cd /var/www/whiskey-canon
git fetch --tags
git checkout v1.2.0
npm install
npm run build
pm2 restart whiskey-production
```

## Useful Commands

### PM2 Management

```bash
# View all processes
pm2 list

# View logs
pm2 logs whiskey-production
pm2 logs whiskey-beta

# Restart specific app
pm2 restart whiskey-production
pm2 restart whiskey-beta

# Restart all
pm2 restart all

# Monitor resources
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Management

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

## Troubleshooting

### App Not Starting

```bash
# Check PM2 logs
pm2 logs whiskey-beta --lines 50

# Check if port is in use
sudo lsof -i :3001
```

### 502 Bad Gateway

```bash
# Verify app is running
pm2 list

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass port matches app port
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Manually renew
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

## Security Considerations

1. **Separate databases**: Beta uses its own database to prevent test data from affecting production
2. **Access control**: Consider adding HTTP basic auth to beta site for restricted access
3. **SSH keys**: Use dedicated deploy keys with limited permissions
4. **Firewall**: Ensure only ports 80, 443, and 22 are open

### Optional: Password Protect Beta Site

Add to beta Nginx config:

```nginx
auth_basic "Beta Access";
auth_basic_user_file /etc/nginx/.htpasswd;
```

Create password file:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd betauser
```
