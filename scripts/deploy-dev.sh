#!/bin/bash
#
# deploy-dev.sh - Deploy Whiskey Canon development Nginx configuration
#
# This script:
#   1. Copies the development config to sites-available
#   2. Creates a symlink in sites-enabled
#   3. Disables the default site
#   4. Tests and reloads Nginx
#
# Usage: sudo ./scripts/deploy-dev.sh
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

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
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

# Deploy development configuration
deploy_dev_config() {
    local config_src="$PROJECT_DIR/nginx/sites-available/whiskey-canon.dev.conf"
    local config_dest="/etc/nginx/sites-available/whiskey-canon.dev.conf"
    local sites_enabled="/etc/nginx/sites-enabled"

    # Check if source config exists
    if [[ ! -f "$config_src" ]]; then
        log_error "Development config not found: $config_src"
        exit 1
    fi

    log_info "Copying development configuration..."
    cp "$config_src" "$config_dest"
    log_info "  Copied to $config_dest"

    # Create sites-enabled directory if it doesn't exist
    mkdir -p "$sites_enabled"

    # Remove existing whiskey-canon configs from sites-enabled
    rm -f "$sites_enabled"/whiskey-canon*.conf

    # Disable default site
    if [[ -f "$sites_enabled/default" ]]; then
        rm -f "$sites_enabled/default"
        log_info "  Disabled default site"
    fi

    # Enable development site
    ln -sf "$config_dest" "$sites_enabled/whiskey-canon.dev.conf"
    log_info "  Enabled development site"
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
    echo "  Whiskey Canon - Deploy Development"
    echo "========================================"
    echo

    check_root
    check_nginx
    deploy_dev_config
    test_nginx
    reload_nginx

    echo
    echo "========================================"
    log_info "Development deployment complete!"
    echo "========================================"
    echo
    echo "To use the local development domain, add to /etc/hosts:"
    echo "  echo '127.0.0.1 whiskey-canon.local' | sudo tee -a /etc/hosts"
    echo
    echo "Then start the development servers:"
    echo "  npm run dev"
    echo
    echo "Access the app at:"
    echo "  http://localhost"
    echo "  http://whiskey-canon.local"
    echo
}

main "$@"
