# Behavior-Oriented Actor Model for AllasCode

Status: **Normative proposal**  
Scope: Agent / Intent / Behavior / Actor / Action semantics  
Version: 0.1

## 1. Purpose

This document formalizes the AllasCode execution model as a behavior-oriented extension of the Actor Model.

The historical basis is the Actor Model and the behavior-oriented proposal described by Schütz (2003), in which actors are autonomous entities whose roles are expressed by composable behaviors rather than by imperative control sequences. Schütz distinguishes basic/atomic behaviors from composite behaviors, allows behaviors to be conditionally activated, and restricts actors to modifying their own attributes while only observing other actors.

AllasCode adopts those ideas as theoretical antecedents, but extends them with Intent governance, Semantic AtomicBehavior Actions, event choreography, Event Sourcing, supervisors, capabilities, healing, proof obligations, and canonical semantic identity.

The resulting model is not a direct implementation of Schütz's language. It is an AllasCode formalization that uses that work as one element of its theoretical lineage.

---

## 2. Core semantic objects

Let:

- `Ag` be the set of Agents;
- `I` be the set of Intents;
- `B` be the set of Behaviors;
- `Ac` be the set of Actions;
- `Ar` be the set of runtime Actors;
- `E` be the set of Events;
- `S` be the set of local actor states;
- `C` be the set of Capabilities;
- `P` be the set of Proof Obligations.

The primary relations are:

```text
ownsIntent      ⊆ Ag × I
realizes        ⊆ I × B
composes        ⊆ B × Ac
hosts           ⊆ Ar × Ac
belongsTo       ⊆ Ar × Ag
emits           ⊆ (Ag ∪ Ar ∪ Ac) × E
listens         ⊆ (Ag ∪ Ar) × E
hasCapability   ⊆ Ac × C
requiresProof   ⊆ (I ∪ B ∪ Ac) × P
```

The intended execution hierarchy is:

```text
Agent
  └── Intent
       └── Behavior
            └── Action(s)
                 └── independent runtime Actor + Supervisor
```

An AllasCode Actor is runtime glue between exactly one Agent and one or more Actions. Each Action remains an independently supervised execution unit.

---

## 3. Definitions

### 3.1 Agent

An `Agent ∈ Ag` is an autonomous coordinator of Behaviors under Intents.

An Agent:

1. does not expose imperative control over another Agent;
2. selects or continues an Intent from observed semantic events and its own state;
3. coordinates the Behaviors that realize that Intent;
4. maintains cognitive/execution context according to the AllasCode memory model;
5. communicates inter-agent effects through events rather than direct commands, except for explicitly modeled compensatory mechanisms.

### 3.2 Intent

An `Intent ∈ I` is an immutable semantic declaration of a desired domain outcome.

For an intent `i`:

```text
intent_identity(i) = immutable
```

An Intent is not a command and does not identify a procedural implementation. It constrains which Behavior may realize the desired outcome.

### 3.3 Behavior

A `Behavior ∈ B` is a semantic, compositional description of how an Intent can be realized without exposing the internal imperative mechanics of its Actions.

A Behavior may be:

- **atomic**, if it is realized by exactly one Action;
- **composite**, if it is realized by two or more Actions;
- **conditioned**, if activation depends on an Event, predicate, invariant, policy, or other declared semantic condition.

Formally:

```text
AtomicBehavior(b)    ⇔ |actions(b)| = 1
CompositeBehavior(b) ⇔ |actions(b)| ≥ 2
```

A composite Behavior may define sequencing, parallelism, error branches, and compensation through the 2flow DSL, but these control relations remain declarative.

### 3.4 Action

An `Action ∈ Ac` is a **Semantic AtomicBehavior**.

It is the smallest AllasCode behavioral unit that is independently identifiable, contractible, testable, supervised, and executable.

Each Action MUST declare, directly or by referenced artifacts:

