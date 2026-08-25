# ValidateCurrencyAmount Schemas

These files describe structural input/output shapes for the Semantic AtomicBehavior Type.

## Files

- `input.yml` — accepts a candidate `value` plus an optional currency hint. `value` is intentionally unconstrained structurally because behavioral validation determines whether the candidate can satisfy `CurrencyAmount`.
- `output.yml` — canonical semantic representation returned inside `Ok<CurrencyAmount>`.

Example candidate:

```yaml
value: "R$ 20,00"
currency: BRL
```

The schema does not normalize this value. Any normalization used to determine conformity exists only inside `validate` or `self-healing`.
