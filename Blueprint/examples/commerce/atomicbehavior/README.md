# Semantic AtomicBehavior Types

A Semantic AtomicBehavior Type (SABT) is the smallest independently defined semantic behavior in AllasCode. It is characterized by how it attempts to satisfy a behavior contract, not only by the structural type of the incoming value.

## Core laws

1. Every SABT executes under the shared semantic execution pipeline.
2. Every SABT can terminate only as `Ok<T>` or `Error<E>`.
3. Self-healing is intrinsic to the SABT contract; it is not optional middleware.
4. **Normalization may exist only inside `validate` or `self-healing`.** Domain behavior must never normalize input implicitly.
5. Automatic healing transformations must be reversible or preserve enough provenance for exact rollback/audit.
6. `Error<E>` means the contract could not be satisfied after all allowed automatic healing strategies were exhausted; the payload may request human healing.

## Common pipeline

```text
input
  -> validate
       -> normalization* (validation scope only)
  -> behavior
  -> validate output
       -> normalization* (validation scope only)
  -> if invalid: self-healing
       -> diagnose
       -> normalization/transformation*
       -> revalidate
       -> retry when allowed
  -> Ok<T> | Error<E>
```

`*` means optional and only when justified by the current validation/healing rule.

## Files in each SABT

- `README.md` — human explanation and worked examples.
- `manifest.yml` — semantic identity, input/output behavior types and result contract.
- `config.yml` — runtime limits and enabled healing strategies.
- `schema/` — structural data shapes only.
- `specifications/behavior.yml` — semantic behavior, validation laws and invariants.
- `healing/pipeline.yml` — ordered corrective strategies and escalation rules.
- `formalization/` — optional machine-verifiable formal model.

## Example

`validate-currency-amount/` demonstrates how values such as `"R$ 20,00"` may be tested for CurrencyAmount conformity without making normalization a general execution step.
