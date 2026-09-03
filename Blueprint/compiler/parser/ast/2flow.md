# 2flow AST

This document defines the canonical Abstract Syntax Tree for the extended `2flow` language.

The AST preserves the distinction between **topology** and **execution wiring**. The parser MUST NOT collapse these layers into a single generic edge list because they have different semantic rules and different compilation targets.

## Root

```text
FlowAst
├── name: Identifier
├── topology: TopologyGraphAst
├── executions: ExecutionDeclAst[]
└── source_span: SourceSpan
```

## Topology AST

```text
TopologyGraphAst
└── expression: TopologyExprAst
```

`TopologyExprAst` is a tagged union:

```text
TopologyExprAst =
    NodeRefAst
  | SequenceAst
  | FailureRouteAst
  | ParallelGroupAst
  | HumanGateAst
```

### NodeRefAst

```text
NodeRefAst
├── identity: QualifiedName
└── source_span: SourceSpan
```

Example:

```2flow
StockAgent.DecreaseStock
```

### SequenceAst

```text
SequenceAst
├── from: TopologyExprAst
├── to: TopologyExprAst
└── source_span: SourceSpan
```

Represents `:--:`. This edge is enabled only by successful causal completion.

### FailureRouteAst

```text
FailureRouteAst
├── source: TopologyExprAst
├── target: TopologyExprAst
└── source_span: SourceSpan
```

Represents `!->`. It is a graph edge activated by a failed result and MUST NOT be represented as a third result family.

### ParallelGroupAst

```text
ParallelGroupAst
├── branches: TopologyExprAst[]
├── join_policy: JoinPolicy
└── source_span: SourceSpan
```

Initial `JoinPolicy`:

```text
JoinPolicy = all
```

The AST keeps this explicit so future policies can be added without changing the meaning of `[...]` in existing sources.

### HumanGateAst

```text
HumanGateAst
├── gate: TopologyExprAst
└── source_span: SourceSpan
```

Represents `[? ...]`. It expresses a requirement for external human evidence, not another computational result type.

## Execution AST

```text
ExecutionDeclAst
├── target: QualifiedName
├── statements: ExecutionStmtAst[]
└── source_span: SourceSpan
```

`target` identifies the topological node whose internal wiring is being described.

`ExecutionStmtAst` is a tagged union:

```text
ExecutionStmtAst =
    EventIngressAst
  | EventEgressAst
  | InvocationAst
  | InvocationReceiverAst
  | ResultBranchAst
```

### EventIngressAst

```text
EventIngressAst
├── value: ValueRefAst
└── source_span: SourceSpan
```

Represents:

```2flow
-> PurchaseEvidenceReceived
```

### EventEgressAst

```text
EventEgressAst
├── result: ResultRefAst
└── source_span: SourceSpan
```

Represents:

```2flow
<- Ok<PurchaseRegistered>
```

### InvocationAst

```text
InvocationAst
├── callable: QualifiedName
└── source_span: SourceSpan
```

Represents `->>` from the owner perspective.

### InvocationReceiverAst

```text
InvocationReceiverAst
├── callable: QualifiedName
└── source_span: SourceSpan
```

Represents `<<-` from the owned behavior perspective.

During semantic validation, paired `InvocationAst` and `InvocationReceiverAst` nodes SHOULD resolve to the same callable identity.

## Result AST

```text
ResultRefAst = OkResultAst | ErrorResultAst
```

```text
OkResultAst
├── payload_type: TypeRef
└── source_span: SourceSpan

ErrorResultAst
├── error_type: TypeRef
└── source_span: SourceSpan
```

There is intentionally no generic third `ResultAst` variant.

### ResultBranchAst

Indented result blocks are represented explicitly:

```text
ResultBranchAst
├── result: ResultRefAst
├── statements: ExecutionStmtAst[]
└── source_span: SourceSpan
```

Example:

```2flow
Ok<PurchaseRegistered>
  <- Ok<PurchaseRegistered>
```

## Names and source information

```text
QualifiedName
└── segments: Identifier[]

SourceSpan
├── file
├── start_line
├── start_column
├── end_line
└── end_column
```

Qualified names stay segmented until semantic resolution. This allows the resolver to distinguish owner, context, entity and behavior components without reparsing strings.

## Semantic Resolution Output

After name resolution, the parser AST SHOULD be transformed into a resolved semantic form rather than mutated in place:

```text
ResolvedFlow
├── flow_id
├── topology_nodes[]
├── topology_edges[]
└── executions[]
```

Each resolved node SHOULD include at least:

```text
ResolvedNode
├── semantic_identity
├── owner
├── accepts[]
├── invokes[]
├── emits_ok[]
├── emits_error[]
└── topology_edges[]
```

This resolved model is the bridge from syntax to the Semantic Projection Graph / runtime IR.

## Required AST invariants

1. Topology edges and execution edges remain different node/edge kinds.
2. `!->` never becomes a result variant.
3. `Ok<T>` and `Error<E>` are structurally typed nodes, not strings.
4. `->>` and `<<-` remain distinct syntax nodes until ownership validation finishes.
5. `[...]` preserves branch boundaries and an explicit join policy.
6. `[? ...]` remains a topology construct.
7. Source spans survive every parser node for precise diagnostics.
8. Normalization is not represented as an implicit AST stage; if present in a behavior definition, semantic validation must prove it belongs to `validate` or `self-healing`.
