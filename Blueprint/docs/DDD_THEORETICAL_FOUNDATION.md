# Domain-Driven Design as a Theoretical Foundation for AllasCode

> Status: living theoretical map for the AllasCode Blueprint.
>
> This document explains how Domain-Driven Design (DDD) relates to the way systems are modeled and implemented in AllasCode. It deliberately separates:
>
> 1. **DDD source concept** — the concept as established primarily by Eric Evans and later DDD literature.
> 2. **AllasCode interpretation** — how the concept is represented in the Blueprint.
> 3. **AllasCode extension** — project-specific mechanisms that go beyond DDD, especially Agents, Intents, AtomicActions, Event Sourcing, CQRS, semantic routing, self-healing, and runtime infrastructure transparency.
>
> DDD is used here as a business-modeling foundation. CQRS and Event Sourcing are complementary architectural patterns frequently combined with DDD, but they are not treated as if they were definitions of DDD itself.

---

# 1. Why DDD is foundational to AllasCode

Domain-Driven Design starts from a premise that is also central to AllasCode: the system should be organized around the meaning and rules of the business domain rather than around the incidental structure of frameworks, databases, controllers, network protocols, or deployment technology.

AllasCode pushes this principle further by making technical mechanisms progressively more transparent to the person modeling the system.

The intended modeling direction is:

```text
Business language
    -> Domain model
    -> Semantic contracts
    -> Intents and invariants
    -> Behaviors and events
    -> Runtime realization
    -> Physical infrastructure
```

not:

```text
Database/API/framework
    -> tables/controllers/services
    -> business rules forced into the technical structure
```

The AllasCode objective is therefore not merely "to use DDD patterns". It is to preserve the domain model as the primary source of architectural meaning while allowing infrastructure to be selected, generated, evolved, or replaced behind stable semantic contracts.

The practical consequence is that a developer should model concepts such as:

- what exists in the domain;
- what each concept means;
- which identity is stable;
- which state transitions are valid;
- which invariants must always hold;
- which intentions users or Agents may express;
- which domain events are meaningful;
- which contexts own which meanings;
- how contexts relate;
- what information an operation requires and produces.

The developer should not need to begin by deciding:

- which database stores the Entity;
- which projection engine serves a query;
- which message broker moves an event;
- which serialization protocol is used;
- how retries are implemented;
- which runtime component performs recovery;
- whether an internal operation is local or distributed;
- how a projection is rebuilt;
- how infrastructure adapters are wired.

Those are implementation concerns derived from the semantic model and architectural constraints.

---

# 2. Primary DDD references

The primary conceptual reference is:

**Eric Evans. _Domain-Driven Design: Tackling Complexity in the Heart of Software_. Addison-Wesley, 2003.**

Important later elaborations include:

- **Vaughn Vernon. _Implementing Domain-Driven Design_. Addison-Wesley, 2013.**
- **Vaughn Vernon. _Domain-Driven Design Distilled_. Addison-Wesley, 2016.**

The AllasCode interpretation does not assume that every runtime mechanism appears in these books. DDD contributes the modeling discipline; AllasCode contributes its own runtime, semantic, event-driven, agentic, and infrastructure mechanisms.

---

# 3. Strategic Design

## 3.1 Domain

### DDD source concept

The domain is the sphere of knowledge and activity for which the software is built. DDD treats domain understanding as the center of software design.

### AllasCode interpretation

The domain is represented by the complete semantic space described by the Blueprint: Entities, Contexts, Intents, Events, Policies, Constraints, Behaviors, relationships, and vocabulary.

The implementation should follow the model rather than allowing storage schemas or framework conventions to become the de facto domain model.

### AllasCode extension

The semantic domain is machine-readable. Its contracts are intended to be consumed by compilers, Agents, runtime validators, generators, and infrastructure managers.

### Relationship

**Direct conceptual adoption + executable extension.**

---

## 3.2 Subdomains

### DDD source concept

DDD distinguishes subdomains so that a large business domain can be decomposed according to business responsibility and importance. Literature commonly distinguishes core, supporting, and generic subdomains.

### AllasCode interpretation

