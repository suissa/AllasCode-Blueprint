# Security model

LEDSA composes five independent assertions:

```text
IdentityAuthenticated
&& PossessionProved
&& ChannelAuthenticated
&& MessageBoundToSession
&& IntentAuthorized
```

A local append receipt then gates the broker ACK. No single assertion substitutes for another.

The protocol must also be downgrade resistant: peers cannot silently negotiate away required identity, mTLS, proof-of-possession or the configured hybrid PQ profile.
