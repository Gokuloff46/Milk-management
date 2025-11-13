# Laravel Milk Management System

This project is a Laravel-based Milk Management System scaffolded with Docker Compose.

## Quick Start

### Build and Start Containers
Run the following commands in PowerShell:

```powershell
# Build and start containers
docker-compose up --build -d

# Tail logs
docker-compose logs -f
```

### Access the Application
- App: [http://localhost:8000](http://localhost:8000)
- phpMyAdmin: [http://localhost:8080](http://localhost:8080) (user: root, password: secret)

### Authentication
- Laravel Breeze is installed for authentication.
- After starting the app, visit `/dashboard` to access the authenticated dashboard.
- Use `php artisan migrate` to set up the database tables for authentication.

## Troubleshooting
- If you see permission errors, run:
  ```powershell
  docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
  ```
- To run migrations inside the app container:
  ```powershell
  docker-compose exec app php artisan migrate
  ```

## Notes
- The Dockerfile builds the Laravel app during image creation.
- Breeze authentication is integrated with a responsive Bootstrap dashboard.
- You can customize the app further by editing the Blade templates and routes.