A large AllasCode system should be decomposed into coherent semantic regions rather than one global object model.

Subdomains help determine:

- where Context boundaries should exist;
- which vocabulary belongs together;
- which Agents or Intents belong to the same business capability;
- which invariants are local;
- which relationships cross semantic boundaries;
- which data should not be shared implicitly.

### AllasCode rule

A technical subsystem is not automatically a subdomain. "Postgres", "Redis", "Kafka", "REST", "authentication controller", or "repository layer" are not business subdomains merely because the implementation contains them.

### Relationship

**Direct.**

---

## 3.3 Bounded Context

### DDD source concept

A Bounded Context is the explicit boundary within which a model and its language have a specific, consistent meaning. The same word can legitimately mean something different in another Context.

### AllasCode interpretation

`Blueprint/contexts/` represents the natural home for explicit semantic boundaries.

A Context defines the scope in which:

- terminology has one meaning;
- Entity semantics are stable;
- invariants apply;
- canonical labels are interpreted;
- Intents are resolved;
- events are understood;
- policies are enforced;
- external concepts are translated before entering the local model.

### AllasCode extension

Bounded Contexts are not only documentation boundaries. They are intended to become enforceable semantic namespaces and compilation/runtime boundaries.

A context may influence:

- semantic resolution;
- visibility;
- capability authorization;
- event interpretation;
- projection ownership;
- adapter generation;
- schema validation;
- compatibility checks.

### Relationship

**Direct + executable extension.**

---

## 3.4 Ubiquitous Language

### DDD source concept

The Ubiquitous Language is the shared language used by domain experts and developers. It should appear consistently in conversation, models, tests, and code.

### AllasCode interpretation

AllasCode makes semantic naming first-class through concepts such as:

- `canonical_label`;
- aliases and synonyms;
- named Entities;
- named Intents;
- named Events;
- explicit semantic types;
- explicit Contexts.

The goal is not merely consistent code naming. The language becomes part of the machine-readable semantic identity of the system.

### Canonical labels

A canonical label acts as a stable semantic identifier for a Behavior or business capability. Aliases may support discovery, natural-language matching, migration, or multilingual/domain terminology, but aliases do not replace canonical identity.

### AllasCode rule

Names must express domain meaning before implementation mechanism.

Prefer:

```text
Order.Submit
Payment.Authorize
Customer.VerifyIdentity
```

rather than names whose primary meaning is infrastructure:

```text
InsertOrderRow
CallPaymentHttp
PublishKafkaMessage
```

### Relationship

**Direct DDD principle + stronger semantic identity mechanism.**

---

## 3.5 Context Map

### DDD source concept

A Context Map makes relationships between Bounded Contexts explicit. DDD describes patterns such as Shared Kernel, Customer/Supplier, Conformist, Anti-Corruption Layer, Open Host Service, and Published Language.

### AllasCode interpretation

Cross-context relationships must be explicit contracts rather than accidental data coupling.

An AllasCode Context Map should be able to express:

- source Context;
- target Context;
- semantic relationship;
- vocabulary translation;
- accepted event contracts;
- compatibility rules;
- ownership direction;
- transformation requirements;
- whether a local model is protected by an Anti-Corruption Layer.

### AllasCode extension

Because semantic contracts are machine-readable, Context Map relationships can eventually be validated by tooling and used for adapter generation.

### Relationship

**Direct + tooling extension.**

---

# 4. Tactical Design

## 4.1 Entity

### DDD source concept

An Entity is defined primarily by continuity of identity rather than only by its current attribute values.

### AllasCode interpretation

`Blueprint/entities/` represents domain concepts whose identity survives state change.

An AllasCode Entity should specify at least:

- semantic identity;
- stable `entity_id` or equivalent technical identity;
- canonical label;
- relevant aliases;
- properties;
- invariants;
- allowed relationships;
- lifecycle/state rules when applicable.

### AllasCode extension

AllasCode separates semantic identity from physical representation. One Entity may have projections in multiple stores while remaining one semantic Entity.

For example, a single Entity may have representations in:

- authoritative Write storage;
- Read projection;
- Cache;
- Vector index;
- Graph projection;
- Search index;
- Analytics store.

