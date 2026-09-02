# AON-ATCP — protocol profile

AON-ATCP is the protocol profile used by LEDSA to bind identity, possession, channel, message and semantic authorization.

## Normative profile

An implementation conforming to this experimental profile:

- MUST authenticate the originating human/workload identity before privileged message release.
- MUST bind sender proof to the intended method/action, target/audience, message digest and active session.
- MUST reject replayed proof identifiers inside their validity window.
- MUST authenticate sidecar peers with mTLS or an equivalent mutually authenticated secure channel.
- MUST NOT expose long-lived private key material to BEAM actors.
- MUST persist an accepted state-changing message before acknowledging durable broker consumption.
- MUST treat broker redelivery as a normal condition.
- MUST provide deterministic duplicate handling at the application/state layer.
- SHOULD support hybrid classical + post-quantum key establishment through a crypto-agile provider.
- SHOULD encode ephemeral secrets as affine/linear resources wherever the implementation language permits it.

## Proposed ALPN

`aon-atcp/1` is a project-local experimental identifier in this repository. It MUST NOT be represented as an IANA registration unless and until registration is actually completed.

## Message binding

A proof should bind at least:

```text
issuer
audience
action/method
target/URI
issued-at / expiry
unique proof id
session binding
canonical message digest
```

The wire encoding is deliberately kept separate from the semantic model so CBOR, Protobuf or future encodings can implement the same contract.
