# Books & Scientific Theoretical Foundation

> Status: living theoretical map for the AllasCode Blueprint.
>
> This document records the theoretical sources that have actually been discussed for the project and separates three layers that must not be conflated:
>
> 1. **Source concept** — what a book or paper actually establishes.
> 2. **AllasCode interpretation** — how the concept is translated into this architecture.
> 3. **AllasCode rule or extension** — a project-specific decision that is not automatically endorsed by the cited source.
>
> This distinction is intentional. The literature is used as foundation and formal machinery; it is not used to retroactively claim that every AllasCode mechanism already exists in prior work.

---

## 1. The two books already discussed by the project

The two books explicitly discussed as architectural foundation are:

1. **Software Architecture: The Hard Parts: Modern Trade-Off Analyses for Distributed Architectures** — Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani. O'Reilly, 2021.
2. **Building Evolutionary Architectures: Support Constant Change** — Neal Ford, Rebecca Parsons, Patrick Kua. O'Reilly, 2017.

They play complementary roles in AllasCode:

- **The Hard Parts** provides the decision model: architecture is dominated by coupled trade-offs for which there is usually no universal best answer.
- **Building Evolutionary Architectures** provides the control loop: architecture can be changed continuously if its important characteristics are expressed as executable fitness functions and verified incrementally.

AllasCode combines these ideas into a runtime-centric strategy:

```text
Architectural intent
    -> explicit semantic contract
    -> explicit trade-off dimensions
    -> executable fitness functions
    -> runtime/workload evidence
    -> retain | migrate | replace | heal | reject
```

The important AllasCode extension is that this loop is not limited to static architecture governance. The Runtime and Data Plane are designed to make some architectural decisions **evidence-driven and evolvable during the life of the system**, while preserving semantic contracts.

---

# 2. Software Architecture: The Hard Parts

## 2.1 No universal best practice

### Source concept

The book treats difficult architectural decisions as trade-off problems. In distributed systems, a decision that improves one characteristic commonly degrades another: coupling, latency, consistency, availability, complexity, throughput, operability, cost, evolvability, or coordination overhead.

### AllasCode interpretation

AllasCode therefore avoids declaring one database, one messaging model, one orchestration strategy, or one consistency model as globally optimal.

The relevant decision unit is closer to:

```text
Decision = f(Intent, Semantics, Workload, Constraints, Evidence, Cost, Runtime Context)
```

rather than:

```text
Decision = fixed technology preference
```

### AllasCode rule

A technology is an implementation of a semantic obligation, not the source of that obligation.

### Relationship

**Direct methodological adoption.**

---

## 2.2 Trade-off analysis

### Source concept

Architectural choices should expose what is gained and what is lost instead of being expressed as isolated recommendations.

### AllasCode interpretation

The Data Plane and Runtime should evaluate choices along multiple dimensions simultaneously, for example:

- semantic correctness;
- invariant preservation;
- latency;
- throughput;
- storage cost;
- compute cost;
- consistency/freshness;
- operational complexity;
- recoverability;
- reversibility;
- resource constraints;
- workload fit.

### AllasCode extension

Trade-offs can become machine-evaluable through fitness functions and evidence bundles rather than remaining only in ADR prose.

### Relationship

**Direct + extension.**

---

## 2.3 Coupling as an architectural force

### Source concept

The book distinguishes forms of coupling and shows that distributed decomposition does not automatically reduce coupling. Static dependency, dynamic workflow dependency, data contracts, transaction boundaries, and orchestration can all create different forms of entanglement.

### AllasCode interpretation

AllasCode attempts to minimize knowledge coupling between semantic components:

- Agent does not need to know Action implementation internals;
- AtomicAction Behavior is reusable and only becomes a domain Action when instantiated for an Intent;
- Action selection is resolved from semantic contracts;
- Data projections expose only the properties required by an Intent;
- physical storage engines remain behind Data Plane behavior/adapters;
- Agents are not allowed to directly mutate durable Agent state from an Action.

### Relationship

**Direct conceptual use; specialized implementation.**

---

