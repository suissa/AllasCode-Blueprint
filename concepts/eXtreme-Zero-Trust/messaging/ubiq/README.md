# UbiQ transport contract

UbiQ is the LEDSA transport and consumption contract. It is QUIC-first, NATS-compatible for interoperability, and designed around ACK, first-writer claim, dedupe, replay guard and LinearConsumeOnce semantics.

Default protocols:

```text
["quic", "nats"]
```

Optional adapters:

```text
["grpc", "websocket"]
```

Security defaults:

```text
mTLS = required
DPoP = optional/configurable
ZeroTrust = required
LinearConsumeOnce = required
```

Delivery rules:

- ACK only after local append receipt.
- First writer claims the logical event for an entity/process shard.
- Dedupe is mandatory by message id, JTI and session binding.
- Retry window defaults to 1 minute.
- Outbox aggregation defaults to 1 minute per entity_id.
- TGC window defaults to 20-30 seconds.
- Known subscriber/Agent addresses may receive direct QUIC delivery.
- Broker routing remains for discovery, fallback, routing and audit.

Consumption variants:

```text
LinearConsumeOnce
LinearConsumeAll
LinearConsumeAllZeroTrust
```

`LinearConsumeAllZeroTrust` encrypts payloads individually per subscriber. Each ACK releases a different decrypt key, and final consumption requires proof that the issued key was used.
