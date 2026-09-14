---
name: resolve-product
description: Resolve a user product reference to exactly one active Product entity.
---

# ResolveProduct

Use when a Behavior has a product reference but not yet a canonical `product_id`.

Input: a textual or canonical product reference.

Output: one active Product record.

Invariants: never pick arbitrarily among multiple matches; never resolve inactive products; never emit an event. Return internal `Ok(product)` or `Error(cause)` only. The Runtime is the only execution authority.