Those representations do not create multiple domain Entities.

### Relationship

**Direct + polyglot projection extension.**

---

## 4.2 Value Object

### DDD source concept

A Value Object is defined by its value and semantics rather than a durable independent identity. Value Objects are usually modeled as immutable.

### AllasCode interpretation

Value Objects naturally map to semantic types in the Blueprint.

Examples include concepts such as:

- Money;
- EmailAddress;
- GeographicCoordinate;
- DateRange;
- Percentage;
- Measurement;
- Address when the domain treats it as a value rather than an independently tracked Entity.

A Value Object should carry validation and semantic constraints with the type rather than allowing primitive values to spread unchecked through the system.

### AllasCode extension

Semantic Atomic Data Types can influence storage, validation, serialization, indexing, privacy, and routing rules without leaking those implementation decisions into the domain model.

### Relationship

**Direct + semantic type extension.**

---

## 4.3 Aggregate and Aggregate Root

### DDD source concept

An Aggregate is a consistency boundary containing Entities and Value Objects governed through an Aggregate Root. Invariants that require immediate consistency should be protected within that boundary.

### AllasCode interpretation

AllasCode uses the Aggregate concept as a modeling tool for deciding which invariants require one authoritative mutation boundary.

The Aggregate boundary should answer:

- what must become valid atomically from the domain perspective;
- which Entity controls mutation access;
- which relationships may be eventually consistent instead;
- which external interactions must occur through events rather than direct object mutation.

### Important AllasCode rule

Do not make large Aggregates simply because objects are related.

Relationships, graph edges, projections, or workflow dependencies do not imply one consistency boundary.

### AllasCode extension

The physical transaction mechanism is intentionally abstracted. The same semantic consistency obligation may be implemented differently depending on storage and runtime constraints.

### Relationship

**Direct tactical modeling concept; implementation abstracted.**

---

## 4.4 Domain Event

### DDD source concept

A Domain Event records something meaningful that happened in the domain and that domain experts care about.

### AllasCode interpretation

Domain Events are first-class semantic facts and belong in `Blueprint/events/`.

A useful Domain Event should express past-tense business meaning, not merely a technical notification.

Examples of semantic meaning:

```text
OrderSubmitted
PaymentAuthorized
InventoryReserved
CustomerIdentityVerified
```

### Domain Event vs runtime event

AllasCode must distinguish domain facts from runtime/control events.

A message such as:

```text
SomeAgent.SomeIntent.Ok
SomeAgent.SomeIntent.Error
```

may be an execution/result event used by the A³ runtime and still not be a Domain Event in the DDD sense.

A Domain Event exists because the business meaning is relevant; a runtime event may exist because execution coordination requires it.

They may be related, but they are not automatically identical.

### Relationship

**Direct + explicit event taxonomy.**

---

## 4.5 Domain Service

### DDD source concept

A Domain Service represents domain behavior that does not naturally belong to one Entity or Value Object.

### AllasCode interpretation

Some reusable business Behaviors can play the role of Domain Services when they express domain logic spanning multiple values or Entities without owning persistent identity.

### Important distinction

Not every Action is a Domain Service.

An Action may also be:

- application orchestration;
- infrastructure behavior;
- adapter behavior;
- validation;
- persistence;
- recovery;
- integration.

The classification depends on semantics, not implementation shape.

### Relationship

**Direct concept with selective mapping.**

---

## 4.6 Repository

### DDD source concept

A Repository abstracts access to Aggregates or domain objects so that domain logic is not coupled to persistence mechanics.

### AllasCode interpretation

AllasCode adopts the goal of the Repository pattern but generalizes the abstraction through the Data Plane.

The domain should request semantic data operations rather than address a concrete database engine directly.

### AllasCode extension

The Data Plane may resolve a semantic requirement against specialized physical stores such as:

- Write;
- Read;
- Cache;
- Vector;
- Graph;
- Search;
- Events;
- Analytics;
- WideColumn;
- Log;
- Trace.

Therefore, a traditional one-class-per-aggregate Repository is not required as the universal implementation mechanism.

