# Builder stage: use Composer image to create Laravel project and add a simple dashboard view/controller
FROM composer:2 AS builder
WORKDIR /app
# Create a fresh Laravel project (this runs during image build and requires network access)
RUN composer create-project --prefer-dist laravel/laravel . "^10.0"

# Generate app key
RUN php artisan key:generate --ansi || true

# Add a simple DashboardController and Blade views
RUN php -r "file_put_contents('app/Http/Controllers/DashboardController.php', '<?php\nnamespace App\\Http\\Controllers;\nuse Illuminate\\Http\\Request;\nclass DashboardController extends Controller { public function index(){ return view(\'dashboard\'); } }\n');"

RUN mkdir -p resources/views
RUN bash -lc "cat > resources/views/layout.blade.php <<'EOF'\n<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>Milk Management - Dashboard</title>\n  <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">\n</head>\n<body>\n<nav class=\"navbar navbar-expand-lg navbar-light bg-light\">\n  <div class=\"container-fluid\">\n    <a class=\"navbar-brand\" href=\"/\">Milk Management</a>\n  </div>\n</nav>\n<div class=\"container mt-4\">\n  @yield('content')\n</div>\n<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>\n</body>\n</html>\nEOF"

RUN bash -lc "cat > resources/views/dashboard.blade.php <<'EOF'\n@extends('layout')\n@section('content')\n  <div class=\"card\">\n    <div class=\"card-body\">\n      <h1 class=\"card-title\">Dashboard</h1>\n      <p>Welcome to the Laravel + Docker demo dashboard.</p>\n    </div>\n  </div>\n@endsection\nEOF"

# Add a web route for /dashboard
RUN php -r "file_put_contents('routes/web.php', str_replace("<?php", "<?php\n\nuse App\\Http\\Controllers\\DashboardController;\n\n", file_get_contents('routes/web.php')));"
RUN bash -lc "echo '\nRoute::get(\'/dashboard\', [DashboardController::class, \"index\"]);' >> routes/web.php"

# Add Laravel Breeze installation and setup
RUN composer require laravel/breeze --dev
RUN php artisan breeze:install blade
RUN npm install && npm run dev

# Final stage: php-fpm
FROM php:8.1-fpm
RUN apt-get update && apt-get install -y libzip-dev zip unzip git curl libpng-dev libonig-dev && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

# Copy built application from builder
COPY --from=builder /app /var/www/html
WORKDIR /var/www/html

# Ensure permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache || true

# Expose php-fpm
EXPOSE 9000
CMD ["php-fpm"]
