# NATS Linear Layer

NATS JetStream supplies durable at-least-once delivery, durable consumers, deduplication primitives and acknowledgements. LEDSA does **not** redefine those guarantees as network exactly-once.

The wrapper adds a logical lifecycle:

```text
published event
  -> one claim capability per queue/consumer contract
  -> local append receipt
  -> ACK capability
```

A duplicate/redelivery can still arrive; the receiver must recognize the logical event id and ensure it has no second state effect.
