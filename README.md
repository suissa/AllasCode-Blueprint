# AllasCode Blueprint

## Semantic-First, Proof-Governed, Self-Healing Architecture

AllasCode is an architectural blueprint for building systems in which **domain semantics are the primary source of structure** and implementation is a replaceable consequence of those semantics.

The architecture is designed ultimately for **people who understand the business domain**, not only for people who understand software internals. A domain specialist should be able to describe entities, intents, rules, constraints, invariants and expected behaviors; the platform should resolve those semantic declarations into capabilities, behaviors, actions, flows, execution and evidence.

The central idea is simple:

> **The person who knows the domain defines what must be true and what the system must accomplish. The architecture determines how those semantics can be executed safely.**

This is why AllasCode treats semantic values and their specific behaviors as architectural primitives rather than metadata added after implementation.

---

## Why this architecture exists

Traditional software development assumes that source code is continuously modified as requirements, failures and edge cases appear. AllasCode explores a different model.

Once the architecture reaches **v1.0**, its validated core is intended to become effectively immutable. A developer does not modify an already-valid behavior merely because a new scenario appears. A change to validated behavior requires evidence that its specification is incomplete.

The intended rule is:

```text
Validated Behavior
      ↓
No counterexample
      ↓
Immutable
```

A modification becomes admissible only when a reproducible test demonstrates an input or scenario for which the existing behavioral contract is incomplete or incorrect:

```text
Scenario
  ↓
Test
  ↓
Counterexample / Invalidation Proof
  ↓
Existing behavior proven incomplete
  ↓
New specification or Atomic Action
  ↓
Formal + executable validation
  ↓
Architecture evolves
```

If a developer merely needs additional functionality that does not invalidate an existing contract, the developer creates a **new Atomic Action** instead of changing the validated one.

Therefore:

```text
new capability ≠ mutate old behavior
new capability → new Action
```

The purpose is to make architectural evolution **monotonic whenever possible**: preserve everything already proven correct and add the smallest new behavior necessary to cover the newly demonstrated scenario.

---

# Invalidation Proof-Driven Development — IPDD

We call this development model **Invalidation Proof-Driven Development (IPDD)**.

> **A validated behavior may only be changed after a reproducible counterexample proves that its current specification is incomplete, contradictory or incorrect for a scenario inside its declared domain.**

This differs from ordinary Test-Driven Development and Specification-Driven Development.

```text
TDD
Test → Implementation

Spec-Driven Development
Specification → Implementation

IPDD
Validated Specification
        ↓
Counterexample
        ↓
Invalidation Proof
        ↓
Specification Extension / Correction
        ↓
New Proof Obligations
        ↓
New Validated Version
```

The important artifact is not merely a failing test. The failure must constitute an **invalidation witness**: enough reproducible evidence to demonstrate which declared assumption, invariant, precondition, postcondition or behavior is incomplete.

A production failure can therefore become a development artifact:

```text
Runtime Error
    ↓
Evidence
    ↓
Minimal Reproduction
    ↓
Invalidation Test
    ↓
Missing Behavior Identified
    ↓
New/Corrected Atomic Action
    ↓
Regression Property
```

Once incorporated into the specification and regression suite, that exact class of failure must be rejected, healed or handled before it can reproduce the same invalid system state.

This last statement is intentionally scoped to the **formalized failure class**. IPDD cannot prove that all future unknown failures are impossible; it can make a previously demonstrated counterexample impossible under the assumptions encoded by the new specification and tests.

---

## Autopoietic and syntropic direction

The architectural objective goes beyond self-healing at runtime. AllasCode is designed toward systems that use failures as structured inputs for improving their own behavioral model.

We use **autopoietic** here as an architectural design direction: the system maintains and reconstructs its operational organization through its own declared behaviors, supervisors, state reconstruction, healing flows and generated artifacts.

We use **syntropic** as a project term for evolution toward increasingly constrained, coherent and correct behavior: observed disorder is converted into evidence, evidence into specification, and specification into stronger future constraints.

```text
Unexpected Failure
      ↓
Observation
      ↓
Evidence
      ↓
Invalidation Proof
      ↓
Semantic Correction
      ↓
New Invariant / Behavior
      ↓
Regression Guarantee
      ↓
More constrained future state space
```

