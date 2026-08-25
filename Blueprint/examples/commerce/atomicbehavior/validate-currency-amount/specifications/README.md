# ValidateCurrencyAmount Specifications

## Files

- `behavior.yml` — defines the semantic behavior, accepted representations, validation rules, healing rules and terminal result types.

This folder answers "what behavior makes this value valid?" rather than "what structure does this value have?".

Example law:

```yaml
validation:
  normalization_scope: validate-only
```

This prevents normalization from becoming a hidden domain transformation.
