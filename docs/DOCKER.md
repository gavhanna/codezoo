# Docker Setup for CodeZoo

This guide explains how to self-host CodeZoo using Docker and Docker Compose.

## Prerequisites

- Docker
- Docker Compose

## Quick Start (Using Pre-built Images)

The easiest way to run CodeZoo is using pre-built images from GitHub Container Registry (GHCR).

1. **Download docker-compose.yml**

   ```bash
   curl -O https://raw.githubusercontent.com/gavhanna/codezoo/main/docker-compose.yml
   ```

2. **Configure environment variables** (optional)
   
   The `docker-compose.yml` includes default environment variables. For production, you should:
   - Change `SESSION_SECRET` and `JWT_SECRET` to secure random values
   - Modify the PostgreSQL password in both the `db` and `app` services

3. **Start the services**

   ```bash
   docker-compose up -d
   ```

   This will:
   - Pull the latest CodeZoo image from GHCR
   - Start a PostgreSQL database
   - Start the application server

4. **Run database migrations**

   ```bash
   docker-compose exec app bunx prisma migrate deploy
   ```

5. **Access the application**

   Open your browser to `http://localhost:3000`

## Local Development (Building from Source)

If you want to build and test the image locally before pushing to GHCR:

### Option 1: Using Make (Recommended)

```bash
# Build image and start services
make build-up

# Run migrations
make migrate

# View logs
make logs
```

See all available commands with `make help`.

### Option 2: Manual Build

1. **Clone the repository**

2. **Build the image with the GHCR tag**

   ```bash
   docker build -t ghcr.io/gavhanna/codezoo:latest .
   ```

3. **Start services** (will use the locally built image)

   ```bash
   docker-compose up -d
   ```

4. **Run migrations**

   ```bash
   docker-compose exec app bunx prisma migrate deploy
   ```

5. **Access the application**

   Open your browser to `http://localhost:3000`

### Option 3: Using Build Compose File

For a completely separate local build:

```bash
docker-compose -f docker-compose.build.yml up -d
docker-compose -f docker-compose.build.yml exec app bunx prisma migrate deploy
```

## Management Commands

### View logs
```bash
docker-compose logs -f app
```

### Stop services
```bash
docker-compose down
```

### Restart services
```bash
docker-compose restart
```

### Pull latest image
```bash
docker-compose pull
docker-compose up -d
```

### Rebuild from source (local development)
```bash
docker-compose -f docker-compose.build.yml up -d --build
```

### Run Prisma Studio (database GUI)
```bash
docker-compose exec app bunx prisma studio
```

## Publishing to GHCR

The repository includes a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that automatically builds and publishes Docker images to GitHub Container Registry on:
- Pushes to `main` branch (tagged as `latest`)
- Version tags (e.g., `v1.0.0`)
- Pull requests (for testing)

Images are available at: `ghcr.io/gavhanna/codezoo:latest`

## Production Deployment

For production deployments:

1. **Use environment files**: Create a `.env` file based on `.env.example`
2. **Secure secrets**: Generate strong random values for `SESSION_SECRET` and `JWT_SECRET`
3. **Database backups**: Set up regular backups of the `db_data` volume
4. **Reverse proxy**: Use nginx or Traefik in front of the app for SSL/TLS
5. **Resource limits**: Add resource constraints in `docker-compose.yml`

## Troubleshooting

### Port conflicts
If port 3000 is already in use, modify the port mapping in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Change 8080 to any available port
```

### Database connection issues
Ensure the database is fully started before the app:
```bash
docker-compose up -d db
sleep 5
docker-compose up -d app
```

### Reset database
```bash
docker-compose down -v  # Warning: This deletes all data!
docker-compose up -d
docker-compose exec app bunx prisma migrate deploy
```