The intended property is therefore not simply resilience:

> **Every classified and incorporated failure should reduce the space in which that same failure class can occur again.**

This is the bridge between AllasCode's **Intent-Based Healing** during execution and **Invalidation Proof-Driven Development** during architectural evolution.

---

## Architecture in one flow

```text
Human Domain Knowledge
        ↓
Expression
        ↓
Intent
        ↓
Semantic Context
        ↓
Entity Resolution
        ↓
Parameters
        ↓
Specification
        ↓
Capability
        ↓
AtomicBehavior
        ↓
Atomic Action
        ↓
Actor + Supervisor
        ↓
Execution
        ↓
Effect
        ↓
Event
        ↓
Evidence / Proof
        ↓
Observation
        ↓
Evaluation
        ├── Success → Settlement
        └── Error   → Self-Healing
                         ↓
                 Invalidation Evidence
                         ↓
                         IPDD
```

The architecture separates **what something means** from **how it is executed**.

A Capability describes what can be done. A Skill describes how that capability can be implemented. A Tool exposes an external resource used by a Skill. A Resource represents computational or economic capacity. Context represents the bounded semantic view needed by the current execution. Memory stores information that can be retrieved in future executions. An Atomic Action is the smallest independently executable and recoverable operation.

---

## Semantic immutability

Immutability in AllasCode does not mean freezing binaries forever. It means that an accepted semantic contract cannot be silently rewritten.

```text
Behavior v1
  │
  ├── remains valid → keep v1
  │
  ├── new independent capability → add Action
  │
  └── counterexample invalidates contract
          ↓
       create new validated version
```

Old executions remain explainable because the exact contract, version, Action, evidence and state used by them remain identifiable.

The runtime may replace physical implementations, processes, machines, protocols or storage engines as long as the externally observable semantic contract remains equivalent.

---

## Atomic Actions and AtomicBehavior

An **Atomic Action** is the smallest unit of work that can be executed, observed, validated, retried, healed and resumed independently.

An **AtomicBehavior** is its semantic behavioral contract.

```text
AtomicBehavior
├── canonical identity
├── semantic input type
├── semantic output type
├── preconditions
├── postconditions
├── invariants
├── constraints
├── declared effects
├── evidence requirements
├── failure behaviors
└── version
        ↓
Atomic Action
        ↓
Implementation
```

The architecture is moving toward **Behavior-Typed Algebra**, in which behaviors can be composed and checked according to their semantic types and laws rather than only according to structural function signatures.

Relevant RFC family: [RFC-0192–RFC-0200 — Atomic Action, AtomicBehavior, Behavioral Algebra and Formal Verification](concepts/Semantics/RFCs/INDEX.md).

---

## Micro-skills

Every available Atomic Action has a corresponding **micro-skill** describing how that Action is used.

The Agent should not receive every skill known by the system. The runtime resolves the current Intent and injects only the minimum behavioral knowledge required for that execution.

```text
Intent
  ↓
Required Capabilities
  ↓
Resolved Actions
  ↓
Required Micro-Skills
  ↓
Dynamic Agent Skill
```

This means an Agent can expose many possible behaviors without carrying all their instructions in every inference context.

See [RFC-0164 — Semantic Agent Skill Engine](concepts/Semantics/RFCs/0164-Semantic-Agent-Skill-Engine-Specification.md), [RFC-0203 — Micro-Skill Generation](concepts/Semantics/RFCs/0203-Semantic-Agent-Micro-Skill-Generation-Engine-Specification.md) and [RFC-0204 — Dynamic Skill Injection](concepts/Semantics/RFCs/0204-Semantic-Agent-Dynamic-Skill-Injection-Engine-Specification.md).

---

## Intent is immutable

An Intent describes what must be achieved. Recovery cannot silently replace it with an easier objective.

```text
Intent
  ↓
Execution
  ↓
Error
  ↓
Self-Healing
  ↓
Same Intent
```

If automatic healing cannot satisfy the original Intent while preserving its invariants, execution reaches **Human-in-the-Healing-Loop**.

