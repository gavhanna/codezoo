#!/bin/sh
set -e

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  bunx prisma migrate deploy
fi

# Execute the passed command
exec "$@"
