---
name: register-sale
description: Persist a one-product sale only after payment authorization.
---

# RegisterSale

Use after successful payment authorization. Persist quantity `1`, authoritative amount/currency, buyer, product, payment reference and trace. Enforce idempotency. Return internal `Ok(sale)` or `Error(cause)` only; never emit a public event.
