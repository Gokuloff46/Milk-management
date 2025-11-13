#!/bin/sh
set -e
if [ ! -f .env ]; then
  cp .env.example .env
  composer install
  php artisan key:generate
  php artisan migrate --force || true
fi
exec "$@"