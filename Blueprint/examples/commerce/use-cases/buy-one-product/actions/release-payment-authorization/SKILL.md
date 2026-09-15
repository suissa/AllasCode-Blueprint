---
name: release-payment-authorization
description: Compensate an authorization when the purchase cannot commit.
---

# ReleasePaymentAuthorization

Use only as compensation for the authorization created by the same trace. Release idempotently. Never target a different authorization. Return internal `Ok(released)` or `Error(cause)`; never publish an event directly.