- semantic identity;
- input/output contract;
- configuration;
- events listened/emitted;
- invariants;
- capability requirements;
- behavior specification;
- proof obligations where applicable;
- implementation;
- tests;
- recovery/healing expectations.

An Action MUST NOT contain an undeclared external side effect.

### 3.5 Runtime Actor

An `Actor ∈ Ar` is an isolated runtime execution context responsible for one or more Actions on behalf of exactly one Agent.

For every actor `r`:

```text
∃! a ∈ Ag : belongsTo(r, a)
```

The Actor owns its local state and local Event Sourcing boundary.

### 3.6 Event

An `Event ∈ E` is an immutable fact that has occurred.

Events are the primary choreography mechanism between independently executing components.

A component may react to an Event, but the producer does not imperatively control the consumer.

---

## 4. Canonical identity

Every executable semantic element MUST have a stable semantic identity.

For Behaviors, the canonical form is:

```text
{Agent-name}.{Intent-name}
```

For emitted Intent-level results:

```text
{Agent-name}.{Intent-name}.{Type}
```

where:

```text
Type ∈ {Ok, Error}
```

An Action may additionally have a reusable generic identity and a specialized domain identity, as already defined by the AtomicBehavior model.

Example:

```text
Generic Action:      isBetween
Specialized Action:  Payment.amount.isBetween
Behavior:            PaymentAgent.ValidatePayment
Result Event:        PaymentAgent.ValidatePayment.Ok
```

Identity is semantic; implementation language is not part of the identity.

---

## 5. Behavioral composition

Let `actions(b)` return the ordered or partially ordered set of Actions that realizes Behavior `b`.

A composite Behavior is defined as:

```text
b = compose(a1, a2, ..., an)
```

where every `ak ∈ Ac` is independently valid.

Composition MUST NOT weaken any invariant of a constituent Action.

Formally:

```text
∀ a ∈ actions(b), invariant(a) must hold in every reachable execution state of b
```

Parallel composition is allowed only where no declared dependency requires ordering.

Sequential dependency:

```text
a1 ≺ a2
```

means `a2` may observe the accepted output/event of `a1`.

Parallel independence:

```text
a1 || a2
```

is valid only if neither Action requires the uncommitted local mutation of the other.

---

## 6. Event choreography law

AllasCode inter-Agent coordination is choreographic.

For Agents `A` and `B`, the default relation is forbidden:

```text
A → command(B, operation)
```

The normative relation is:

```text
A emits e
B listens e
B independently resolves its applicable Intent
```

Therefore:

```text
Cause(e, B_behavior) ≠ Command(A, B_behavior)
```

An Event may causally trigger another Agent's Behavior without transferring behavioral ownership to the producer.

This preserves autonomy and prevents the caller/callee relationship from becoming the semantic foundation of the multi-agent system.

---

## 7. State ownership law

Each runtime Actor is authoritative only over its own mutable local state.

For actors `r1 != r2`:

```text
write(r1, state(r2)) = forbidden
```

Observation may be permitted through declared read models/events:

```text
observe(r1, projection(state(r2))) = allowed by policy
```

A state transition affecting actor `r2` must be performed by `r2` itself after receiving an admissible Event or observation.

This produces the behavioral rewrite:

```text
ActorA.change(ActorB)
```

into:

```text
ActorA emits Fact
ActorB observes Fact
ActorB changes itself
```

unless a higher-level shared transactional invariant explicitly defines another mechanism.

---

## 8. Action isolation law

Actions execute under least authority.

The default Action capability set is restricted to declared local resources. In the canonical AllasCode runtime, an Action has no implicit network authority.

For every action `a`:

```text
allowed_effect(a, x) ⇔ x ∈ declared_capabilities(a)
```

Any effect not represented by a declared Capability is invalid.

An Action that requires an external effect must obtain it through an explicitly modeled boundary or another semantic component authorized for that capability.

---

## 9. Supervisor law

