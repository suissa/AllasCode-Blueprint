# Commerce Semantic Laws

## Result closure

For every invocable function `f`:

```text
result(f) ∈ { Ok<T>, Error<E> }
```

No third terminal result is valid.

## Healing-before-error

For every Semantic AtomicBehavior Type `b`:

```text
validation_failure(b)
  => attempt_allowed_self_healing(b)
  => Ok<T> | Error<E>
```

A final `Error<E>` means all allowed automatic healing strategies were exhausted or the policy required human intervention.

## Normalization scope

```text
caller(normalize) ∈ { validate, self-healing }
```

Normalization is forbidden in domain behavior and orchestration.

## Reversibility / provenance

For every automatic corrective transformation `t`:

```text
allowed(t) => reversible(t) OR exact_provenance_preserved(t)
```

## Stock invariant

```text
∀ stock: stock.quantity >= 0
```

## Context isolation

```text
Agent(A) may directly read/write only Context(A)
```

Cross-context knowledge must be transferred through the declared result/event protocol.
