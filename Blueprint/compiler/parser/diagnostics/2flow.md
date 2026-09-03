# 2flow Diagnostics

Diagnostics are divided into lexical, syntactic and semantic phases. Every diagnostic SHOULD include a stable code and a `SourceSpan`.

## Lexical

### `2F-L001 INVALID_TOKEN`
The lexer found a character sequence that cannot begin a valid 2flow token.

### `2F-L002 AMBIGUOUS_ARROW`
A malformed arrow resembles a valid operator, for example `->-` or `<--`.

### `2F-L003 INVALID_IDENTIFIER`
A name violates the identifier grammar.

## Syntax

### `2F-P001 EXPECTED_FLOW`
The source does not begin with a `flow <Name>` declaration.

### `2F-P002 EXPECTED_TOPOLOGY_NODE`
A topology operator is missing its source or target node.

### `2F-P003 UNTERMINATED_PARALLEL_GROUP`
A `[` group has no closing `]`.

### `2F-P004 UNTERMINATED_HUMAN_GATE`
A `[?` gate has no closing `]`.

### `2F-P005 INVALID_EXECUTION_STATEMENT`
An execution block contains a token that is not `->`, `<-`, `->>`, `<<-` or a result branch.

### `2F-P006 INVALID_RESULT_TYPE`
A result declaration is neither `Ok<T>` nor `Error<E>`.

### `2F-P007 INVALID_INDENTATION`
A nested result statement is not structurally indented under its result branch.

## Semantic

### `2F-S001 UNKNOWN_TOPOLOGY_NODE`
An `execution` declaration targets a node not resolvable in the flow topology.

### `2F-S002 FOREIGN_INVOCATION`
An Agent or Context tries to invoke a behavior owned by another semantic boundary using `->>`.

Example invalid source:

```2flow
execution FinancialAgent.Process
  ->> StockAgent.DecreaseStock
```

Cross-context communication must occur through events at Agent boundaries.

### `2F-S003 INVOCATION_PAIR_MISMATCH`
`->> Foo` and `<<- Bar` occur as one invocation pair but resolve to different callables.

### `2F-S004 RESULT_ALGEBRA_VIOLATION`
An executable behavior exposes a result family other than `Ok<T>` or `Error<E>`.

### `2F-S005 FAILURE_EDGE_AS_RESULT`
`!->` was interpreted or declared as a function result rather than as topology.

### `2F-S006 SEQUENCE_FROM_ERROR`
A normal `:--:` edge is explicitly bound to an `Error<E>` result. Failed results require propagation or a declared recovery/failure route.

### `2F-S007 DUPLICATE_EXECUTION_DECLARATION`
More than one incompatible execution block targets the same canonical topology node.

### `2F-S008 MISSING_EXECUTION_DECLARATION`
A compilation profile requiring executable flows finds a topology node with no execution wiring and no external/runtime binding.

This MAY be a warning for documentation-only profiles.

### `2F-S009 EMPTY_PARALLEL_GROUP`
A parallel group contains fewer than two effective branches.

### `2F-S010 NORMALIZATION_OUTSIDE_ALLOWED_SCOPE`
Normalization is declared as ordinary domain execution rather than inside `validate` or `self-healing`.

### `2F-S011 HUMAN_GATE_AS_THIRD_RESULT`
A human gate was modeled as a result family instead of external evidence that eventually resolves through `Ok<T>` or `Error<E>`.

### `2F-S012 UNRESOLVED_RESULT_PAYLOAD`
The type inside `Ok<T>` or `Error<E>` cannot be resolved in the semantic type system.

## Diagnostic quality

A compiler SHOULD report the source operator and both relevant identities when possible.

Example:

```text
2F-S002 FOREIGN_INVOCATION
FinancialAgent cannot invoke StockAgent.DecreaseStock with ->>.
Use an emitted event from FinancialAgent and an ingress event on StockAgent.
```

Diagnostics SHOULD explain the violated semantic rule rather than merely saying that a token is invalid.
