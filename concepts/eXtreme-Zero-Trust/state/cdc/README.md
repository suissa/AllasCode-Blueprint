# CDC contract

CDC is the authoritative stream of **confirmed relational changes** in the base architecture.

A CDC adapter MUST emit a canonical event containing at least:

```text
entity_id
revision
writer_rank
payload_hash
payload
occurred_at
```

Adapters are provider-specific. The entity agent does not hard-code downstream read/cache/vector/graph/log consumers; those consumers subscribe by semantic event contract.
