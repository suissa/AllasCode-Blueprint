# ValidateCurrencyAmount

Validates whether an incoming value can satisfy the semantic behavior type `CurrencyAmount`.

This AtomicBehavior does not globally normalize the value before execution. Normalization is permitted only inside validation or self-healing.

## Example

Incoming value:

```yaml
value: "R$ 20,00"
currency: BRL
```

Validation may internally normalize the representation to test conformity:

```text
"R$ 20,00"
  -> validation-only normalization
  -> 20.00 BRL
  -> behavioral validation
  -> Ok<CurrencyAmount>
```

If a representation cannot satisfy the contract directly, self-healing may try allowed reversible transformations and revalidate it.

## Files

- `manifest.yml` — public semantic identity and result contract.
- `config.yml` — enabled validation/healing strategies.
- `schema/input.yml` — structural input shape.
- `schema/output.yml` — successful semantic value.
- `specifications/behavior.yml` — semantic laws.
- `healing/pipeline.yml` — corrective pipeline.