## 2.4 Architecture quanta and independently evolvable boundaries

### Source concept

The book discusses independently deployable/evolvable architectural units and the coupling forces that determine whether a boundary is truly independent.

### AllasCode interpretation

The closest AllasCode units are:

- Agent;
- AtomicAction Behavior;
- instantiated domain Action;
- semantic Data Plane behavior;
- projection/materializer;
- Runtime module;
- protocol adapter.

The aim is not merely deployment independence, but **semantic isolation with explicit contracts**.

### Relationship

**Adaptation.**

---

## 2.5 Data ownership

### Source concept

Distributed architecture requires explicit data ownership and clarity about which component is authoritative for mutations.

### AllasCode interpretation

The Data Plane distinguishes:

- authoritative write/record state;
- projections optimized for specific reads;
- event history;
- derived representations;
- cache;
- vector/graph/search/analytics representations.

A projection may contain only a subset of Entity properties. Missing data may mean:

1. the projection intentionally does not own/materialize that property;
2. the projection should contain it but is stale;
3. the projection failed to materialize it.

### AllasCode rule

Derived stores are not silently promoted to sources of truth merely because they are faster or closer to a consumer.

### Relationship

**Direct + specialized extension.**

---

## 2.6 Distributed transactions and Sagas

### Source concept

Cross-service workflows cannot generally be treated as one simple local ACID transaction without substantial coordination cost and coupling. Compensating workflows and Sagas are a common alternative.

### AllasCode interpretation

Intent execution is modeled as an explicit workflow with success and error paths. Recovery is semantic and may involve self-healing or compensating Actions rather than pretending the entire distributed execution can be physically rolled back.

### Important distinction

Compensation does not necessarily restore the exact previous physical state. It is a domain operation that semantically repairs or neutralizes an earlier step.

### Relationship

**Direct.**

Scientific foundation: Garcia-Molina & Salem, **Sagas** (1987), discussed later in this document.

---

## 2.7 Orchestration vs choreography

### Source concept

The book analyzes the trade-offs between centralized workflow coordination and event-driven choreography.

### AllasCode interpretation

AllasCode uses explicit Intent/2flow/Runtime orchestration where semantic recovery and ordering need to be visible, while still allowing events to decouple producers from projections and downstream behaviors.

The architecture therefore does not interpret "event-driven" as "all control must be choreography".

### Relationship

**Direct adaptation.**

---

## 2.8 Workflow state ownership

### Source concept

Distributed workflows require clarity about where state lives and who owns the continuation of execution.

### AllasCode interpretation

AllasCode separates:

- durable domain state;
- event history;
- workflow execution state;
- Agent cognitive memory;
- AtomicAction execution state;
- projection state.

This separation is central to exact restart/resume semantics: cognitive memory is not the same thing as execution continuation state.

### Relationship

**Adaptation.**

---

## 2.9 Contracts and stamp coupling

### Source concept

Oversized contracts increase coupling because consumers depend on or transport data they do not actually require.

### AllasCode interpretation

An Intent declares the semantic properties required for its execution. Projections and data requests should return only the necessary semantic surface rather than full Entities by default.

### Relationship

**Direct adaptation.**

---

## 2.10 Polyglot persistence

### Source concept

Different persistence technologies have different strengths and trade-offs.

### AllasCode interpretation

The Data Plane can use specialized engines by semantic role/workload, e.g. relational record, document read models, event history, vector retrieval, graph relationships, search, analytics, trace/log stores, or ledger-like accounting.

The core rule is not "use many databases". It is:

> use specialization only when measured evidence justifies it, while keeping semantics independent from the physical storage technology.

### Relationship

**Direct + evolutionary extension.**

---

# 3. Building Evolutionary Architectures

## 3.1 Guided incremental change

### Source concept

An evolutionary architecture supports guided, incremental change across multiple architectural dimensions.

### AllasCode interpretation

Runtime modules, Action implementations, projections, adapters, and physical stores may evolve while the semantic contract of an Intent remains stable.

### AllasCode rule

Evolution is acceptable only when the relevant semantic obligations and fitness functions remain satisfied.