See [RFC-0173 — Intent Engine](concepts/Semantics/RFCs/0173-Semantic-Agent-Intent-Engine-Specification.md), [RFC-0188 — Self-Healing Orchestration](concepts/Semantics/RFCs/0188-Semantic-Agent-Self-Healing-Orchestration-Engine-Specification.md) and [RFC-0189 — Human-in-the-Healing-Loop](concepts/Semantics/RFCs/0189-Semantic-Agent-Human-in-the-Healing-Loop-Engine-Specification.md).

---

## Event is not evidence

AllasCode explicitly separates communication from proof.

```text
Event
= statement that something occurred

Evidence
= verifiable support for a claim

Proof
= verification that required claims follow from accepted evidence/rules

Settlement
= confirmation that a distributed execution reached its required final state
```

For example, an `Ok` event emitted by an Action does not by itself prove that a downstream consumer actually consumed and applied it. Consumption can produce separate evidence that participates in execution settlement.

See [RFC-0178 — Evidence Engine](concepts/Semantics/RFCs/0178-Semantic-Agent-Evidence-Engine-Specification.md), [RFC-0179 — Proof Engine](concepts/Semantics/RFCs/0179-Semantic-Agent-Proof-Engine-Specification.md), [RFC-0182 — Event Engine](concepts/Semantics/RFCs/0182-Semantic-Agent-Event-Engine-Specification.md) and [RFC-0211 — Execution Settlement](concepts/Semantics/RFCs/0211-Semantic-Agent-Execution-Settlement-Engine-Specification.md).

---

## Exact recovery instead of process restart

The unit of recovery is not necessarily a process, container or Agent. It is the smallest execution boundary whose success has not been proven.

```text
Event Store
+ Snapshot
+ Checkpoint
+ Execution Evidence
       ↓
State Reconstruction
       ↓
Last proven successful Action
       ↓
Resume pending Atomic Action
```

A restarted Agent should therefore be able to continue from the exact Action that did not settle, with previously validated intermediate work preserved when safe.

See [RFC-0214 — State Reconstruction](concepts/Semantics/RFCs/0214-Semantic-Agent-State-Reconstruction-Engine-Specification.md), [RFC-0215 — Event Store](concepts/Semantics/RFCs/0215-Semantic-Agent-Event-Store-Engine-Specification.md), [RFC-0216 — Snapshot](concepts/Semantics/RFCs/0216-Semantic-Agent-Snapshot-Engine-Specification.md) and [RFC-0217 — Checkpoint and Resume](concepts/Semantics/RFCs/0217-Semantic-Agent-Checkpoint-and-Resume-Engine-Specification.md).

---

# Core concepts and RFCs

The RFC collection is the normative/conceptual decomposition of the architecture. The complete catalog is available in [Semantic RFC Index](concepts/Semantics/RFCs/INDEX.md).

