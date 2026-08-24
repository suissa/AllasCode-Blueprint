


```
allascode/
│
├── allascode.semantics/
│   │
│   ├── atomicbehavior/
│   │   │
│   │   ├── actions/
│   │   │   ├── isBetween/
│   │   │   │   ├── manifest.yml
│   │   │   │   ├── config.yml
│   │   │   │   ├── schema/
│   │   │   │   │   ├── input.yml
│   │   │   │   │   ├── output.yml
│   │   │   │   │   └── events.yml
│   │   │   │   ├── specifications/
│   │   │   │   │   ├── valid.yml
│   │   │   │   │   ├── invalid-type.yml
│   │   │   │   │   └── unauthorized-agent.yml
│   │   │   │   ├── events/
│   │   │   │   │   ├── listen/
│   │   │   │   │   │   └── request.yml
│   │   │   │   │   └── emit/
│   │   │   │   │       ├── accepted.yml
│   │   │   │   │       ├── denied.yml
│   │   │   │   │       ├── responded.yml
│   │   │   │   │       └── authorization-requested.yml
│   │   │   │   ├── formalization/
│   │   │   │   │   ├── laws/
│   │   │   │   │   │   └── bounds.law
│   │   │   │   │   ├── rules/
│   │   │   │   │   │   └── typing.rule
│   │   │   │   │   ├── proofs/
│   │   │   │   │   │   └── bounds.prov
│   │   │   │   │   └── evidence/
│   │   │   │   │       └── bounds.valid
│   │   │   │   └── implementation/
│   │   │   │       ├── implementation.ts
│   │   │   │       ├── implementation.rs
│   │   │   │       └── implementation.zig
│   │   │   │
│   │   │   ├── create/
│   │   │   ├── update/
│   │   │   ├── delete/
│   │   │   ├── validate/
│   │   │   └── ...
│   │   │
│   │   ├── validators/
│   │   │   └── ...
│   │   │
│   │   ├── transformers/
│   │   │   └── ...
│   │   │
│   │   ├── intents/
│   │   │   └── ...
│   │   │
│   │   ├── flows/
│   │   │   └── ...
│   │   │
│   │   └── tools/
│   │       └── ...
│   │
│   ├── entities/
│   │   └── ...
│   │
│   ├── contexts/
│   │   └── ...
│   │
│   ├── types/
│   │   └── ...
│   │
│   ├── properties/
│   │   └── ...
│   │
│   ├── events/
│   │   └── ...
│   │
│   ├── capabilities/
│   │   └── ...
│   │
│   └── behavior-typed-formalization/
│       │
│       ├── algebra/
│       │   ├── behavior.agda
│       │   ├── behavior-type.agda
│       │   ├── composition.agda
│       │   ├── specialization.agda
│       │   ├── usage.agda
│       │   └── invocation.agda
│       │
│       ├── laws/
│       │   ├── identity.law
│       │   ├── composition.law
│       │   ├── specialization.law
│       │   ├── usage.law
│       │   └── invocation.law
│       │
│       ├── rules/
│       │   ├── typing.rule
│       │   ├── composition.rule
│       │   ├── specialization.rule
│       │   ├── usage.rule
│       │   └── invocation.rule
│       │
│       ├── proofs/
│       │   ├── identity.prov
│       │   ├── composition.prov
│       │   ├── usage.prov
│       │   └── invocation.prov
│       │
│       └── evidence/
│           ├── identity.valid
│           ├── composition.valid
│           ├── usage.valid
│           └── invocation.valid
│
├── compiler/
│   │
│   ├── parser/
│   │   ├── lexer/
│   │   ├── ast/
│   │   └── diagnostics/
│   │
│   ├── semantic/
│   │   ├── resolver/
│   │   ├── typechecker/
│   │   ├── usage-checker/
│   │   ├── invocation-checker/
│   │   └── invariant-checker/
│   │
│   ├── ir/
│   │   ├── ast/
│   │   ├── core/
│   │   ├── normal-form/
│   │   └── projection-graph/
│   │
│   ├── backends/
│   │   ├── lambda/
│   │   ├── agda/
│   │   ├── prolog/
│   │   ├── pi-calculus/
│   │   ├── haskell/
│   │   ├── zig/
│   │   ├── rust/
│   │   └── typescript/
│   │
│   └── codegen/
│
├── runtime/
│   │
│   ├── actor/
│   │   ├── atomicbehavior/
│   │   ├── lifecycle/
│   │   └── sandbox/
│   │
│   ├── invocation/
│   │   ├── dispatcher/
│   │   ├── authorization/
│   │   ├── policy/
│   │   └── human-in-the-loop/
│   │
│   ├── events/
│   │   ├── bus/
│   │   ├── router/
│   │   └── serialization/
│   │
│   ├── execution/
│   │   ├── deterministic/
│   │   ├── isolation/
│   │   └── timeout/
│   │
│   └── state/
│       ├── event-sourcing/
│       └── projections/
│
├── language/
│   │
│   ├── vieta/
│   │   ├── grammar/
│   │   ├── lexer/
│   │   ├── parser/
│   │   └── syntax/
│   │
│   └── semantic-algebra/
│       ├── grammar/
│       ├── operators/
│       └── notation/
│
├── protocols/
│   │
│   ├── invocation/
│   │   ├── request.yml
│   │   ├── response.yml
│   │   ├── denied.yml
│   │   └── authorization-request.yml
│   │
│   ├── events/
│   ├── agents/
│   ├── tools/
│   └── interoperability/
│
├── agents/
│   │
│   ├── classifier/
│   ├── extractor/
│   ├── planner/
│   ├── authorization/
│   └── adapters/
│
├── schemas/
│   │
│   ├── manifest/
│   ├── atomicbehavior/
│   ├── invocation/
│   ├── events/
│   └── formalization/
│
├── tooling/
│   │
│   ├── cli/
│   ├── linter/
│   ├── formatter/
│   ├── validator/
│   ├── visualizer/
│   ├── generator/
│   └── inspector/
│
├── integrations/
│   │
│   ├── databases/
│   ├── messaging/
│   ├── storage/
│   ├── payments/
│   └── external/
│
├── architecture/
│   │
│   ├── principles/
│   ├── decisions/
│   │   ├── current/
│   │   ├── superseded/
│   │   └── deprecated/
│   ├── state-of-art/
│   │   ├── evaluations/
│   │   ├── benchmarks/
│   │   └── migrations/
│   └── polyglot/
│       ├── language-selection/
│       ├── interoperability/
│       └── projections/
│
├── tests/
│   │
│   ├── semantics/
│   ├── atomicbehavior/
│   ├── compiler/
│   ├── runtime/
│   ├── formalization/
│   ├── protocols/
│   ├── integration/
│   └── golden/
│
├── examples/
│   │
│   ├── minimal/
│   ├── commerce/
│   ├── scheduling/
│   ├── agent-governance/
│   └── polyglot/
│
└── docs/
    ├── concepts/
    ├── architecture/
    ├── semantics/
    ├── formalization/
    ├── languages/
    ├── protocols/
    ├── tutorials/
    └── state-of-art/

```