The preserved DDD principle is:

```text
Domain model must not depend on persistence technology.
```

The AllasCode extension is:

```text
Persistence/query realization may itself be semantically resolved and polyglot.
```

### Relationship

**Goal adopted; implementation generalized.**

---

## 4.7 Factory

### DDD source concept

Factories encapsulate complex creation logic and guarantee that newly created domain objects begin in a valid state.

### AllasCode interpretation

Entity creation, Behavior instantiation, Action construction, and generated adapters should be produced through explicit creation contracts rather than ad hoc construction when invariants or dependencies are non-trivial.

### AllasCode extension

Compiler/runtime generation may act as a higher-level factory mechanism when it materializes domain definitions into executable components.

### Relationship

**Direct principle + generated realization.**

---

## 4.8 Specification

### DDD source concept

A Specification expresses a business predicate that can be composed and evaluated independently.

### AllasCode interpretation

The concept maps naturally to:

- policies;
- constraints;
- invariants;
- validation rules;
- acceptance conditions;
- capability conditions.

The important requirement is that these rules remain semantic and testable rather than disappearing into control-flow code.

### AllasCode extension

Specifications can become executable obligations checked by compiler, tests, runtime validation, acceptance gates, or proof/evidence mechanisms.

### Relationship

**Direct + executable contract extension.**

---

# 5. DDD and the AllasCode A³ model

AllasCode introduces the Agent-Actor-Action model, which is not a DDD construct. The correct relationship is complementary rather than one-to-one.

## 5.1 Agent

An Agent coordinates behavior toward an Intent and may maintain cognitive/execution-related context according to AllasCode rules.

DDD does not define an Agent abstraction. The Agent is therefore an AllasCode runtime/application concept operating over the domain model.

A useful interpretation is:

```text
DDD answers: what does the business mean?
AllasCode Agent answers: how is an expressed Intent coordinated against that meaning?
```

---

## 5.2 Intent

An Intent represents the desired semantic outcome.

This aligns strongly with DDD's focus on business capability and domain language, but Intent is an AllasCode abstraction.

An Intent should be named in the Ubiquitous Language and should expose:

- required input semantics;
- desired outcome;
- invariants;
- allowed Behaviors/skills;
- success semantics;
- failure/recovery semantics.

Intent therefore becomes a bridge between the domain model and execution.

---

## 5.3 Action

An Action is an independently supervised executable operation in AllasCode.

Its relationship to DDD depends on what it represents:

- a domain operation;
- a Domain Service;
- an application orchestration step;
- an integration operation;
- an infrastructure operation;
- a recovery operation.

DDD should determine the business meaning. The A³ runtime determines the execution contract.

---

## 5.4 Actor

The Actor is an AllasCode runtime coordination boundary connecting an Agent with one or more Actions and participating in local event-sourced execution semantics.

It has no direct equivalent in classic DDD.

The important architectural rule is that runtime execution mechanics must not redefine domain meaning.

---

# 6. DDD and Event Sourcing

## 6.1 Relationship

Event Sourcing stores state as a sequence of events from which current state can be reconstructed.

It is compatible with DDD because Domain Events can provide a rich model of change, but Event Sourcing is not required by DDD and should not be described as a synonym for DDD.

## 6.2 AllasCode interpretation

AllasCode uses event history for multiple purposes, including:

- authoritative history where configured;
- exact recovery/restart;
- projection construction;
- auditability;
- causal reasoning;
- local Agent/Actor execution state;
- replay and repair.

### Important distinction

The event stream used to resume an AtomicAction or Agent workflow is an execution-state concern even when Domain Events also exist.

Do not assume that every internal execution event is a Domain Event or that every Domain Event is sufficient to reconstruct runtime continuation state.

### Relationship

**Complementary pattern integrated by AllasCode.**

---

# 7. DDD and CQRS

## 7.1 Relationship

CQRS separates models/responsibilities for mutation and query. It is often used with DDD and Event Sourcing, but none implies the others.

## 7.2 AllasCode interpretation

The Data Plane explicitly separates authoritative write behavior from read-optimized projections.

Conceptually:

