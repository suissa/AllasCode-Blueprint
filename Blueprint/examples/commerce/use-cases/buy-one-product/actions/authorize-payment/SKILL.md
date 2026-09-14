---
name: authorize-payment
description: Authorize payment for the authoritative amount of the one-product purchase.
---

# AuthorizePayment

Use only after one stock unit is reserved. The amount and currency must come from authoritative price resolution, never caller input. Bind authorization to `trace_id` and `idempotency_key`. Return internal `Ok(authorization)` or `Error(cause)` only. The Action does not emit events; Runtime owns execution and observable side effects.