### Relationship

**Direct adaptation.**

---

## 3.2 Architectural fitness functions

### Source concept

Fitness functions are executable checks that protect important architectural characteristics.

### AllasCode interpretation

Fitness functions are used not only for static architecture rules but also for measured characteristics such as:

- correctness/invariant preservation;
- latency and tail latency;
- throughput;
- memory footprint;
- storage amplification;
- recovery time;
- projection freshness;
- cost;
- reversibility;
- failure behavior;
- resource usage under the real deployment envelope.

### AllasCode extension

Fitness results can become part of an **Evidence Bundle** used by the Runtime/Data Manager to retain, reject, migrate, or replace an implementation.

### Relationship

**Direct + extension.**

---

## 3.3 Atomic and holistic fitness functions

### Source concept

Some fitness functions protect one local property; others evaluate end-to-end characteristics.

### AllasCode interpretation

Examples of atomic checks:

- an AtomicAction Behavior preserves its invariants;
- an adapter implements the required schema contract;
- a projection satisfies its declared data shape;
- an Action sandbox has no forbidden network capability.

Examples of holistic checks:

- an Intent completes within an SLO;
- a failure path reaches a valid healing/compensation outcome;
- data remains semantically consistent across event record and projections;
- total cost remains inside the deployment budget.

### Relationship

**Direct.**

---

## 3.4 Static and dynamic fitness functions

### Source concept

Architecture can be evaluated through both static structure and runtime behavior.

### AllasCode interpretation

Static examples:

- dependency rules;
- schema validity;
- forbidden imports;
- Action contract completeness;
- formal proof obligations.

Dynamic examples:

- benchmark under current workload;
- failure injection;
- restart/recovery behavior;
- projection lag;
- memory usage;
- runtime latency.

### Relationship

**Direct.**

---

## 3.5 Triggered and continual evaluation

### Source concept

Some architectural properties are checked when a change occurs; others are monitored continually.

### AllasCode interpretation

Triggered evaluation can happen on:

- Action creation/update;
- new adapter;
- schema change;
- deployment;
- storage migration.

Continual evaluation can observe:

- latency drift;
- workload shape;
- cost;
- freshness;
- error frequency;
- resource saturation;
- recovery performance.

### Relationship

**Direct.**

---

## 3.6 Evolutionary data

### Source concept

Database/schema decisions are part of architecture and must support safe evolution instead of being treated as static infrastructure.

### AllasCode interpretation

AllasCode extends evolutionary data into an **evolutionary Data Plane** in which:

- semantic contracts remain stable during an evaluation epoch;
- the physical database technology is an implementation variable;
- projections can be rebuilt/replaced;
- adapters isolate storage-specific behavior;
- fitness functions compare candidate implementations;
- migration requires evidence and reversibility.

### Relationship

**Direct foundation + substantial AllasCode extension.**

---

## 3.7 Automated architectural governance

### Source concept

Architecture rules that can be automated should be automated.

### AllasCode interpretation

AllasCode moves governance toward executable artifacts:

- schemas;
- manifests;
- tests;
- invariants;
- proof obligations;
- fitness functions;
- runtime policy;
- evidence.

The goal is to reduce the amount of architecture that exists only as prose and human memory.

### Relationship

**Direct.**

---

# 4. Combined model: complexity containment + evolutionary validation

The two books combine into one of the central AllasCode positions:

> Complexity is not made harmless by pretending it does not exist. It is contained behind stable semantic boundaries, then continuously tested against the trade-offs that justified the complexity in the first place.

This yields the following loop:

```text
Semantic Contract
    |
    v
Candidate Implementation
    |
    v
Trade-off Dimensions
    |
    v
Fitness Suite
    |
    v
Measured Evidence
    |
    +--> satisfies obligations --> retain/promote
    |
    +--> degraded but recoverable --> heal/migrate
    |
    +--> violates obligations --> reject/rollback/replace
```

This is the theoretical basis for the AllasCode idea of **complexity containment**: the Runtime can be internally sophisticated as long as that sophistication does not leak as repeated manual complexity into every developer-facing application path.

