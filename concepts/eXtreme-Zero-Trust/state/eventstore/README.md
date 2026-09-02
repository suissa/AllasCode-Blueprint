# Local Agent EventStore

Every stateful actor owns an append-only recovery log. The invariant is:

```text
accepted message -> append local -> projection/CRDT -> ACK
```

The local store is the primary process-recovery source. Replication to a polyglot/global EventStore is secondary and must not be required for a local actor restart.
