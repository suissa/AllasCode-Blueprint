# UbiQ development infrastructure

For local development, UbiQ may run with QUIC-first transport and a NATS-compatible adapter for interoperability. Production deployment must configure persistent volumes where needed, credentials, mTLS, resource limits, explicit retention, replay windows and audit policy.

The local scaffold must not imply production hardening. Production UbiQ requires:

- required mTLS
- optional/configurable DPoP
- dedupe by message id, JTI and session binding
- ACK only after local append receipt
- first-writer claim storage
- retry window of 1 minute unless overridden
- outbox aggregation of 1 minute per entity_id
- direct Agent delivery when the subscriber address is known
