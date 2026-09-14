---
name: commit-stock-reservation
description: Convert the one-unit reservation into the committed inventory decrement.
---

# CommitStockReservation

Use only after the sale is durably registered. Require the reservation to exist, belong to the same trace, remain unreleased and represent quantity `1`. Commit idempotently and prevent negative stock. Return internal `Ok(committed_reservation)` or `Error(cause)` only; never emit an event.
