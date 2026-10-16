# Privacy and Security Boundaries

Status: normative cross-cutting architecture contract

## Purpose

Make privacy, authorization, and security properties mandatory across Agents, Actions, events, storage, projections, telemetry, evidence, and external providers. Security controls MUST be enforced at the boundary where access or effects occur, not only described in prompts or UI behavior.

## Purpose-bound access

- Every access to protected data or effectful capability MUST be authorized for the active principal/workload, tenant, purpose, and operation.
- The runtime MUST apply least privilege and deny by default when authorization context is missing, invalid, expired, or inconsistent.
- Authentication, authorization, consent, and business approval are distinct decisions and MUST NOT be conflated.
- An Agent's natural-language claim or a model's output MUST NOT constitute identity proof or authorization evidence.
- Capabilities MUST be constrained by the declared Intent and may not be silently expanded by a healing or retry path.

## Sensitive data boundaries

- Data MUST be classified at ingress and its permitted use, recipients, retention, and redaction policy MUST be explicit.
- Secrets, access tokens, private keys, raw authentication proofs, and unnecessary plaintext personal data MUST NOT appear in logs, traces, metrics, error messages, or public evidence.
- Telemetry SHOULD use opaque identifiers, keyed digests, or minimized attributes rather than raw personal identifiers.
- Decryption MUST occur only within an authorized boundary. Plaintext MUST NOT be copied into a less-trusted projection or observability system without an explicit, reviewed policy.
- Data minimization, purpose limitation, retention, correction/deletion obligations, and auditable access MUST be represented in applicable domain contracts.
- A privacy failure MUST deny or quarantine the operation and emit a minimized security event without reproducing the sensitive payload.

## Cryptographic profiles

Cryptography MUST be selected by an explicit versioned profile for each purpose: transport protection, workload identity, proof-of-possession, data-at-rest/envelope encryption, evidence signing, and key lifecycle. These purposes are not interchangeable.

Profiles MUST define algorithms, parameters, key identifiers/versioning, rotation, retirement, replay protection, downgrade policy, and interoperability vectors. A post-quantum KEM is not itself payload encryption or sender authentication; authenticated encryption and sender identity validation remain separate requirements. Unsupported algorithms or profiles MUST fail closed unless a documented migration policy explicitly permits a safe fallback.

Implementations MUST NOT invent non-standard protocol algorithm identifiers to label an existing standard as post-quantum. The negotiated profile and fallback decision MUST be auditable without recording secret key material.

## Evidence and verifier independence

A component being evaluated MUST NOT be able to alter the acceptance policy, trusted verifier, pinned verifier version, or sealed evidence used to judge its own result. Evidence MUST carry provenance sufficient to identify the relevant contract, implementation build, input/state references, verifier version, and time/source context without exposing unnecessary personal data.

The runtime MUST distinguish a functional result from proof that the result was achieved under authorized capabilities and preserved invariants. See [Intent Integrity Proof](../../docs/INTENT_INTEGRITY_PROOF.md).

## Required conformance scenarios

- missing, expired, wrong-tenant, and wrong-purpose authorization;
- secret/PII redaction in success, error, trace, metric, and healing paths;
- attempt to use a capability not declared by the Intent;
- replay of a proof or request where replay protection is required;
- downgrade to an unsupported or prohibited cryptographic profile;
- key rotation with old ciphertext still within the allowed decrypt-only period;
- tampering with evidence or verifier policy during the execution under test.

## Reference implementation mapping

The AllasCode repository contains relevant candidate modules and tests such as `pii_protection.zig`, `pii_runtime.zig`, `pii_boundary_tests.zig`, `action_observability.zig`, and `docs/LGPD-native.md`. Conformance requires reviewing current behavior and actual test results; filenames alone do not prove coverage.
