# V1 Performance Acceptance

This document defines the minimum v1 load envelope. It is an acceptance contract, not a production sizing promise.

## Baseline targets

- Synthetic purchase/sale runtime path: >= 5,000 operations/second in CI benchmark harness.
- WhatsApp ingress burst: 250 messages accepted inside a bounded capacity of 300, with no loss inside the envelope.
- Concurrent mutations targeting the same sale/stock/payment resource must serialize by resource key.
- Queue capacity is finite; overload is rejected/backpressured rather than allowed to grow without bound.
- Selective semantic test scheduling must remain deterministic with at least 5,000 semantic graph nodes.

## Release artifact

`npm run performance:acceptance` generates `reports/performance/result.json`. Release acceptance fails when a measured threshold fails.

## Interpretation

The benchmark intentionally measures runtime/control-path overhead rather than external network or database latency. Provider/database production SLOs must be measured in the deployment environment. The purpose of this gate is to catch algorithmic regressions, nondeterministic selection, lost burst messages, race conditions and unbounded queues before v1.