| Concept | Responsibility | RFC |
|---|---|---|
| Intent | Immutable semantic objective of an execution | [RFC-0173](concepts/Semantics/RFCs/0173-Semantic-Agent-Intent-Engine-Specification.md) |
| Goal | Desired state used in planning and evaluation | [RFC-0172](concepts/Semantics/RFCs/0172-Semantic-Agent-Goal-Engine-Specification.md) |
| Constraint | Limits the set of valid solutions | [RFC-0174](concepts/Semantics/RFCs/0174-Semantic-Agent-Constraint-Engine-Specification.md) |
| Policy | Governs what is permitted or required | [RFC-0175](concepts/Semantics/RFCs/0175-Semantic-Agent-Policy-Engine-Specification.md) |
| Rule | Deterministic semantic rule execution | [RFC-0176](concepts/Semantics/RFCs/0176-Semantic-Agent-Rule-Engine-Specification.md) |
| Invariant | Property that must remain true | [RFC-0177](concepts/Semantics/RFCs/0177-Semantic-Agent-Invariant-Engine-Specification.md) |
| Identity | Identifies semantic actors/resources | [RFC-0161](concepts/Semantics/RFCs/0161-Semantic-Agent-Identity-Engine-Specification.md) |
| Trust | Evaluates confidence/authority relationships | [RFC-0162](concepts/Semantics/RFCs/0162-Semantic-Agent-Trust-Engine-Specification.md) |
| Capability | What can be done | [RFC-0163](concepts/Semantics/RFCs/0163-Semantic-Agent-Capability-Engine-Specification.md) |
| Skill | How a Capability can be implemented | [RFC-0164](concepts/Semantics/RFCs/0164-Semantic-Agent-Skill-Engine-Specification.md) |
| Tool | External resource used by a Skill | [RFC-0165](concepts/Semantics/RFCs/0165-Semantic-Agent-Tool-Engine-Specification.md) |
| Resource | Computational/economic resources required | [RFC-0166](concepts/Semantics/RFCs/0166-Semantic-Agent-Resource-Engine-Specification.md) |
| Context | Bounded semantic view for current execution | [RFC-0167](concepts/Semantics/RFCs/0167-Semantic-Agent-Context-Engine-Specification.md) |
| Memory | Persisted information available for later retrieval | [RFC-0168](concepts/Semantics/RFCs/0168-Semantic-Agent-Memory-Engine-Specification.md) |
| Knowledge | Validated/structured knowledge used by reasoning | [RFC-0169](concepts/Semantics/RFCs/0169-Semantic-Agent-Knowledge-Engine-Specification.md) |
| Reasoning | Inference over knowledge, context and rules | [RFC-0170](concepts/Semantics/RFCs/0170-Semantic-Agent-Reasoning-Engine-Specification.md) |
| Decision | Governed selection between valid alternatives | [RFC-0171](concepts/Semantics/RFCs/0171-Semantic-Agent-Decision-Engine-Specification.md) |
| Evidence | Verifiable support for claims | [RFC-0178](concepts/Semantics/RFCs/0178-Semantic-Agent-Evidence-Engine-Specification.md) |
| Proof | Verifies required properties from evidence/rules | [RFC-0179](concepts/Semantics/RFCs/0179-Semantic-Agent-Proof-Engine-Specification.md) |
| Provenance | Tracks origin and transformations | [RFC-0180](concepts/Semantics/RFCs/0180-Semantic-Agent-Provenance-Engine-Specification.md) |
| Audit | Reconstructs decisions and execution | [RFC-0181](concepts/Semantics/RFCs/0181-Semantic-Agent-Audit-Engine-Specification.md) |
| Event | Typed semantic communication of occurrences | [RFC-0182](concepts/Semantics/RFCs/0182-Semantic-Agent-Event-Engine-Specification.md) |
| State | Current valid semantic condition | [RFC-0183](concepts/Semantics/RFCs/0183-Semantic-Agent-State-Engine-Specification.md) |
| Effect | Explicit external consequence of execution | [RFC-0184](concepts/Semantics/RFCs/0184-Semantic-Agent-Effect-Engine-Specification.md) |
| Transaction | Coordinates semantic units of change | [RFC-0185](concepts/Semantics/RFCs/0185-Semantic-Agent-Transaction-Engine-Specification.md) |
| Compensation | Semantic reversal/mitigation of realized effects | [RFC-0186](concepts/Semantics/RFCs/0186-Semantic-Agent-Compensation-Engine-Specification.md) |
| Recovery | Selects recovery strategy after failure | [RFC-0187](concepts/Semantics/RFCs/0187-Semantic-Agent-Recovery-Engine-Specification.md) |
| Self-Healing | Attempts to satisfy the same Intent after failure | [RFC-0188](concepts/Semantics/RFCs/0188-Semantic-Agent-Self-Healing-Orchestration-Engine-Specification.md) |
| Human-in-the-Healing-Loop | Final human recovery boundary | [RFC-0189](concepts/Semantics/RFCs/0189-Semantic-Agent-Human-in-the-Healing-Loop-Engine-Specification.md) |
| Supervisor | Supervises isolated execution units | [RFC-0190](concepts/Semantics/RFCs/0190-Semantic-Agent-Supervisor-Engine-Specification.md) |
| Actor Runtime | Isolated Agent execution model | [RFC-0191](concepts/Semantics/RFCs/0191-Semantic-Agent-Actor-Runtime-Engine-Specification.md) |
| Atomic Action | Smallest executable/recoverable unit | [RFC-0192](concepts/Semantics/RFCs/0192-Semantic-Agent-Atomic-Action-Engine-Specification.md) |
| AtomicBehavior Type | Semantic nominal behavior contract | [RFC-0193](concepts/Semantics/RFCs/0193-Semantic-AtomicBehavior-Type-Engine-Specification.md) |
| Behavior-Typed Algebra | Composition and reasoning over behaviors | [RFC-0194](concepts/Semantics/RFCs/0194-Semantic-Behavior-Typed-Algebra-Engine-Specification.md) |
| Behavioral Composition | Composes compatible behaviors | [RFC-0195](concepts/Semantics/RFCs/0195-Semantic-Agent-Behavioral-Composition-Engine-Specification.md) |
| Behavioral Resolution | Resolves compatible semantic behaviors | [RFC-0196](concepts/Semantics/RFCs/0196-Semantic-Agent-Behavioral-Resolution-Engine-Specification.md) |
| Contradiction Detection | Rejects incompatible semantic compositions | [RFC-0197](concepts/Semantics/RFCs/0197-Semantic-Agent-Contradiction-Detection-Engine-Specification.md) |
| Semantic Normal Form | Canonicalizes behavioral expressions | [RFC-0198](concepts/Semantics/RFCs/0198-Semantic-Agent-Normal-Form-Engine-Specification.md) |
| Formal Proof | Generates/verifies proof obligations | [RFC-0199](concepts/Semantics/RFCs/0199-Semantic-Agent-Formal-Proof-Engine-Specification.md) |
| Agda Verification | Machine-checkable formal verification | [RFC-0200](concepts/Semantics/RFCs/0200-Semantic-Agent-Agda-Verification-Engine-Specification.md) |
| Specification | Executable semantic specification | [RFC-0201](concepts/Semantics/RFCs/0201-Semantic-Agent-Specification-Engine-Specification.md) |
| Spec-to-Action | Generates new Actions from unmet specifications | [RFC-0202](concepts/Semantics/RFCs/0202-Semantic-Agent-Spec-to-Action-Transformation-Engine-Specification.md) |
| Micro-Skill | Usage contract generated for each Action | [RFC-0203](concepts/Semantics/RFCs/0203-Semantic-Agent-Micro-Skill-Generation-Engine-Specification.md) |
| Dynamic Skill Injection | Gives an Agent only skills needed now | [RFC-0204](concepts/Semantics/RFCs/0204-Semantic-Agent-Dynamic-Skill-Injection-Engine-Specification.md) |
| Dependency | Resolves semantic/version dependencies | [RFC-0205](concepts/Semantics/RFCs/0205-Semantic-Agent-Dependency-Engine-Specification.md) |
| Binding | Binds semantic contracts to implementations | [RFC-0206](concepts/Semantics/RFCs/0206-Semantic-Agent-Binding-Engine-Specification.md) |
| Routing | Routes typed execution without unnecessary payload inspection | [RFC-0207](concepts/Semantics/RFCs/0207-Semantic-Agent-Routing-Engine-Specification.md) |
| Orchestration | Executes explicit graphs | [RFC-0208](concepts/Semantics/RFCs/0208-Semantic-Agent-Orchestration-Engine-Specification.md) |
| Choreography | Coordinates participants through events | [RFC-0209](concepts/Semantics/RFCs/0209-Semantic-Agent-Choreography-Engine-Specification.md) |
| Messaging | Transport-independent semantic messaging | [RFC-0210](concepts/Semantics/RFCs/0210-Semantic-Agent-Messaging-Engine-Specification.md) |
| Settlement | Proves distributed execution completion | [RFC-0211](concepts/Semantics/RFCs/0211-Semantic-Agent-Execution-Settlement-Engine-Specification.md) |
| Data Plane | Unified semantic persistence plane | [RFC-0212](concepts/Semantics/RFCs/0212-Semantic-Agent-Data-Plane-Engine-Specification.md) |
| Storage Adapter | Replaces physical stores behind common contracts | [RFC-0213](concepts/Semantics/RFCs/0213-Semantic-Agent-Storage-Adapter-Engine-Specification.md) |
| State Reconstruction | Rebuilds exact valid state | [RFC-0214](concepts/Semantics/RFCs/0214-Semantic-Agent-State-Reconstruction-Engine-Specification.md) |
| Event Store | Authoritative immutable event history | [RFC-0215](concepts/Semantics/RFCs/0215-Semantic-Agent-Event-Store-Engine-Specification.md) |
| Snapshot | Consolidated reconstruction accelerator | [RFC-0216](concepts/Semantics/RFCs/0216-Semantic-Agent-Snapshot-Engine-Specification.md) |
| Checkpoint/Resume | Continues from the exact incomplete Action | [RFC-0217](concepts/Semantics/RFCs/0217-Semantic-Agent-Checkpoint-and-Resume-Engine-Specification.md) |
| Cost Governance | Governs computational/API/AI expenditure | [RFC-0218](concepts/Semantics/RFCs/0218-Semantic-Agent-Cost-Governance-Engine-Specification.md) |
| Resource Scheduling | Distributes work according to measured resource cost | [RFC-0219](concepts/Semantics/RFCs/0219-Semantic-Agent-Resource-Scheduling-Engine-Specification.md) |
| Architecture Conformance | Proves an implementation satisfies architecture contracts | [RFC-0220](concepts/Semantics/RFCs/0220-Semantic-Agent-Architecture-Conformance-Engine-Specification.md) |