```text
Command/Intent
    -> authoritative domain mutation
    -> event/history
    -> materialization
    -> specialized read projections
```

This aligns with CQRS by preventing query optimization structures from silently becoming mutation authorities.

### AllasCode extension

Read projections may be specialized by semantic need and physical workload:

- Read document projection;
- Cache;
- Vector;
- Graph;
- Search;
- Analytics;
- other generated projections.

A projection is a representation of an Entity for a purpose, not a duplicate source of domain identity.

### Relationship

**Complementary pattern strongly integrated into the Data Plane.**

---

# 8. DDD and Event-Driven Architecture

DDD Domain Events and event-driven infrastructure solve different layers of the problem.

DDD asks:

```text
What happened that matters to the domain?
```

Event-driven architecture asks, among other things:

```text
How do components communicate and react asynchronously?
```

AllasCode combines them while preserving the distinction.

A technical delivery event may transport a Domain Event. A Domain Event may trigger projections, Agents, policies, or other Contexts. But transport metadata, retry events, supervision events, and execution acknowledgements do not become Domain Events merely because they travel through the same broker.

---

# 9. DDD and invariants

DDD tactical design is largely about putting business invariants in the correct consistency boundary.

AllasCode makes invariants explicit artifacts.

An invariant should state something that must remain true, for example:

```text
reserved_quantity <= available_quantity
```

or a semantic rule such as:

```text
A settled payment cannot return to an authorization-pending state.
```

The model should define the invariant independently of the mechanism used to enforce it.

Possible mechanisms include:

- local transaction;
- optimistic concurrency;
- compare-and-swap;
- Actor serialization;
- event-version checks;
- policy evaluation;
- self-healing;
- compensation;
- human escalation.

The invariant is domain truth. The enforcement mechanism is architecture.

---

# 10. DDD and Anti-Corruption Layers

## 10.1 DDD source concept

An Anti-Corruption Layer protects a local domain model from the semantics and terminology of another system or Context.

## 10.2 AllasCode interpretation

Protocol adapters, Context translators, mapping Behaviors, schema transformations, and integration Actions can implement an ACL when they translate external concepts into local semantic contracts.

### AllasCode rule

External schemas must not become internal domain models merely because an API already exposes them.

The integration path should be:

```text
External model
    -> translation/ACL
    -> local canonical semantics
    -> local Intent/Entity/Event model
```

not:

```text
External JSON schema
    -> copied everywhere as local business truth
```

### Relationship

**Direct.**

---

# 11. DDD and infrastructure transparency in AllasCode

This is one of the most important AllasCode extensions of the DDD philosophy.

DDD already argues that business modeling should not be dominated by infrastructure. AllasCode attempts to operationalize that separation through semantic compilation and runtime contracts.

## 11.1 What the developer models

The developer should primarily describe:

- Context;
- Ubiquitous Language;
- Entity;
- identity;
- Value Objects / semantic types;
- relationships;
- Aggregates where strong consistency is required;
- Intents;
- invariants;
- policies;
- Constraints;
- Domain Events;
- required Behaviors;
- inputs and outputs;
- failure meaning;
- recovery meaning;
- acceptance criteria.

## 11.2 What AllasCode derives or hides

The platform may derive, generate, select, or manage:

- storage engines;
- indexes;
- projections;
- serialization;
- event transport;
- protocol adapters;
- retry mechanics;
- idempotency infrastructure;
- supervision;
- tracing;
- local execution persistence;
- projection rebuild;
- materialization pipelines;
- runtime validation;
- deployment topology;
- evidence collection.

## 11.3 Design principle

The architecture can be summarized as:

```text
Business semantics are explicit.
Technical realization is replaceable.
```

A physical technology may change without changing the domain model when the semantic contract remains satisfied.

This is the practical meaning of infrastructure transparency in AllasCode.

---

# 12. Mapping table: DDD -> AllasCode

