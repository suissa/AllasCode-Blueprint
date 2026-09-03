# 2flow Grammar

This directory contains the normative grammar for the extended AllasCode `2flow` notation.

The language is intentionally split in two complementary syntactic layers:

1. **Topological layer** — causal sequence, parallel fork/join, failure/compensation routing and human gates.
2. **Execution layer** — event ingress/egress and invocation wiring inside one topological node.

The canonical grammar is defined in `2flow.ebnf`.

## Parsing phases

A conforming parser SHOULD process a `.2flow` source in these phases:

1. lexical analysis;
2. concrete syntax parsing;
3. AST construction;
4. name/ownership resolution;
5. semantic invariant checking;
6. lowering to the AllasCode semantic graph / IR.

Grammar validity alone is not enough. Rules such as "an Agent may invoke only behaviors it owns" and "every executable function resolves only to `Ok<T>` or `Error<E>`" are semantic checks performed after parsing.

## Files

- `2flow.ebnf` — normative EBNF grammar.
- `../lexer/2flow-tokens.md` — tokenization contract.
- `../ast/2flow.md` — canonical AST model.
- `../diagnostics/2flow.md` — parser and semantic diagnostic catalogue.
- `../../../2flow.md` — human-facing language specification and examples.
