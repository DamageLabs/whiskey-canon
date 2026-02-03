#!/bin/bash
#
# ssl-setup.sh - Obtain Let's Encrypt SSL certificates for Whiskey Canon
#
# This script:
#   1. Installs certbot with nginx plugin
#   2. Obtains SSL certificate for domain and www subdomain
#   3. Sets up automatic certificate renewal
#
# Usage: sudo ./scripts/ssl-setup.sh -d domain.com -e email@domain.com [--staging]
#
# Options:
#   -d, --domain    Domain name (required)
#   -e, --email     Email for Let's Encrypt notifications (required)
#   --staging       Use Let's Encrypt staging server (for testing)
#   -h, --help      Show this help message
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DOMAIN=""
EMAIL=""
STAGING=""

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
    echo "Usage: sudo $0 -d domain.com -e email@domain.com [--staging]"
    echo
    echo "Options:"
    echo "  -d, --domain    Domain name (required)"
    echo "  -e, --email     Email for Let's Encrypt notifications (required)"
    echo "  --staging       Use Let's Encrypt staging server (for testing)"
    echo "  -h, --help      Show this help message"
    echo
    echo "Example:"
    echo "  sudo $0 -d whiskey.example.com -e admin@example.com --staging  # Test first"
    echo "  sudo $0 -d whiskey.example.com -e admin@example.com            # Real cert"
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            --staging)
                STAGING="--staging"
                shift
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

    if [[ -z "$EMAIL" ]]; then
        log_error "Email is required (-e email@domain.com)"
        show_help
        exit 1
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install certbot
install_certbot() {
    if command -v certbot &> /dev/null; then
        log_info "Certbot is already installed: $(certbot --version 2>&1)"
        return 0
    fi

    log_info "Installing Certbot..."

    if command -v apt-get &> /dev/null; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif command -v yum &> /dev/null; then
        # RHEL/CentOS/Amazon Linux
        yum install -y epel-release || true
        yum install -y certbot python3-certbot-nginx
    elif command -v dnf &> /dev/null; then
        # Fedora/RHEL 8+
        dnf install -y certbot python3-certbot-nginx
    elif command -v brew &> /dev/null; then
        # macOS (Homebrew) - certbot only, no nginx plugin
        brew install certbot
        log_warn "macOS: certbot-nginx plugin not available via brew. Using standalone method."
    else
        log_error "Could not detect package manager. Please install Certbot manually."
        exit 1
    fi

    log_info "Certbot installed successfully"
}

# Create temporary nginx config for certificate acquisition
create_temp_config() {
    log_info "Creating temporary Nginx config for certificate acquisition..."

    local temp_config="/etc/nginx/sites-available/whiskey-canon-temp.conf"
    local acme_dir="/var/www/certbot"

    # Ensure ACME directory exists
    mkdir -p "$acme_dir"

    cat > "$temp_config" << EOF
# Temporary configuration for Let's Encrypt certificate acquisition
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 404;
    }
}
EOF

    # Enable the temporary config
    ln -sf "$temp_config" /etc/nginx/sites-enabled/whiskey-canon-temp.conf

    # Disable default site if it exists
    rm -f /etc/nginx/sites-enabled/default

    # Test and reload nginx
    nginx -t
    systemctl reload nginx || nginx -s reload

    log_info "Temporary config created and enabled"
}

# Remove temporary nginx config
remove_temp_config() {
    log_info "Removing temporary Nginx config..."
    rm -f /etc/nginx/sites-enabled/whiskey-canon-temp.conf
    rm -f /etc/nginx/sites-available/whiskey-canon-temp.conf
}

# Obtain SSL certificate
obtain_certificate() {
    log_info "Obtaining SSL certificate for $DOMAIN..."

    local certbot_args=(
        certonly
        --webroot
        --webroot-path /var/www/certbot
        -d "$DOMAIN"
        -d "www.$DOMAIN"
        --email "$EMAIL"
        --agree-tos
        --non-interactive
    )

    if [[ -n "$STAGING" ]]; then
        certbot_args+=("$STAGING")
        log_warn "Using Let's Encrypt STAGING server (certificates will not be trusted)"
    fi

    if certbot "${certbot_args[@]}"; then
        log_info "SSL certificate obtained successfully!"
    else
        log_error "Failed to obtain SSL certificate"
        remove_temp_config
        exit 1
    fi
}

# Setup auto-renewal cron job
setup_renewal() {
    log_info "Setting up automatic certificate renewal..."

    local cron_job="0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'"
    local cron_file="/etc/cron.d/certbot-renewal"

    # Check if certbot timer exists (systemd)
    if systemctl list-timers | grep -q certbot; then
        log_info "Certbot systemd timer is already enabled"
        return 0
    fi

    # Create cron job for renewal
    echo "$cron_job" > "$cron_file"
    chmod 644 "$cron_file"

    log_info "Certificate renewal cron job created at $cron_file"
    log_info "Certificates will be checked for renewal daily at 3 AM"
}

# Test renewal
test_renewal() {
    log_info "Testing certificate renewal (dry run)..."

    if certbot renew --dry-run; then
        log_info "Renewal test passed!"
    else
        log_warn "Renewal test failed. Check your configuration."
    fi
}

# Main execution
main() {
    echo "========================================"
    echo "  Whiskey Canon - SSL Setup"
    echo "========================================"
    echo

    parse_args "$@"
    check_root

    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"
    [[ -n "$STAGING" ]] && log_warn "Using STAGING server"
    echo

    install_certbot
    create_temp_config
    obtain_certificate
    remove_temp_config
    setup_renewal
    test_renewal

    echo
    echo "========================================"
    log_info "SSL setup complete!"
    echo "========================================"
    echo
    echo "Certificate files:"
    echo "  Fullchain: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  Private key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
    echo
    if [[ -n "$STAGING" ]]; then
        echo -e "${YELLOW}WARNING: You used --staging. These certificates are NOT trusted.${NC}"
        echo "Run again without --staging for production certificates."
        echo
    fi
    echo "Next step:"
    echo "  sudo ./scripts/deploy-prod.sh -d $DOMAIN -u \$USER"
    echo
}

main "$@"
