#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
docker compose -f demos/end-to-end/docker-compose.yml up -d nats
