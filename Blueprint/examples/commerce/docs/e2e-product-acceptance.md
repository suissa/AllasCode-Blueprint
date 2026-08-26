# End-to-end product acceptance

This suite proves the commerce example as one product boundary rather than a collection of isolated modules.

## Required path

WhatsApp/provider event → normalized ingress → semantic understanding/healing → intent effect → persistent events/idempotency → projections → UI read.

The test harness uses persistent in-memory stores and production-shaped adapter boundaries. It never mutates projections or database state to make a scenario pass.

## Scenarios

1. Audio + receipt purchase resolves supplier/items, persists purchase/expense, increases stock and appears in the UI projection.
2. Payment/sale detection creates a pending conversation, the operator supplies products, the sale closes, stock decreases and financial/UI projections update.
3. Invalid or ambiguous input creates a healing/human-confirmation state. Human correction resumes the same business intent.
4. Duplicate webhook/provider IDs are absorbed by the idempotency store and cannot repeat stock or financial effects.
5. Runtime restart reuses persistent conversation, event and idempotency state and resumes without corruption.

## Evidence expectations

Each completed business path emits semantic evidence naming policies, invariants and laws. The acceptance suite asserts externally visible state and never relies on manual store correction.