---

# 5. Papers already discussed for the Data Plane

This section records papers that were already discussed as relevant to the AllasCode Data Plane. It distinguishes peer-reviewed work from recent preprints.

## 5.1 Kephart & Chess — The Vision of Autonomic Computing

**Jeffrey O. Kephart, David M. Chess. IEEE Computer 36(1), 2003, pp. 41–50. DOI: 10.1109/MC.2003.1160055.**

### Contribution

Autonomic computing proposes systems that manage themselves according to high-level objectives rather than requiring human operators to micromanage every low-level decision.

The classic self-management properties include self-configuration, self-optimization, self-healing, and self-protection.

### Relation to AllasCode

This is a strong theoretical ancestor for:

- agent-managed infrastructure behavior;
- self-healing;
- evidence-driven replacement;
- automatic reconfiguration;
- high-level semantic objectives controlling lower-level mechanisms.

The Data Plane can be interpreted as an autonomic subsystem when it selects or adjusts physical implementations while preserving semantic objectives.

### Relationship

**Direct conceptual foundation.**

### Limitation

Autonomic computing does not define the AllasCode semantic contracts, AtomicAction model, 2flow, Evidence Bundle, or specific Runtime rules. Those are AllasCode mechanisms built on a related self-management principle.

---

## 5.2 Srivastava — Architectural Evolution and Selection Framework for Database Systems in AI-Ready Data Platforms

**Mohit Srivastava, 2026. arXiv:2606.08317. Preprint.**

### Contribution

The paper proposes a systematic cross-paradigm database-selection process based on workload characterization, constraint filtering, and compatibility scoring across multiple architectural dimensions.

### Relation to AllasCode

It strongly matches the Data Plane principle that database choice should emerge from workload and constraints rather than fixed ideology.

Useful dimensions include:

- data model;
- consistency;
- scalability;
- storage layout;
- query model;
- workload fit;
- latency;
- cost;
- operational complexity.

### Relationship

**Strong conceptual support for evidence-driven polyglot selection.**

### Limitation

This is a recent **preprint**, not a mature formal theory or long-established peer-reviewed foundation. It should support design exploration, not be presented as proof that AllasCode's runtime selection mechanism is already scientifically validated.

---

## 5.3 IDSTune — A Multi-Agent Collaborative Framework for Integrated Database System Tuning

**Yiyan Li, Guanli Liu, Renata Borovica-Gajic, Haoyang Li, Zihang Qiu, Xinmei Huang, Andreas Kipf, Cuiping Li, Hong Chen. 2026. arXiv:2607.22031. Preprint.**

### Contribution

IDSTune uses specialized collaborating agents to jointly tune database knobs, indexes, and materialized views instead of optimizing those dimensions independently.

### Relation to AllasCode

It is relevant as evidence that:

- database management can be decomposed into specialized expert roles;
- optimization dimensions interact;
- multi-agent coordination can improve tuning;
- workload and feedback can drive configuration choices.

This resembles the AllasCode view of a Data Plane managed by specialized semantic behaviors/agents rather than one monolithic database manager.

### Relationship

**Adjacent empirical support / architectural analogy.**

### Limitation

IDSTune performs database tuning; it does not formalize AllasCode's semantic ownership, event-driven projections, or runtime architecture.

---

## 5.4 M2 — An Analytic System with Specialized Storage Engines for Multi-Model Workloads

**Kyoseung Koo, Bogyeong Kim, Bongki Moon. 2025. arXiv:2508.02508.**

### Contribution

M2 explores a multi-model analytics architecture with specialized storage engines and query planning across multiple data models.

### Relation to AllasCode

It is directly relevant to the Data Plane's use of specialization by semantic/workload role. It provides evidence that specialized physical representations can outperform one uniform storage engine for heterogeneous workloads.

### Relationship

**Strong architectural parallel.**

### Limitation

M2 is a specific analytics system. AllasCode is broader: it separates semantic ownership, event history, operational projections, vector/graph/search/ledger-like roles, and runtime evolution.

---

