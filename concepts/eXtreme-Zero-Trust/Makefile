.PHONY: nats rust-check

nats:
	docker compose -f demos/end-to-end/docker-compose.yml up nats

rust-check:
	cargo check --manifest-path crypto/rust-sidecar/Cargo.toml
