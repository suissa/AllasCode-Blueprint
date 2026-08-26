# Tools

Tools are capability providers used by agents and actions when information must be obtained from outside the current domain state. A tool does not own domain knowledge and does not orchestrate flows. It exposes one explicit contract, may be replaced by another provider, and always returns `Ok<T>` or `Error<E>`.

This example contains three replaceable providers: purchase evidence reading, product catalog lookup, and sale terminal reading. Their TypeScript implementations are deterministic in-memory adapters so the example remains executable without external services.
