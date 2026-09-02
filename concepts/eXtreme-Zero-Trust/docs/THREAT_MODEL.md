# Threat model

## Adversary capabilities

The model assumes an adversary may:

- observe, delay, duplicate, reorder and replay network messages;
- steal a serialized bearer-like artifact;
- compromise one application actor without automatically compromising the sidecar;
- crash a consumer after local persistence and before ACK, or after ACK-related network activity;
- force broker redelivery;
- operate a store-now-decrypt-later strategy against classical-only transport.

## Out of scope for this base implementation

- compromise of the host kernel or hypervisor;
- malicious compiler/toolchain;
- compromised authenticators with extracted WebAuthn private keys;
- proof that a placeholder PQ provider is quantum resistant.

## Controls

| Threat | Control |
| --- | --- |
| replay | JTI/message-id/session replay guard + idempotent state |
| token theft | DPoP-style proof of possession |
| MITM | mutually authenticated TLS channel |
| duplicate delivery | linear local capability + durable dedupe + CRDT |
| ack-before-state | LocalAppendReceipt requirement |
| actor key exfiltration | sidecar-owned opaque handles |
| post-quantum harvesting | hybrid PQ provider target |

## Failure semantics

A failed cryptographic or semantic check MUST result in no application state transition. A crash after append but before ACK MAY cause redelivery; recovery MUST make that redelivery harmless.