| DDD concept | AllasCode representation | Notes |
|---|---|---|
| Domain | Complete semantic model | Entities, Intents, Events, Contexts, Policies, Constraints, Behaviors |
| Subdomain | Semantic/business capability partition | Helps define Context boundaries |
| Bounded Context | `contexts/` + semantic namespace | Intended to become enforceable |
| Ubiquitous Language | canonical labels, aliases, domain names | Machine-readable semantic vocabulary |
| Context Map | explicit cross-context relationship contracts | Translation and ownership are explicit |
| Entity | `entities/` | Identity survives state change |
| Value Object | semantic type/type definitions | Value semantics and validation |
| Aggregate | consistency boundary | Not every relationship is an Aggregate |
| Aggregate Root | authoritative mutation entry for Aggregate | Domain consistency concept, physical mechanism abstracted |
| Domain Event | `events/` semantic event | Must be distinguished from runtime/control events |
| Domain Service | selected domain Behaviors/Actions | Only when behavior is genuinely domain logic |
| Repository | generalized by Data Plane semantic access | Domain must not depend on concrete persistence |
| Factory | creation contracts/compiler/runtime materialization | Guarantees valid construction |
| Specification | policies, constraints, invariants, acceptance rules | Can become executable obligations |
| Anti-Corruption Layer | adapters/translators/mapping Behaviors | Protects local semantics |
| Published Language | schemas/protocol semantic contracts | Shared external contract |
| Application Service | Agent/Intent orchestration role | Approximate correspondence, not identity |

---

# 13. Mapping table: complementary patterns often used with DDD

| Pattern | AllasCode use | DDD status |
|---|---|---|
| Event Sourcing | history, replay, recovery, projection source, local execution state | Complementary; not required by DDD |
| CQRS | Write authority separated from Read projections | Complementary; not required by DDD |
| Event-Driven Architecture | asynchronous reaction and decoupling | Complementary |
| Saga | distributed semantic compensation | Complementary |
| Actor Model | execution isolation/supervision in A³ | Independent runtime model |
| Polyglot Persistence | specialized physical projections | Infrastructure strategy |
| Semantic routing | resolve implementation from meaning/contracts | AllasCode extension |
| Self-healing | recover failed execution while preserving intent/invariants | AllasCode extension |

---

# 14. Recommended AllasCode domain-modeling workflow

The modeling process should proceed from meaning to execution.

## Step 1 — Establish Ubiquitous Language

Identify domain terms, synonyms, ambiguous words, and canonical labels.

Deliverables:

- canonical vocabulary;
- aliases;
- definitions;
- ownership Context.

## Step 2 — Identify Bounded Contexts

Separate places where the same terms have different meanings or different consistency/ownership rules.

Deliverables:

- Context definitions;
- Context Map;
- translation boundaries.

## Step 3 — Identify Entities and Value Objects

Ask whether each concept has durable identity or is defined only by value.

Deliverables:

- Entity definitions;
- semantic types;
- identity rules;
- relationships.

## Step 4 — Define invariants and consistency boundaries

Determine which rules must hold atomically and which relationships can converge asynchronously.

Deliverables:

- invariants;
- Aggregate boundaries when applicable;
- policies and constraints.

## Step 5 — Define Intents

Describe what users, Agents, systems, or external Contexts want to achieve in domain language.

Deliverables:

- Intent definitions;
- inputs;
- outputs;
- preconditions;
- postconditions;
- failure semantics.

## Step 6 — Define Domain Events

Record facts that matter to the domain.

Deliverables:

- event schemas;
- producer ownership;
- semantic meaning;
- versioning rules.

## Step 7 — Resolve Behaviors and Actions

Determine which domain/application/integration Behaviors are required to fulfill each Intent.

Deliverables:

- required skills;
- AtomicActions;
- success/error contracts;
- recovery semantics.

## Step 8 — Derive technical realization

Only after the semantic model exists should the system decide or generate:

- projections;
- stores;
- indexes;
- brokers/transports;
- adapters;
- deployment/runtime choices.

This ordering preserves domain-first design.

---

# 15. Example of the abstraction boundary

A business rule may state:

```text
An Order can be confirmed only when payment has been authorized and all mandatory items have been reserved.
```

The domain model owns:

- what an Order means;
- what confirmation means;
- what payment authorization means;
- what reservation means;
- the invariant linking these concepts.

