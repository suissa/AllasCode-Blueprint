# Post-quantum cryptography + DPoP

The Auth/Security bounded context separates proof-of-possession from post-quantum cryptography.

## DPoP

DPoP follows RFC 9449. The proof is a `dpop+jwt` signed with an asymmetric JOSE algorithm (the current implementation intentionally supports ES256 only), embeds a public JWK, and validates `jti`, `htm`, `htu`, `iat`, optional nonce, access-token hash (`ath`), and the RFC 7638 SHA-256 JWK thumbprint bound to `cnf.jkt`.

The access token is opaque and sender-constrained by the stored `cnf.jkt`. Context and capability checks are performed before a protected operation is admitted. Replay detection is keyed by the JWK thumbprint plus proof `jti`. Audit records contain token digests and proof identifiers, never the raw access token, DPoP JWT, or private DPoP key.

DPoP is not made "post-quantum" by inventing a new JOSE `alg`. Post-quantum primitives remain a separate cryptographic capability until interoperable JOSE/OAuth standards exist for them.

## Post-quantum envelope

The post-quantum service uses:

- ML-KEM-768 (FIPS 203) for key encapsulation.
- HKDF-SHA-256 to derive a 256-bit content-encryption key from the KEM shared secret and context binding.
- AES-256-GCM for authenticated payload encryption.
- ML-DSA-65 (FIPS 204) for detached signatures.

ML-KEM is a KEM, not direct payload encryption and not authentication. Its decapsulation deliberately does not signal every wrong-recipient/tampered ciphertext; integrity is therefore determined by the authenticated AES-GCM envelope. Applications that need authenticated sender identity additionally verify an ML-DSA signature or another authenticated protocol.

Every key has `key_id`, monotonically increasing `version`, and lifecycle state `active`, `decrypt-only`, or `retired`. Rotation changes the previous active version to `decrypt-only`, allowing old ciphertext to remain readable until explicit retirement. Only public key material is returned by descriptor APIs or audit evidence.

## 2flow boundary

`AuthManagerAgent` remains the only ManagerAgent. DPoP, post-quantum envelopes, signatures, and rotation are delegated to sub-agents and Tools declared in `agent-flows/Auth.internal-tools.2flow`, and every Tool has explicit `Ok | Error` branches.

## Production notes

This module is an executable reference implementation. Keep TLS 1.3, mTLS where required, secret management/HSM controls, tenant isolation, rate limiting, and existing capability policies. For regulated deployments, prefer independently validated cryptographic modules and pin implementation versions/test vectors. Post-quantum application encryption does not replace transport security.
