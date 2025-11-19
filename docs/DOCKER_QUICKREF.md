# CodeZoo Docker Quick Reference

## Local Development & Testing

Build and test locally before pushing to GHCR:

```bash
# Build image with GHCR tag
make build

# Start services
make up

# Run migrations
make migrate

# View logs
make logs

# Or do it all at once
make test-local
```

## Deploying to Production

### Step 1: Test Locally
```bash
make test-local
# Verify at http://localhost:3000
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Update application"
git push origin main
```

### Step 3: GitHub Actions Builds & Publishes
- Workflow automatically builds and pushes to `ghcr.io/gavhanna/codezoo:latest`
- Check Actions tab for build status

### Step 4: Deploy on Server
```bash
# On your server
curl -O https://raw.githubusercontent.com/gavhanna/codezoo/main/docker-compose.yml
docker-compose pull
docker-compose up -d
docker-compose exec app bunx prisma migrate deploy
```

## Available Make Commands

| Command | Description |
|---------|-------------|
| `make build` | Build Docker image locally |
| `make up` | Start services |
| `make down` | Stop services |
| `make logs` | View application logs |
| `make migrate` | Run database migrations |
| `make restart` | Restart services |
| `make clean` | Stop and remove volumes (deletes data!) |
| `make build-up` | Build and start services |
| `make test-local` | Full local test (build, start, migrate) |
| `make pull` | Pull latest image from GHCR |
| `make update` | Pull and restart with latest image |
| `make help` | Show all commands |

## Image Workflow

```
Local Development          GitHub Actions              Production
─────────────────          ──────────────              ──────────
                                                       
make build        ──┐                                  
                   │                                   
make up            │      git push      ┌──────────┐  docker-compose pull
                   │  ──────────────▶   │  Build   │  
make migrate       │                    │  & Push  │  docker-compose up -d
                   │                    └──────────┘  
Test locally ──────┘                         │        docker-compose exec
                                             │        app bunx prisma
                                             ▼        migrate deploy
                                    ghcr.io/gavhanna/
                                    codezoo:latest
```

## Files Overview

- **Dockerfile** - Multi-stage build for Bun app
- **docker-compose.yml** - Production setup (uses GHCR image)
- **docker-compose.build.yml** - Alternative local build setup
- **Makefile** - Convenient commands
- **.github/workflows/docker-publish.yml** - CI/CD pipeline
- **DOCKER.md** - Full documentation

## Environment Variables

Key variables in `docker-compose.yml`:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (change for production!)
- `JWT_SECRET` - JWT signing key (change for production!)
- `NODE_ENV` - Environment mode

## Troubleshooting

**Image not found locally?**
```bash
make build  # Build it first
```

**Want to use GHCR image instead of local?**
```bash
make pull   # Pull from registry
make up     # Start services
```

**Database issues?**
```bash
make clean  # Warning: deletes all data
make build-up
make migrate
```