The domain model should not need to state:

- which database stores the Order;
- whether reservation is read from MongoDB, Postgres, Redis, or another store;
- which queue delivers the event;
- how many retry attempts occur;
- which serialization library is used;
- how tracing is implemented.

AllasCode infrastructure must satisfy the semantic obligation without becoming the definition of that obligation.

---

# 16. Architectural consequences

Adopting DDD explicitly as a foundation creates several consequences for the Blueprint.

## Positive consequences

- business vocabulary becomes the primary architectural vocabulary;
- Context boundaries become explicit;
- domain identity is separated from storage representation;
- infrastructure replacement becomes safer;
- semantic contracts become testable;
- Agents and Actions operate on explicit business meaning;
- CQRS projections cannot silently redefine write authority;
- Domain Events are distinguished from operational/runtime events;
- integration schemas are prevented from contaminating local models;
- invariants remain visible and reviewable.

## Costs and constraints

- modeling requires active domain analysis rather than CRUD-first scaffolding;
- Context boundaries must be maintained over time;
- semantic versioning becomes important;
- generated infrastructure must preserve domain invariants;
- tooling must distinguish business semantics from runtime mechanics;
- teams must resist using one global canonical model across genuinely different Contexts;
- not every technical event should be promoted to a Domain Event;
- not every relationship should become an Aggregate.

---

# 17. Formal AllasCode principle derived from DDD

The central relationship can be expressed as a separation between semantic obligation and physical realization.

Let:

```text
S = semantic domain specification
I = set of invariants
R = runtime realization
P = physical infrastructure
```

A valid implementation must preserve the semantics and invariants:

```text
Valid(R, P) => satisfies(R, P, S) AND preserves(R, P, I)
```

A technology substitution is acceptable when:

```text
P1 -> P2
```

and the new realization still satisfies:

```text
satisfies(R2, P2, S) AND preserves(R2, P2, I)
```

Therefore the physical technology is not the semantic identity of the system.

This formalizes the AllasCode design principle:

> Domain meaning is stable; technical realization is substitutable subject to semantic and invariant preservation.

---

# 18. DDD concepts AllasCode must not conflate

To keep the theoretical foundation precise, the Blueprint should preserve these distinctions:

1. **DDD != Event Sourcing** — Event Sourcing is optional and complementary.
2. **DDD != CQRS** — CQRS is optional and complementary.
3. **Domain Event != every message** — execution/control messages may not be domain facts.
4. **Entity != database row/document** — an Entity is defined by domain identity.
5. **Aggregate != object graph** — it is primarily a consistency boundary.
6. **Bounded Context != microservice** — a Context is a semantic/model boundary; deployment is a separate decision.
7. **Repository != ORM class** — the important property is persistence abstraction from the domain.
8. **Ubiquitous Language != naming convention** — it is a shared model of meaning.
9. **Domain Service != generic service class** — it contains domain behavior that has no natural Entity/Value Object home.
10. **Infrastructure event != Domain Event** — transport/supervision semantics remain distinct from business semantics.

---

# 19. Conclusion

DDD provides a strong theoretical foundation for the way AllasCode models systems because both approaches make domain meaning the center of software architecture.

AllasCode adopts the core DDD disciplines of:

- strategic decomposition;
- Bounded Contexts;
- Ubiquitous Language;
- Entities;
- Value Objects;
- Aggregates and invariants;
- Domain Events;
- domain-oriented Services;
- Repositories as persistence abstraction;
- Specifications;
- Anti-Corruption Layers;
- explicit model ownership.

AllasCode then extends that foundation with:

- Intent-driven execution;
- Agent-Actor-Action runtime semantics;
- AtomicAction Behaviors;
- CQRS-oriented polyglot projections;
- Event Sourcing for history and recovery;
- semantic routing;
- executable policies and invariants;
- generated adapters;
- self-healing;
- runtime evidence;
- infrastructure transparency.

The resulting architectural direction is:

```text
Model the business explicitly.
Compile the semantics into executable contracts.
Allow infrastructure to change without changing business meaning.
```

That is the role of Domain-Driven Design inside the AllasCode Blueprint.