# 6. Scientific papers that formalize concepts used by AllasCode

The papers below are important because they give a stronger mathematical or systems-theory basis to concepts that otherwise appear only as engineering advice.

---

## 6.1 Lamport — causal ordering

### Reference

**Leslie Lamport. "Time, Clocks, and the Ordering of Events in a Distributed System." Communications of the ACM 21(7), 1978. DOI: 10.1145/359545.359563.**

### Formal contribution

Defines the `happened-before` relation as a partial order and shows how logical clocks can preserve causal precedence.

Canonical implication:

```text
a -> b  =>  C(a) < C(b)
```

### AllasCode concepts supported

- event ordering;
- causal history;
- event-store reasoning;
- projection freshness;
- restart/recovery dependency;
- causal evidence;
- avoiding semantic dependence on wall-clock timestamps.

### Relationship

**Direct formal foundation.**

---

## 6.2 Herlihy & Wing — linearizability

### Reference

**Maurice Herlihy, Jeannette Wing. "Linearizability: A Correctness Condition for Concurrent Objects." ACM TOPLAS 12(3), 1990. DOI: 10.1145/78969.78972.**

### Formal contribution

A concurrent execution is linearizable if it can be interpreted as a legal sequential history while preserving real-time precedence of non-overlapping operations.

### AllasCode concepts supported

Useful for the subset of state transitions that require strong externally observable consistency, such as:

- unique allocation;
- critical counters;
- settlement-like operations;
- compare-and-swap style coordination;
- transitions that must never be observed out of order.

### Relationship

**Direct for consistency semantics.**

---

## 6.3 Papadimitriou — serializability

### Reference

**Christos H. Papadimitriou. "The Serializability of Concurrent Database Updates." Journal of the ACM 26(4), 1979. DOI: 10.1145/322154.322158.**

### Formal contribution

Provides a theoretical basis for deciding whether a concurrent database history is equivalent to some serial execution.

### AllasCode concepts supported

- authoritative write invariants;
- isolation decisions;
- transaction boundaries;
- reasoning about concurrent mutation of record state.

### Relationship

**Direct.**

---

## 6.4 Härder & Reuter — ACID and recovery

### Reference

**Theo Härder, Andreas Reuter. "Principles of Transaction-Oriented Database Recovery." ACM Computing Surveys 15(4), 1983. DOI: 10.1145/289.291.**

### Contribution

Systematizes transaction processing and recovery principles associated with atomicity, consistency, isolation and durability.

### AllasCode concepts supported

- durable state boundaries;
- commit/recovery semantics;
- distinction between persistent and transient execution state;
- explicit recovery points.

### Relationship

**Direct for database recovery; analogy/adaptation for Action-level recovery.**

### Important limitation

AtomicAction restart is not itself an ACID transaction. AllasCode borrows the discipline of explicit recoverable boundaries, not the database mechanism.

---

## 6.5 Gilbert & Lynch — CAP

### Reference

**Seth Gilbert, Nancy Lynch. "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services." SIGACT News 33(2), 2002. DOI: 10.1145/564585.564601.**

### Formal contribution

Formalizes the impossibility result behind CAP under explicit definitions and a specific distributed-system model.

### AllasCode concepts supported

- distributed projections;
- event delivery under partitions;
- offline-first behavior;
- replicated storage;
- data-plane consistency choices.

### Important limitation

Do not summarize CAP as "pick two of three". The result concerns what can be guaranteed under partition according to the formal model.

### Relationship

**Direct.**

---

## 6.6 Abadi — PACELC

### Reference

**Daniel Abadi. "Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story." IEEE Computer 45(2), 2012. DOI: 10.1109/MC.2012.33.**

### Contribution

Shows that even without partitions, replicated systems often trade consistency against latency.

### AllasCode concepts supported

- fitness dimensions for freshness/latency;
- choice of specialized projections;
- replication behavior;
- context-dependent consistency policy.

### Relationship

**Direct conceptual support.**

---

## 6.7 Shapiro et al. — CRDTs and convergence

### Reference

**Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski. "Conflict-Free Replicated Data Types." SSS 2011, LNCS 6976. DOI: 10.1007/978-3-642-24550-3_29.**

### Formal contribution

Defines families of replicated data structures that converge under explicit algebraic and delivery conditions, using properties such as:

- join-semilattices;
- monotonic state evolution;
- idempotent merge;
- commutative concurrent operations;
- strong eventual consistency.

### AllasCode concepts supported

- offline-first replicated state;
- deterministic reconciliation;
- coordination avoidance when domain semantics permit it.

### Relationship

**Direct when a Data Plane behavior is actually modeled as a CRDT.**

### Limitation

Not every projection or Entity should be a CRDT. Applicability depends on the algebra of the domain operation.

---

## 6.8 Garcia-Molina & Salem — Sagas

### Reference

**Hector Garcia-Molina, Kenneth Salem. "Sagas." ACM SIGMOD, 1987. DOI: 10.1145/38713.38742.**

### Contribution

Models a long-running transaction as smaller transactions with compensating operations.

Simplified form:

```text
T1, T2, ..., Tn
C1, C2, ..., Cn
```

### AllasCode concepts supported

- explicit Intent failure paths;
- compensation;
- self-healing boundaries;
- multi-step distributed workflow;
- avoiding implicit global rollback.

### Relationship

**Direct.**

---

## 6.9 Fagin et al. — formal data exchange and schema mappings

### Reference

**Ronald Fagin, Phokion G. Kolaitis, Renée J. Miller, Lucian Popa. "Data Exchange: Semantics and Query Answering." Theoretical Computer Science 336, 2005. DOI: 10.1016/j.tcs.2004.10.033.**

### Formal contribution

Provides logical semantics for data exchange using concepts such as:

- source-to-target dependencies;
- tuple-generating dependencies;
- chase;
- universal solutions;
- certain answers.

### AllasCode concepts supported

This is particularly strong theoretical support for:

- projection pipelines;
- schema mapping;
- generated adapters;
- semantic transformations;
- migration;
- mapping one Entity representation into specialized physical stores.

### Relationship

**Direct at the mapping level; adaptation for runtime-generated transformation pipelines.**

---

## 6.10 Codd — relational model and logical independence

### Reference

**Edgar F. Codd. "A Relational Model of Data for Large Shared Data Banks." Communications of the ACM 13(6), 1970. DOI: 10.1145/362384.362685.**

### Contribution

Introduces the relational model and separates logical data representation from physical access mechanisms.

### AllasCode concepts supported

A major Data Plane rule follows the same separation principle:

> semantic meaning must not be defined by the storage engine currently used to materialize it.

### Relationship

**Direct historical/foundational support.**

---

## 6.11 Chen — Entity-Relationship conceptual modeling

### Reference

**Peter P. Chen. "The Entity-Relationship Model—Toward a Unified View of Data." ACM TODS 1(1), 1976. DOI: 10.1145/320434.320440.**

### Contribution

Separates conceptual entities, attributes, and relationships from implementation-specific physical schemas.

### AllasCode concepts supported

- semantic Entity vs stored record;
- semantic property vs column/document field;
- relationships as domain meaning rather than storage artifacts;
- multiple materializations of one conceptual Entity.

### Relationship

**Direct at the conceptual-modeling level.**

---

# 7. Formalization matrix