Earlier RFCs establish the vocabulary and progressively lead into these engine-level specifications. See the [complete RFC index](concepts/Semantics/RFCs/INDEX.md).

---

## For domain experts, not only developers

A commercial system should ultimately be expressible from domain knowledge such as:

```text
Commerce
  → purchases from supplier
  → receives receipt/photo/PIX/audio
  → interprets transaction
  → identifies products, quantities and prices
  → updates stock
  → updates financial state
  → emits events
  → updates projections
  → exposes consultation and management
```

The domain specialist should define concepts such as:

```text
Product
Supplier
Purchase
Payment
Stock
Price
Quantity
Cash Flow
Invoice
Return
```

and behaviors such as:

```text
Purchase.register
Stock.increase
Payment.confirm
Invoice.validate
Product.price.update
```

AllasCode's semantic layer resolves those concepts into the lower-level architecture.

The specialist should not need to know whether the final implementation uses PostgreSQL or another database, NATS or QUIC, one Actor or ten Actors, a local deterministic Action or an LLM-assisted Action. Those are implementation and runtime decisions constrained by the semantic contract.

This is the intended inversion:

```text
Traditional
Developer → Code → Business System

AllasCode
Domain Expert → Semantics → Verified Behaviors → Generated/Resolved Execution
```

---

