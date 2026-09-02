#!/usr/bin/env sh
set -eu
cat <<'EOF'
Benchmark harness not implemented yet.
Required comparison dimensions:
- baseline JetStream publish/consume
- append-before-ACK LEDSA path
- replay/dedupe overhead
- crypto verification overhead
- hybrid PQ provider overhead
Report p50/p95/p99 latency, throughput, CPU and memory.
EOF
