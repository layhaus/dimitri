#!/bin/sh
set -e
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb_data
fi
exec pocketbase serve --http=0.0.0.0:8090 --dir=/pb_data --publicDir=/pb_public --migrationsDir=/pb_migrations --hooksDir=/pb_hooks
