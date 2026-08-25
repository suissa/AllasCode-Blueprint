# ValidateCurrencyAmount Self-Healing

Self-healing is intrinsic to every Semantic AtomicBehavior Type. This folder specializes the common healing pipeline for currency candidates.

## Files

- `pipeline.yml` — ordered healing strategies, revalidation rules, reversibility/provenance requirements and human escalation.

Example:

```yaml
- try:
    strategy: decimal_separator
    reversible: true
  then: revalidate
```

Normalization is legal here because this is the self-healing scope. The original value must remain available so the transformation is reversible or exactly auditable.

If no automatic strategy can satisfy the contract, the AtomicBehavior returns `Error<CurrencyAmountError>`. Human intervention is represented inside that Error payload rather than as a third event type.
