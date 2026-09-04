# Semantic AtomicBehavior Type: LinearAutodestroy

LinearAutodestroy is the LEDSA semantic type for single-consumption capabilities. It models links, challenges, tokens, event capabilities and credentials as values that must be destroyed after successful use.

It is not a claim that distributed bytes cannot be copied. It is a semantic contract:

```text
Consume(capability) -> Destroy(capability) && !ConsumeAgain(capability)
```

Primary transitions:

```text
EphemeralPrivateKey! -> SessionBinding!
DpopToken! -> VerifiedDpop!
LinearEventCapability! -> ClaimedMessage!
ClaimedMessage! + LocalAppendReceipt! -> Acked
MagicLink! -> PasskeyChallenge! -> PresenceConfirmed -> Destroyed
```

The implementation target is Zig runtime capability tables plus AtomicBehavior transition validation. Distributed safety still requires message ids, JTI, session binding, durable replay guard and receiver-side policy.
