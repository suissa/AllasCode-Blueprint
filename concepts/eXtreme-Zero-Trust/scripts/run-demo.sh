#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
echo "Starting NATS JetStream development broker..."
docker compose -f demos/end-to-end/docker-compose.yml up -d nats
echo "Checking Rust sidecar typestate scaffold..."
cargo run --manifest-path crypto/rust-sidecar/Cargo.toml