| AllasCode concept | Main foundation | Strength |
|---|---|---|
| Architecture as explicit trade-offs | *Software Architecture: The Hard Parts* | Direct |
| Complexity containment behind stable boundaries | *The Hard Parts* + AllasCode extension | Adaptation |
| Dynamic/semantic decoupling | *The Hard Parts* | Adaptation |
| Data ownership | *The Hard Parts* | Direct |
| Distributed workflow compensation | *The Hard Parts* + Garcia-Molina & Salem | Direct |
| Orchestration/choreography choice | *The Hard Parts* | Direct |
| Polyglot persistence | *The Hard Parts* | Direct |
| Guided incremental evolution | *Building Evolutionary Architectures* | Direct |
| Fitness functions | *Building Evolutionary Architectures* | Direct |
| Continuous architectural governance | *Building Evolutionary Architectures* | Direct |
| Evolutionary Data Plane | *Building Evolutionary Architectures* + AllasCode | Strong adaptation |
| Autonomous Data Plane management | Kephart & Chess | Direct conceptual foundation |
| Evidence-driven database selection | Srivastava 2026 | Strong recent support; preprint |
| Multi-agent DB tuning | IDSTune 2026 | Adjacent empirical support; preprint |
| Specialized multi-model storage | M2 2025 | Strong architectural parallel |
| Causal event ordering | Lamport 1978 | Formal/direct |
| Linearizable operations | Herlihy & Wing 1990 | Formal/direct |
| Serializable mutation | Papadimitriou 1979 | Formal/direct |
| Durable transactional recovery | Härder & Reuter 1983 | Formal/direct |
| Partition trade-offs | Gilbert & Lynch 2002 | Formal/direct |
| Consistency/latency trade-off | Abadi 2012 | Direct |
| Convergent replicated data | Shapiro et al. 2011 | Formal/direct |
| Compensating distributed workflows | Garcia-Molina & Salem 1987 | Direct |
| Formal projection/schema mapping | Fagin et al. 2005 | Formal/direct |
| Logical/physical data independence | Codd 1970 | Formal/foundational |
| Conceptual Entity modeling | Chen 1976 | Foundational |

---

# 8. What is original or substantially extended in AllasCode

The literature above supports pieces of the architecture. It does **not** by itself define the full AllasCode model.

The following should be presented as project-specific compositions or extensions unless a future formal literature review identifies a closer prior formalization:

- Intent as the immutable macro semantic unit that instantiates domain Actions;
- AtomicAction Behavior as the reusable behavior definition that only becomes a domain Action in an Intent context;
- one generated micro-skill per available AtomicAction Behavior;
- dynamically generated Agent skill surface containing only the behaviors required by the current Intent;
- mandatory Ok/Error consequence model for Actions;
- self-healing pipeline chained to Human-in-the-Healing-Loop;
- separation of cognitive memory from exact execution-continuation state;
- restart at the failed atomic execution point rather than restarting the whole Agent/process;
- Evidence Bundle as a first-class input to architecture evolution;
- semantic Data Plane with event subscriptions and projection requests rather than conventional direct CRUD API as the primary interaction model;
- property-level storage specialization driven by semantic data types and measured fitness;
- Runtime-controlled complexity containment: sophisticated internal mechanisms with minimal leaked complexity to application developers;
- use of Semantic Behavior-Typed Algebra/Haskell and Agda proof obligations as part of the architectural validation pipeline.

Academic references must therefore be phrased as **foundation**, **formal machinery**, **ancestor**, **parallel**, or **support**, not as claims that these papers already specify AllasCode.

---

# 9. Data Plane theoretical synthesis

The resulting Data Plane model can be summarized as:

```text
Semantic Entity / Property Contract
        |
        v
Intent-required data semantics
        |
        v
Candidate physical representations
(Postgres / document / event / vector / graph / search / analytics / ledger / ...)
        |
        v
Constraint filtering
        |
        v
Fitness evaluation under current workload/context
        |
        v
Evidence Bundle
        |
        +--> retain
        +--> promote
        +--> defer
        +--> reject
        +--> migrate
        +--> replace
        +--> rollback
```

The theoretical composition behind this is:

```text
Hard Parts
    -> there is no context-free best architecture

Evolutionary Architectures
    -> encode desired properties as executable fitness functions

Autonomic Computing
    -> self-manage lower-level mechanisms from high-level objectives

Database selection/tuning research
    -> evaluate storage/configuration from workload and constraints

Classical distributed-systems/database theory
    -> formally define ordering, consistency, transactions, convergence,
       compensation, mappings, and data independence
```

This combination is closer to the actual AllasCode vision than any one source in isolation.

---

# 10. Bibliography

## Books

