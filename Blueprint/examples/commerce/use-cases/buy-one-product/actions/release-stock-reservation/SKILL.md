---
name: release-stock-reservation
description: Compensate an uncommitted one-unit stock reservation.
---

# ReleaseStockReservation

Use when the purchase cannot continue after reservation but before stock commit. Release only the reservation bound to the same trace, idempotently. Never use this Action to restore already committed stock. Return internal `Ok(released)` or `Error(cause)`; never publish an event directly.
