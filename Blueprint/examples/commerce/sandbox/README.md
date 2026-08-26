# Commerce Sandbox

The sandbox demonstrates the v1 commerce runtime without production credentials or production data.

Run the complete deterministic demonstration with:

```bash
npm run sandbox:demo
```

The command builds the semantic graph and executes the normal `FlowRuntime` for purchase and sale flows. Only external providers are replaced by sandbox adapters.

## Deterministic seed

`createDeterministicSandboxState()` always creates the same representative baseline: products and stock, a supplier-backed purchase, customer/operator identities, a sale, and financial ledger entries. `resetSandboxState()` returns the exact original state.

## Providers

- `SandboxWhatsAppProvider` produces normalized inbound envelopes and records outbound replies.
- `SandboxPaymentProvider` emits deterministic confirmed-sale events.
- `SandboxFiscalProvider` produces deterministic authorized fiscal identifiers.

No credentials, network calls or production provider state are required.

## Healing scenario

The demo intentionally detects a payment before products are known. It exposes a `waiting-human` state, sends the operator a WhatsApp question through the sandbox provider, and then resumes the same semantic sale path with the human-provided products.

Sandbox mode must not introduce alternate domain behavior. Seed/setup code may initialize the baseline, but business effects during the demo occur through the same semantic runtime paths used outside sandbox mode.