- Ford, Neal; Richards, Mark; Sadalage, Pramod; Dehghani, Zhamak. **Software Architecture: The Hard Parts: Modern Trade-Off Analyses for Distributed Architectures.** O'Reilly Media, 2021.
- Ford, Neal; Parsons, Rebecca; Kua, Patrick. **Building Evolutionary Architectures: Support Constant Change.** O'Reilly Media, 2017.

## Peer-reviewed / established scientific foundations

- Codd, E. F. **A Relational Model of Data for Large Shared Data Banks.** Communications of the ACM, 13(6), 1970. DOI: `10.1145/362384.362685`.
- Chen, P. P.-S. **The Entity-Relationship Model—Toward a Unified View of Data.** ACM Transactions on Database Systems, 1(1), 1976. DOI: `10.1145/320434.320440`.
- Lamport, Leslie. **Time, Clocks, and the Ordering of Events in a Distributed System.** Communications of the ACM, 21(7), 1978. DOI: `10.1145/359545.359563`.
- Papadimitriou, C. H. **The Serializability of Concurrent Database Updates.** Journal of the ACM, 26(4), 1979. DOI: `10.1145/322154.322158`.
- Härder, Theo; Reuter, Andreas. **Principles of Transaction-Oriented Database Recovery.** ACM Computing Surveys, 15(4), 1983. DOI: `10.1145/289.291`.
- Garcia-Molina, Hector; Salem, Kenneth. **Sagas.** Proceedings of ACM SIGMOD, 1987. DOI: `10.1145/38713.38742`.
- Herlihy, Maurice; Wing, Jeannette. **Linearizability: A Correctness Condition for Concurrent Objects.** ACM TOPLAS, 12(3), 1990. DOI: `10.1145/78969.78972`.
- Gilbert, Seth; Lynch, Nancy. **Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services.** SIGACT News, 33(2), 2002. DOI: `10.1145/564585.564601`.
- Kephart, Jeffrey O.; Chess, David M. **The Vision of Autonomic Computing.** IEEE Computer, 36(1), 2003, 41–50. DOI: `10.1109/MC.2003.1160055`.
- Fagin, Ronald; Kolaitis, Phokion G.; Miller, Renée J.; Popa, Lucian. **Data Exchange: Semantics and Query Answering.** Theoretical Computer Science, 336, 2005. DOI: `10.1016/j.tcs.2004.10.033`.
- Shapiro, Marc; Preguiça, Nuno; Baquero, Carlos; Zawirski, Marek. **Conflict-Free Replicated Data Types.** SSS 2011, LNCS 6976. DOI: `10.1007/978-3-642-24550-3_29`.
- Abadi, Daniel. **Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story.** IEEE Computer, 45(2), 2012. DOI: `10.1109/MC.2012.33`.

## Recent Data Plane research discussed by the project

- Koo, Kyoseung; Kim, Bogyeong; Moon, Bongki. **M2: An Analytic System with Specialized Storage Engines for Multi-Model Workloads.** arXiv:2508.02508, 2025.
- Srivastava, Mohit. **Architectural Evolution and Selection Framework for Database Systems in AI-Ready Data Platforms.** arXiv:2606.08317, 2026. **Preprint.**
- Li, Yiyan; Liu, Guanli; Borovica-Gajic, Renata; Li, Haoyang; Qiu, Zihang; Huang, Xinmei; Kipf, Andreas; Li, Cuiping; Chen, Hong. **IDSTune: A Multi-Agent Collaborative Framework for Integrated Database System Tuning.** arXiv:2607.22031, 2026. **Preprint.**

---

# 11. Citation policy for future AllasCode documents

When another Blueprint document cites this foundation, use the following discipline:

1. Cite the **book** for the architectural decision method or engineering pattern.
2. Cite the **primary paper** for a formal property when one exists.
3. Cite a **recent preprint** only as recent empirical or architectural evidence, and label it as a preprint.
4. State explicitly when AllasCode is making an original composition or extension.
5. Never imply that a source proves an AllasCode mechanism unless the formal model actually matches.
6. Prefer stable DOI/arXiv identifiers over secondary blog posts.

This keeps the theoretical foundation defensible enough for later papers, RFCs, formal specifications, and publication-oriented documentation.