## What v1.0 means

For AllasCode, `v1.0` should not merely mean “feature complete.” It should mean that the foundational semantic contracts have reached a level at which architectural evolution is governed by proof.

After v1.0:

1. accepted core behavior is not edited casually;
2. new independent functionality is added as new Actions;
3. changes to existing behavior require an invalidating counterexample;
4. the counterexample becomes a permanent regression property;
5. healing captures runtime evidence;
6. state and execution remain reconstructible;
7. architectural conformance is machine-checkable wherever possible;
8. incompatible semantic changes create new versions rather than rewriting history.

The long-term target is a system whose validated behavioral surface becomes increasingly stable while its library of Actions and recovery strategies becomes increasingly capable.

```text
More experience
     ↓
More evidence
     ↓
More invalidation knowledge
     ↓
More precise specifications
     ↓
More recovery behaviors
     ↓
Smaller known failure space
```

That is the architectural objective of **Invalidation Proof-Driven Development** inside AllasCode.

---

## RFCs

The semantic RFC collection is located at [`concepts/Semantics/RFCs`](concepts/Semantics/RFCs/README.md).

- [RFC format and purpose](concepts/Semantics/RFCs/README.md)
- [Complete RFC index](concepts/Semantics/RFCs/INDEX.md)
- [Architecture Conformance Engine — RFC-0220](concepts/Semantics/RFCs/0220-Semantic-Agent-Architecture-Conformance-Engine-Specification.md)

The RFCs exist so that the architecture itself is subject to the same principle as its runtime: **meaning must be explicit before implementation can claim conformance.**