Every Action execution MUST be supervised.

For every Action instance `a_exec`:

```text
∃! supervisor(a_exec)
```

The Supervisor is responsible for at least:

- detecting non-acceptance;
- retry policy where valid;
- timeout/lease/fencing rules where relevant;
- idempotency enforcement;
- invocation of the self-healing pipeline;
- escalation to Human-in-the-Healing-Loop when machine recovery cannot produce an acceptable result.

An Action failure is therefore not equivalent to returning an unhandled runtime error to the caller.

---

## 10. Result totality

Every valid in-scope Behavior invocation MUST converge to a semantic result state.

At the Intent boundary:

```text
Result(i) ∈ {Ok, Error}
```

`Error` is a semantic outcome and MUST itself enter the healing/governance path; it is not an untyped exception leak.

For recoverable in-scope failures, the runtime proceeds through the declared healing process. Human-in-the-Healing-Loop is the terminal fallback when automated recovery cannot establish acceptance.

Out-of-scope requests may remain outside this guarantee.

---

## 11. Event-Sourced actor state

Actor state is derived from accepted local events.

Let:

```text
history(r) = [e1, e2, ..., en]
```

Then:

```text
state(r) = fold(apply, initial_state(r), history(r))
```

A local state mutation is valid only if its corresponding event is accepted into the actor's local Event Sourcing boundary according to the runtime persistence contract.

This gives the Actor a reproducible state trajectory and enables recovery, idempotency checks, auditability, and causal analysis.

---

## 12. Intent-governed activation

A Behavior MUST NOT execute merely because an Action is technically available.

Execution requires a valid chain:

```text
Observed Event / Input
        ↓
Intent resolution
        ↓
Policy + Capability + Invariant validation
        ↓
Behavior selection
        ↓
Action execution
        ↓
Acceptance
        ↓
Result Event
```

Formally, for an action `a` executed under intent `i`:

```text
execute(a) ⇒
  authorized(i, a)
  ∧ capable(a)
  ∧ invariants_hold(a)
  ∧ behavior_contains(i, a)
```

Technical reachability is never sufficient authorization.

---

## 13. Semantic non-command principle

The semantics of AllasCode are outcome-oriented rather than command-oriented.

An Agent declares or resolves an Intent; it does not encode the identity of another Agent as the imperative recipient of a command.

Therefore the preferred abstraction is:

```text
Intent: Payment.Validate
```

not:

```text
Command: TellPaymentAgentToValidate
```

The runtime may internally dispatch work, but such dispatch is an implementation detail and MUST NOT redefine the domain semantics as imperative cross-Agent control.

---

## 14. Proof obligations

At minimum, an implementation claiming conformance with this model SHOULD provide evidence for the following obligations.

### PO-BOA-001 — Actor state isolation

No Action hosted by Actor `r1` can mutate the private local state of Actor `r2` directly.

### PO-BOA-002 — Intent immutability

An Intent's semantic identity and declared outcome cannot change during one execution instance.

### PO-BOA-003 — Action atomicity

An Action either reaches its declared accepted semantic result or enters the declared healing path; it cannot expose a partially accepted semantic state.

### PO-BOA-004 — Behavioral invariant preservation

Composition of Actions into a Behavior does not violate any constituent Action invariant.

### PO-BOA-005 — Event choreography autonomy

Receiving an Event may trigger resolution, but no external Agent obtains direct write/control authority over the receiving Agent's internal Behavior.

### PO-BOA-006 — Capability confinement

No Action effect occurs outside the Action's declared capability set.

### PO-BOA-007 — Event-Sourced reproducibility

Given the same accepted local event history and compatible runtime version, replay reconstructs an equivalent consolidated actor state.

### PO-BOA-008 — Semantic result totality

Every valid in-scope Behavior invocation eventually produces an `Ok`, an `Error` entering healing, or a Human-in-the-Healing-Loop escalation according to policy.

