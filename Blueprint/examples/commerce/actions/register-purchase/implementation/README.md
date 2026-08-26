# RegisterPurchase TypeScript Projection

`implementation.ts` is the executable TypeScript projection of the `RegisterPurchase` semantic Action. It validates the minimal executable payload, applies idempotent purchase registration, and returns only the `Ok` or `Error` event declared by `manifest.yml`.
