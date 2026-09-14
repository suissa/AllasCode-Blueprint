---
name: reserve-one-stock-unit
description: Reserve exactly one stock unit without committing the decrement.
---

# ReserveOneStockUnit

Use after product and authoritative price resolution.

Require available stock >= 1. Create an idempotent reservation bound to `trace_id` and `product_id`, with quantity fixed to `1`. The reservation is reversible and does not decrement committed stock. Return only internal `Ok(reservation)` or `Error(cause)`; never emit an event.
