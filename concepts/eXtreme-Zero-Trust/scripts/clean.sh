#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
docker compose -f demos/end-to-end/docker-compose.yml down -v || true
rm -rf .tmp crypto/rust-sidecar/target sdk/rust-sdk/target
