#!/bin/bash
#
# nginx-setup.sh - Install and configure Nginx for Whiskey Canon
#
# This script:
#   1. Installs Nginx if not present
#   2. Copies snippet configurations
#   3. Generates DH parameters for SSL
#   4. Creates ACME challenge directory for Let's Encrypt
#
# Usage: sudo ./scripts/nginx-setup.sh
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

# Detect package manager and install nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Nginx is already installed: $(nginx -v 2>&1)"
        return 0
    fi

    log_info "Installing Nginx..."

    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Amazon Linux
        yum install -y epel-release || true
        yum install -y nginx
    elif command -v dnf &> /dev/null; then
        # Fedora/RHEL 8+
        dnf install -y nginx
    elif command -v brew &> /dev/null; then
        # macOS (Homebrew)
        brew install nginx
    else
        log_error "Could not detect package manager. Please install Nginx manually."
        exit 1
    fi

    log_info "Nginx installed successfully"
}

# Copy snippet configurations
copy_snippets() {
    log_info "Copying Nginx snippets..."

    local snippets_src="$PROJECT_DIR/nginx/snippets"
    local snippets_dest="/etc/nginx/snippets"

    # Create snippets directory if it doesn't exist
    mkdir -p "$snippets_dest"

    # Copy each snippet
    for snippet in "$snippets_src"/*.conf; do
        if [[ -f "$snippet" ]]; then
            cp "$snippet" "$snippets_dest/"
            log_info "  Copied $(basename "$snippet")"
        fi
    done

    log_info "Snippets copied to $snippets_dest"
}

# Generate DH parameters for SSL
generate_dhparam() {
    local dhparam_file="/etc/nginx/dhparam.pem"

    if [[ -f "$dhparam_file" ]]; then
        log_info "DH parameters already exist at $dhparam_file"
        return 0
    fi

    log_info "Generating DH parameters (this may take a few minutes)..."
    openssl dhparam -out "$dhparam_file" 2048
    chmod 644 "$dhparam_file"
    log_info "DH parameters generated at $dhparam_file"
}

# Create ACME challenge directory for Let's Encrypt
create_acme_directory() {
    local acme_dir="/var/www/certbot"

    if [[ -d "$acme_dir" ]]; then
        log_info "ACME challenge directory already exists at $acme_dir"
        return 0
    fi

    log_info "Creating ACME challenge directory..."
    mkdir -p "$acme_dir"
    chown -R www-data:www-data "$acme_dir" 2>/dev/null || chown -R nginx:nginx "$acme_dir" 2>/dev/null || true
    chmod 755 "$acme_dir"
    log_info "ACME challenge directory created at $acme_dir"
}

# Enable and start nginx
enable_nginx() {
    log_info "Enabling and starting Nginx..."

    if command -v systemctl &> /dev/null; then
        systemctl enable nginx
        systemctl start nginx || systemctl restart nginx
        log_info "Nginx service enabled and started"
    elif command -v brew &> /dev/null; then
        # macOS
        brew services start nginx || brew services restart nginx
        log_info "Nginx service started (macOS)"
    else
        log_warn "Could not detect init system. Please start Nginx manually."
    fi
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

# Main execution
main() {
    echo "========================================"
    echo "  Whiskey Canon - Nginx Setup"
    echo "========================================"
    echo

    check_root
    install_nginx
    copy_snippets
    generate_dhparam
    create_acme_directory
    enable_nginx
    test_nginx

    echo
    echo "========================================"
    log_info "Nginx setup complete!"
    echo "========================================"
    echo
    echo "Next steps:"
    echo "  - For development: sudo ./scripts/deploy-dev.sh"
    echo "  - For production:  sudo ./scripts/ssl-setup.sh -d yourdomain.com -e admin@yourdomain.com"
    echo "                     sudo ./scripts/deploy-prod.sh -d yourdomain.com -u \$USER"
    echo
}

main "$@"
