#!/bin/bash
set -e
# If vendor is missing, run composer install
if [ ! -d "vendor" ]; then
  composer install
fi
# Generate app key if missing
if [ -f .env ] && ! grep -q "APP_KEY" .env; then
  php artisan key:generate
fi
php artisan migrate --force || true
exec "$@"
