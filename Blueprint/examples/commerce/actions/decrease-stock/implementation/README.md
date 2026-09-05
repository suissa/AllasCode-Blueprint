# DecreaseStock TypeScript Projection

`implementation.ts` verifies all requested quantities before applying any mutation, preserving the invariant that inventory never becomes negative. A `sale_id` is applied at most once.
