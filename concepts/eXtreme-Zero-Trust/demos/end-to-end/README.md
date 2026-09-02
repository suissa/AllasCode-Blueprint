# End-to-end demo

Start the broker:

```bash
docker compose up nats
```

The full demo target is:

```text
producer -> sidecar A -> JetStream -> sidecar B -> secure actor
                                      -> local append -> CRDT -> ACK
```

Failure scenarios that every implementation must demonstrate:

1. duplicate JetStream delivery produces one logical state effect;
2. replayed DPoP/JTI is rejected;
3. payload mutation breaks message binding;
4. crash after append/before ACK recovers and makes redelivery harmless;
5. ACK without a matching local append receipt is impossible through the typed API;
6. stale CRDT revision cannot overwrite a newer revision.