---

## 15. Conformance invariants

An AllasCode implementation conforms to this proposal only if all mandatory invariants hold:

```text
INV-BOA-001  One runtime Actor belongs to exactly one Agent.
INV-BOA-002  Every executable Action has exactly one Supervisor.
INV-BOA-003  Cross-Agent imperative commands are not the default semantic coordination mechanism.
INV-BOA-004  Actors cannot directly mutate another Actor's private local state.
INV-BOA-005  Every Action is a declared Semantic AtomicBehavior.
INV-BOA-006  Composite Behaviors preserve constituent Action invariants.
INV-BOA-007  Action side effects are capability-bounded.
INV-BOA-008  Actor state changes are represented by accepted local events.
INV-BOA-009  Behavior execution is governed by an Intent.
INV-BOA-010  Intent identity is immutable during execution.
INV-BOA-011  Intent-level outcomes use the canonical Ok/Error event protocol.
INV-BOA-012  Implementation language does not alter semantic identity.
```

---

## 16. Relation to Schütz (2003)

The following elements are adopted as theoretical antecedents, not as normative dependencies:

| Schütz behavior-oriented actor proposal | AllasCode extension |
| --- | --- |
| Actor as autonomous active object | Agent/Actor runtime separation with supervision |
| Basic behavior | Semantic AtomicBehavior / Action |
| Composite behavior | Behavior composed from Actions through declarative flow |
| Conditioned behavior | Event/Intent/policy/invariant-governed activation |
| Actor modifies its own attributes | Actor-private state ownership |
| Asynchronous actor messaging lineage | Event choreography between autonomous Agents |
| Human-oriented behavioral description | Semantic as Code + canonical semantic identity |
| Reusable behavior definitions | Reusable generic Actions plus domain specialization |

The scientific contribution claimed by AllasCode should therefore not be merely “Actor + Behavior”. The differentiating proposal is the integration of behavior composition with Intent governance, semantic atomic Actions, event choreography, Event Sourcing, capability confinement, supervision, healing, and verifiable execution.

---

## 17. Example

Consider a payment validation Intent:

```text
Agent:  PaymentAgent
Intent: ValidatePayment
Behavior canonical_label:
PaymentAgent.ValidatePayment
```

The Behavior may compose:

```text
[
  Payment.amount.isBetween
  Payment.currency.isSupported
]
        ↓
Payment.risk.isAcceptable
```

Equivalent 2flow sketch:

```text
-> PaymentRequested
[
  ->> Payment.amount.isBetween
  ->> Payment.currency.isSupported
]
->> Payment.risk.isAcceptable
<- PaymentAgent.ValidatePayment.Ok

catch
<- PaymentAgent.ValidatePayment.Error
```

Each Action executes inside an independently supervised Action runtime Actor. The Behavior does not directly mutate another Agent. It emits its semantic result; other Agents may independently react to that Event if their own Intent resolution permits it.

---

## 18. References

- Agha, G. *Actors: A Model of Concurrent Computation in Distributed Systems*. MIT Press, 1986.
- Agha, G.; Mason, I. A.; Smith, S. F.; Talcott, C. L. “A Foundation for Actor Computation.” *Journal of Functional Programming*, 1997.
- Schütz, F. *Programação Orientada a Comportamentos baseada no Modelo de Atores*. Dissertação de Mestrado, Universidade Federal de Santa Catarina, 2003. Especially chapters 2–4 and the conclusions concerning basic/composite/conditioned behaviors and actor-local attribute mutation.

## 19. Normative summary

```text
Agent resolves Intent.
Intent governs Behavior.
Behavior composes Actions.
Action is Semantic AtomicBehavior.
Each Action execution is supervised.
Actor owns its local state.
Events choreograph autonomous components.
Capabilities bound effects.
Event Sourcing records accepted state transitions.
Healing absorbs recoverable failures.
Proof obligations make the execution claim testable.
```
