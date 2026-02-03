#!/bin/bash
#
# deploy-prod.sh - Deploy Whiskey Canon production Nginx configuration
#
# This script:
#   1. Verifies SSL certificates exist
#   2. Verifies frontend build exists
#   3. Replaces template variables in the production config
#   4. Deploys the config and reloads Nginx
#
# Usage: sudo ./scripts/deploy-prod.sh -d domain.com -u username [-p /path/to/app]
#
# Options:
#   -d, --domain    Domain name (required)
#   -u, --user      System user running the app (required)
#   -p, --path      Application directory (default: /home/USER/apps/whiskey-canon)
#   -h, --help      Show this help message
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Default values
DOMAIN=""
APP_USER=""
APP_DIR=""

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    echo "Usage: sudo $0 -d domain.com -u username [-p /path/to/app]"
    echo
    echo "Options:"
    echo "  -d, --domain    Domain name (required)"
    echo "  -u, --user      System user running the app (required)"
    echo "  -p, --path      Application directory (default: /home/USER/apps/whiskey-canon)"
    echo "  -h, --help      Show this help message"
    echo
    echo "Example:"
    echo "  sudo $0 -d whiskey.example.com -u ubuntu"
    echo "  sudo $0 -d whiskey.example.com -u deploy -p /var/www/whiskey-canon"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -u|--user)
                APP_USER="$2"
                shift 2
                ;;
            -p|--path)
                APP_DIR="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [[ -z "$DOMAIN" ]]; then
        log_error "Domain is required (-d domain.com)"
        show_help
        exit 1
    fi

    if [[ -z "$APP_USER" ]]; then
        log_error "User is required (-u username)"
        show_help
        exit 1
    fi

    # Set default app directory if not provided
    if [[ -z "$APP_DIR" ]]; then
        APP_DIR="/home/$APP_USER/apps/whiskey-canon"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Check if nginx is installed
check_nginx() {
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx is not installed. Run nginx-setup.sh first."
        exit 1
    fi
}

# Verify SSL certificates exist
verify_ssl_certs() {
    local cert_path="/etc/letsencrypt/live/$DOMAIN"

    log_info "Verifying SSL certificates..."

    if [[ ! -f "$cert_path/fullchain.pem" ]]; then
        log_error "SSL certificate not found: $cert_path/fullchain.pem"
        log_error "Run ssl-setup.sh first to obtain certificates."
        exit 1
    fi

    if [[ ! -f "$cert_path/privkey.pem" ]]; then
        log_error "SSL private key not found: $cert_path/privkey.pem"
        log_error "Run ssl-setup.sh first to obtain certificates."
        exit 1
    fi

    log_info "  SSL certificates found at $cert_path"
}

# Verify frontend build exists
verify_frontend_build() {
    local frontend_dist="$APP_DIR/frontend/dist"

    log_info "Verifying frontend build..."

    if [[ ! -d "$frontend_dist" ]]; then
        log_warn "Frontend build not found: $frontend_dist"
        log_warn "Make sure to run 'npm run build' before deploying."
        log_warn "Continuing anyway (you can build later)..."
        return 0
    fi

    if [[ ! -f "$frontend_dist/index.html" ]]; then
        log_warn "Frontend index.html not found: $frontend_dist/index.html"
        log_warn "Make sure to run 'npm run build' before deploying."
        log_warn "Continuing anyway (you can build later)..."
        return 0
    fi

    log_info "  Frontend build found at $frontend_dist"
}

# Deploy production configuration
deploy_prod_config() {
    local config_src="$PROJECT_DIR/nginx/sites-available/whiskey-canon.prod.conf"
    local config_dest="/etc/nginx/sites-available/whiskey-canon.prod.conf"
    local sites_enabled="/etc/nginx/sites-enabled"

    # Check if source config exists
    if [[ ! -f "$config_src" ]]; then
        log_error "Production config not found: $config_src"
        exit 1
    fi

    log_info "Deploying production configuration..."
    log_info "  Domain: $DOMAIN"
    log_info "  User: $APP_USER"
    log_info "  App directory: $APP_DIR"

    # Replace template variables and copy to destination
    sed -e "s|\${DOMAIN}|$DOMAIN|g" \
        -e "s|\${USER}|$APP_USER|g" \
        -e "s|\${APP_DIR}|$APP_DIR|g" \
        "$config_src" > "$config_dest"

    log_info "  Created $config_dest"

    # Create sites-enabled directory if it doesn't exist
    mkdir -p "$sites_enabled"

    # Remove existing whiskey-canon configs from sites-enabled
    rm -f "$sites_enabled"/whiskey-canon*.conf

    # Disable default site
    if [[ -f "$sites_enabled/default" ]]; then
        rm -f "$sites_enabled/default"
        log_info "  Disabled default site"
    fi

    # Enable production site
    ln -sf "$config_dest" "$sites_enabled/whiskey-canon.prod.conf"
    log_info "  Enabled production site"
}

# Test nginx configuration
test_nginx() {
    log_info "Testing Nginx configuration..."
    if nginx -t; then
        log_info "Nginx configuration is valid"
    else
        log_error "Nginx configuration test failed"
        exit 1
    fi
}

# Reload nginx
reload_nginx() {
    log_info "Reloading Nginx..."
    if command -v systemctl &> /dev/null; then
        systemctl reload nginx
    else
        nginx -s reload
    fi
    log_info "Nginx reloaded successfully"
}

# Main execution
main() {
    echo "========================================"
    echo "  Whiskey Canon - Deploy Production"
    echo "========================================"
    echo

    parse_args "$@"
    check_root
    check_nginx
    verify_ssl_certs
    verify_frontend_build
    deploy_prod_config
    test_nginx
    reload_nginx

    echo
    echo "========================================"
    log_info "Production deployment complete!"
    echo "========================================"
    echo
    echo "Your site is now available at:"
    echo "  https://$DOMAIN"
    echo
    echo "Make sure:"
    echo "  1. DNS is configured to point to this server"
    echo "  2. Backend is running (npm run start:backend or PM2)"
    echo "  3. Frontend is built (npm run build)"
    echo
    echo "To check status:"
    echo "  curl -I https://$DOMAIN"
    echo "  sudo systemctl status nginx"
    echo
}

main "$@"
