---
name: resolve-authoritative-price
description: Resolve the current authoritative price for a resolved Product.
---

# ResolveAuthoritativePrice

Use after product identity is canonical and before any stock or payment effect.

Never trust a price supplied by the caller. Read the price authority configured for the Product and return `Ok(priced_product)` or `Error(cause)` internally. Do not emit events. The Runtime executes the Action and owns all observable event side effects.
