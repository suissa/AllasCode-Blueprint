# Austral linear contracts

Austral is used as the target for **static linear ownership** of security/event capabilities.

The intended transitions are:

```text
EphemeralPrivateKey! -> SessionBinding!
DpopToken! -> VerifiedDpop!
LinearEvent! -> ClaimedMessage!
ClaimedMessage! + LocalAppendReceipt! -> Acked
```

The `.aui` file is an architectural interface sketch and must be validated against the exact Austral compiler version selected by the project before being treated as buildable API.
