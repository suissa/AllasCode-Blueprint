# Actions

Actions are independently identifiable and invocable domain operations. An Action expresses **what domain operation is requested**, while Semantic AtomicBehaviors express the smallest behaviors used to realize it.

## Required structure

Each Action example may contain:

- `README.md` — human explanation: purpose, inputs, outputs, files and usage example.
- `manifest.yml` — public semantic identity and contract references.
- `config.yml` — internal runtime/binding values.
- `schema/input.yml` — shape of accepted input.
- `schema/output.yml` — shape of successful output payload.
- `schema/error.yml` — shape of error payload when the common result is `Error<E>`.
- `specifications/contract.yml` — preconditions, postconditions and invariants.
- `formalization/` — optional formal laws/proofs when this Action requires them.

Actions do **not** create new result/event categories. Every invocation returns only the shared `Ok<T>` or `Error<E>` declared in `../events/result.yml`.

## Examples

- `register-purchase/` — turns interpreted supplier purchase data into a registered purchase ready for stock entry.
- `resolve-sale-products/` — resolves which products compose a sale detected by the card machine.

Example invocation result:

```yaml
kind: Ok
semantic: PurchaseRegistered
value:
  purchase_id: purchase:2026-0001
```

A domain failure remains an `Error`, even if the payload identifies a more specific semantic reason:

```yaml
kind: Error
semantic: PurchaseRegistrationFailed
error:
  code: SUPPLIER_UNRESOLVED
```
