# Kubernetes deployment target

A production deployment should place each protected actor/workload behind the Rust security boundary and use workload identity rather than embedding long-lived credentials in manifests.

This folder intentionally contains no fake production YAML yet. Required work includes:

- NATS JetStream persistence and disruption budgets;
- sidecar lifecycle/readiness;
- secret-free workload identity/bootstrap;
- network policies;
- telemetry and replay-store durability;
- PQ provider configuration and downgrade policy.
