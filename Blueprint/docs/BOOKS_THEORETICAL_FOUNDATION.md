# Books & Scientific Theoretical Foundation

> Status: living theoretical map for the AllasCode Blueprint.
>
> This document separates three layers that must not be conflated:
>
> 1. **Established scientific or architectural concept** — what the literature actually defines.
> 2. **AllasCode interpretation** — how that concept is translated into this architecture.
> 3. **AllasCode rule** — a project-specific decision that is not automatically endorsed by the cited source.

## 1. Core books already used by the project

### 1.1 Software Architecture: The Hard Parts

**Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani. O'Reilly, 2021.**

This book is one of the main architectural references behind the AllasCode approach of treating architecture as a system of **explicit trade-offs**, especially around distributed data, coupling, orchestration, transactions, contracts, and decomposition.

Relevant concepts used in AllasCode:

| Concept from the book | How it is used in AllasCode | Relationship |
|---|---|---|
| Architecture has no universal “best practice” | Decisions are made per Intent, runtime constraint, data semantics, and measured fitness instead of adopting one universal stack | Direct adaptation |
| Trade-off analysis | Every important decision should expose the dimensions being traded instead of presenting one technology as globally optimal | Direct |
| Entangled architectural dimensions | Changes in consistency, coupling, orchestration, data ownership, latency, reliability and complexity are treated as interacting decisions | Direct |
| Architecture quanta / independently evolvable boundaries | AllasCode seeks strongly isolated Agents, Actions, Data Plane behaviors and runtime capabilities with explicit contracts | Adaptation |
| Static vs dynamic coupling | The architecture reduces static dependency by resolving Actions/Behaviors dynamically from Intents | Adaptation |
| Data ownership | Durable writes have explicit authority; projections are not authoritative copies of the same truth | Direct + specialized extension |
| Distributed transactions | Cross-boundary work is not modeled as one implicit global ACID transaction | Direct |
| Eventual consistency | Read projections and downstream materializations may lag behind the record of truth | Direct |
| Orchestration vs choreography | AllasCode makes workflow control explicit through Intent/2flow/runtime orchestration instead of leaving recovery semantics implicit | Direct adaptation |
| Workflow state ownership | Runtime state, Agent cognitive memory, Action state and durable domain state are intentionally separated | Adaptation |
| Transactional sagas / compensation | Compensation is treated as semantic recovery, not as magical distributed rollback | Direct |
| Contracts and stamp coupling | Intents and projections should request the minimum semantically required data, avoiding oversized payload contracts | Direct adaptation |
| Polyglot persistence | Storage engines are selected according to workload semantics rather than one database for every concern | Direct |
| Data Mesh / data products | Useful as a reference for domain-oriented analytical/data ownership, but AllasCode goes further toward agent-managed projections and semantic routing | Partial adaptation |

The strongest influence of this book on AllasCode is methodological: **complexity is not eliminated; it is made explicit, bounded, measured, and moved into architectural mechanisms that application developers do not need to reproduce manually.**

### 1.2 Building Evolutionary Architectures

**Neal Ford, Rebecca Parsons, Patrick Kua, Pramod Sadalage. O'Reilly, 2nd ed.**

The project uses this book primarily for the idea that architecture should support **guided, incremental change across multiple dimensions**, with automated architectural fitness functions acting as executable constraints.

Relevant concepts used in AllasCode:

| Concept from the book | How it is used in AllasCode | Relationship |
|---|---|---|
| Guided incremental change | Runtime, storage, projections, Actions and infrastructure are intended to evolve without changing the semantic contract of the Intent | Direct adaptation |
| Architectural fitness functions | Benchmark and correctness requirements are encoded as executable criteria rather than static preferences | Direct |
| Atomic vs holistic fitness functions | Some rules validate one Action/storage choice; others validate end-to-end properties such as latency, recovery and cost | Direct |
| Triggered vs continual evaluation | Some checks run during CI/build; others can run continuously against live architecture characteristics | Direct |
| Static vs dynamic fitness functions | Static structure rules coexist with runtime benchmarks and measured operational behavior | Direct |
| Intentional vs emergent fitness functions | Some constraints are predefined; others can be derived when recurring architectural failure patterns emerge | Adaptation |
| Automated architectural governance | Architectural rules should be executable and enforced automatically whenever possible | Direct |
| Incremental delivery | Evolution should occur through small verifiable changes rather than periodic redesigns | Direct |
| Evolvable data | Schema/storage evolution must be treated as part of architecture, not as an isolated DBA concern | Direct |
| Coupling as a measurable constraint | Dependencies between Agents, Actions, data domains, runtime modules and contracts should be measurable | Direct |

### 1.3 How both books combine inside AllasCode

The two books reinforce complementary parts of the same design strategy:

- **Software Architecture: The Hard Parts** explains why architecture is mostly about irreducible trade-offs and coupled decisions.
- **Building Evolutionary Architectures** provides the mechanism for continuously validating whether those trade-offs are still acceptable.

AllasCode extends this into a runtime-centric model:

```text
Architectural decision
    -> explicit trade-off dimensions
    -> executable fitness functions
    -> runtime observation / benchmark
    -> evidence
    -> retain, heal, migrate, or replace implementation
```

This is especially important in the Data Plane: a storage choice should not be permanent merely because it was selected during initial design. The choice can remain valid only while measured properties continue to satisfy the declared architectural intent.

---

## 2. Scientific foundations for concepts already present in the architecture

The books above are engineering references. The following papers provide primary or more formal foundations for several concepts that AllasCode uses.

## 2.1 Causal ordering and event semantics

### Lamport — Time, Clocks, and the Ordering of Events in a Distributed System

**Leslie Lamport, 1978. Communications of the ACM. DOI: 10.1145/359545.359563**

Formal contribution:

- defines the `happened-before` relation;
- models causal ordering as a partial order;
- shows how logical clocks can preserve causal precedence.

Canonical property:

```text
a -> b  =>  C(a) < C(b)
```

### Application in AllasCode

Directly supports:

- event ordering;
- event-store reasoning;
- Agent restart/recovery based on prior causal state;
- projection freshness;
- causal evidence;
- avoiding the assumption that wall-clock timestamps define semantic order.

### Strength of relationship

**Direct.** This paper formalizes a foundational property used whenever AllasCode reasons about causal event history.

---

## 2.2 Linearizability

### Herlihy & Wing — Linearizability: A Correctness Condition for Concurrent Objects

**Maurice Herlihy, Jeannette Wing, 1990. ACM TOPLAS. DOI: 10.1145/78969.78972**

Formal contribution:

A concurrent execution is linearizable when it can be interpreted as a legal sequential history while preserving the real-time precedence of non-overlapping operations.

### Application in AllasCode

Useful for identifying the small set of operations that truly require strong observable consistency, for example:

- unique allocation;
- critical counters;
- settlement-like operations;
- lock/CAS-style coordination;
- state transitions that must not be observed out of order.

### Strength of relationship

**Direct for consistency semantics; indirect for the broader runtime design.**

---

## 2.3 Serializability and transaction isolation

### Papadimitriou — The Serializability of Concurrent Database Updates

**Christos H. Papadimitriou, 1979. Journal of the ACM. DOI: 10.1145/322154.322158**

Formal contribution:

Provides a theoretical basis for determining whether concurrent transaction histories are equivalent to some serial execution.

### Application in AllasCode

Supports reasoning about:

- invariants in the authoritative write model;
- transaction boundaries;
- when weaker isolation is acceptable;
- when concurrency requires stronger guarantees.

### Strength of relationship

**Direct.**

---

## 2.4 ACID and recovery

### Härder & Reuter — Principles of Transaction-Oriented Database Recovery

**Theo Härder, Andreas Reuter, 1983. ACM Computing Surveys. DOI: 10.1145/289.291**

Contribution:

Systematizes transaction processing and recovery principles associated with atomicity, consistency, isolation and durability.

### Application in AllasCode

The paper supports the distinction between:

- durable state;
- transient Action state;
- commit boundaries;
- persisted event history;
- restart/recovery semantics.

### Strength of relationship

**Direct for database recovery; adaptation for Action-level execution recovery.**

AllasCode must not claim that Agent/Action restart is itself an ACID database transaction. The architecture borrows the discipline of explicit recovery boundaries, not the database mechanism itself.

---

## 2.5 CAP

### Gilbert & Lynch — Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services

**Seth Gilbert, Nancy Lynch, 2002. SIGACT News. DOI: 10.1145/564585.564601**

Formal contribution:

Provides the formal impossibility result behind CAP under explicit definitions of consistency, availability and partitions.

### Application in AllasCode

Relevant to:

- distributed projections;
- event delivery;
- offline-first behavior;
- replicated storage;
- broker/data-plane behavior during network partitions.

### Important limitation

AllasCode must not use the simplistic slogan “pick two of three.” The result is conditional on the system model and on what guarantees are required during a partition.

### Strength of relationship

**Direct.**

---

## 2.6 PACELC

### Abadi — Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story

**Daniel Abadi, 2012. IEEE Computer. DOI: 10.1109/MC.2012.33**

Contribution:

Extends the engineering discussion beyond partitions: even when there is no partition, replicated systems often trade latency against consistency.

### Application in AllasCode

This maps strongly to the Data Plane idea of selecting storage and projection behavior by measured characteristics such as:

- latency;
- freshness;
- write cost;
- synchronization delay;
- consistency requirement.

### Strength of relationship

**Direct conceptual support.**

---

## 2.7 CRDTs and convergence

### Shapiro et al. — Conflict-Free Replicated Data Types

**Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski, 2011. SSS/LNCS. DOI: 10.1007/978-3-642-24550-3_29**

Formal contribution:

Defines replicated data structures that converge under explicit algebraic and delivery conditions.

Relevant structures include:

- join-semilattices;
- monotonic state evolution;
- commutative operations;
- strong eventual consistency.

### Application in AllasCode

Applicable where the architecture permits local/offline mutation followed by deterministic reconciliation.

Not every AllasCode projection should be a CRDT. CRDT semantics are appropriate only when the domain operation can be modeled with the required algebraic properties.

### Strength of relationship

**Direct when CRDTs are used; otherwise reference only.**

---

## 2.8 Sagas and compensating operations

### Garcia-Molina & Salem — Sagas

**Hector Garcia-Molina, Kenneth Salem, 1987. ACM SIGMOD. DOI: 10.1145/38713.38742**

Contribution:

Decomposes a long-lived transaction into smaller transactions with explicit compensating operations.

Abstract form:

```text
T1, T2, ... Tn
C1, C2, ... Cn
```

where `Ci` semantically compensates `Ti` when recovery requires it.

### Application in AllasCode

Supports:

- multi-step Intent execution;
- explicit failure paths;
- self-healing chains;
- compensation instead of pretending a distributed workflow has one global rollback.

### Important limitation

A compensation is a domain action, not necessarily restoration of the exact previous physical state.

### Strength of relationship

**Direct.**

---

## 2.9 Formal data exchange and schema mappings

### Fagin, Kolaitis, Miller & Popa — Data Exchange: Semantics and Query Answering

**Ronald Fagin, Phokion G. Kolaitis, Renée J. Miller, Lucian Popa, 2005. Theoretical Computer Science. DOI: 10.1016/j.tcs.2004.10.033**

Formal contribution:

Gives logical semantics to data exchange through concepts such as:

- source-to-target dependencies;
- tuple-generating dependencies;
- chase;
- universal solutions;
- certain answers.

### Application in AllasCode

This is one of the strongest theoretical foundations for the Data Plane's idea that data transformations and projections are explicit semantic mappings rather than arbitrary application code.

Relevant areas:

- projection pipelines;
- schema migration;
- adapter generation;
- data transformation;
- external-system integration;
- conversion between specialized storage representations.

### Strength of relationship

**Direct at the mapping level; adaptation for runtime-generated pipelines.**

---

## 2.10 Relational model and logical independence

### Codd — A Relational Model of Data for Large Shared Data Banks

**Edgar F. Codd, 1970. Communications of the ACM. DOI: 10.1145/362384.362685**

Contribution:

Introduces the relational model and strongly separates logical data representation from physical access mechanisms.

### Application in AllasCode

This separation is conceptually aligned with a major Data Plane rule:

> domain semantics must not be defined by the physical storage engine chosen to materialize a projection.

The same semantic property may be represented differently in Postgres, MongoDB, Redis, Qdrant, Neo4j, ClickHouse, TigerBeetle or another specialized engine.

### Strength of relationship

**Direct historical/foundational support.**

---

## 2.11 Entity-Relationship conceptual modeling

### Chen — The Entity-Relationship Model—Toward a Unified View of Data

**Peter P. Chen, 1976. ACM Transactions on Database Systems. DOI: 10.1145/320434.320440**

Contribution:

Separates conceptual entities, attributes and relationships from implementation-specific physical schemas.

### Application in AllasCode

Supports the distinction between:

- semantic Entity;
- Entity properties;
- relationship semantics;
- materialized database representation.

### Strength of relationship

**Direct at the conceptual modeling level.**

---

## 3. Scientific concepts that closely match AllasCode extensions

The following are not necessarily direct origins of AllasCode ideas, but provide strong scientific parallels or formal machinery that can be reused.

## 3.1 CALM theorem and coordination avoidance

### Ameloot, Neven & Van den Bussche — Relational Transducers for Declarative Networking

The CALM line of work connects monotonicity with coordination-free distributed computation.

### Why it matters

AllasCode can use this foundation to classify data transformations:

- monotonic transformations may be safe to execute without global coordination;
- non-monotonic transformations may require stronger synchronization or explicit ordering.

This is highly relevant to agent-managed projections and transformation pipelines.

### Relationship

**Strong analogy / candidate future formalization.**

---

## 3.2 Event sourcing as state reconstruction

Event sourcing as used in industry is broader than one canonical scientific paper, but its formal core can be related to state-machine replication and event-log semantics.

For AllasCode, the key rule is:

```text
State_n = fold(apply, State_0, Events_1..n)
```

when a state is reconstructable from an authoritative ordered event history.

This provides a clean basis for:

- deterministic rehydration;
- projection rebuild;
- replay;
- auditing;
- state derivation.

AllasCode extends this with the rule that not every runtime or cognitive state must be derived from the domain event store.

---

## 3.3 State-machine replication

### Lamport — The Part-Time Parliament / Paxos family

State-machine replication provides a formal background for replicated deterministic state transitions under consensus.

### Application in AllasCode

Relevant when a critical subsystem needs one globally agreed transition order. It should not be applied everywhere, because global consensus introduces coordination cost.

### Relationship

**Direct for future consensus-backed components; not a default architecture rule.**

---

## 4. Mapping scientific foundations to current AllasCode concepts

| AllasCode concept | Scientific / architectural foundation | Relation |
|---|---|---|
| Event ordering | Lamport 1978 | Direct |
| EventStore as causal history | Lamport 1978 + state-machine/event-log literature | Direct/combined |
| Projection lag/freshness | distributed consistency literature + PACELC | Direct |
| Polyglot persistence | Hard Parts + workload-specific DB literature | Architectural adaptation |
| Explicit data ownership | Hard Parts | Direct |
| Record of truth vs projections | CQRS/event-log tradition + logical data independence | Combined |
| Projection transformation pipelines | Fagin et al. 2005 | Strong adaptation |
| Offline-first convergence | Shapiro et al. 2011 | Direct when CRDT-compatible |
| Workflow compensation | Garcia-Molina & Salem 1987 | Direct |
| Runtime self-healing | recovery theory + supervisory architecture | Adaptation |
| Fitness-driven storage selection | Building Evolutionary Architectures | Direct adaptation |
| Benchmark-driven migration | Evolutionary Architecture + PACELC | Combined |
| Semantic storage selection per property | polyglot persistence + physical/logical independence | Adaptation |
| No universal “best database” | Hard Parts trade-off model | Direct |
| Human-in-the-Healing-Loop fallback | project-specific | Original AllasCode policy |
| Intent-driven Action resolution | project-specific + dynamic coupling principles | Original/adaptation |
| Semantic Behavior-Typed Algebra | project-specific formalization | Original AllasCode work |
| Agda proof obligations | dependent type/proof-assistant literature | Formal mechanism |

---

## 5. How these foundations constrain the Data Plane

The theoretical material implies several concrete rules.

### DATA-FND-01 — Storage is an implementation of semantics, not the source of semantics

A property must first declare what it means and what guarantees it needs. Only then should the runtime select the physical storage mechanism.

### DATA-FND-02 — Every projection must declare freshness semantics

A missing property can mean at least:

1. absent by design;
2. projection not yet updated;
3. failed materialization.

Those states cannot be collapsed into one generic “null/not found”.

### DATA-FND-03 — Every distributed write path must declare its consistency model

It is insufficient to say a component is “consistent”. The system must identify whether the needed property is, for example:

- serializable;
- linearizable;
- causally consistent;
- eventually consistent;
- convergent via CRDT;
- compensatable via Saga.

### DATA-FND-04 — Coordination is a cost that must be justified semantically

Strong coordination must exist only where the domain invariant requires it.

### DATA-FND-05 — Fitness functions decide whether an implementation remains valid

The architecture should continuously or periodically evaluate dimensions such as:

- correctness;
- latency;
- throughput;
- memory;
- CPU;
- storage cost;
- network cost;
- freshness;
- recovery time;
- consistency behavior.

No storage engine remains “best” independently of the workload and constraints.

### DATA-FND-06 — Migration is architectural behavior, not exceptional maintenance

If another implementation satisfies the same semantic contract with better measured fitness, migration should be a supported architectural operation.

### DATA-FND-07 — Compensation must be semantic

Cross-domain failures should execute explicit compensating behaviors, not pretend to provide global rollback when no such atomic transaction exists.

---

## 6. Relationship to AllasCode's complexity-containment thesis

The literature does **not** prove that architectural complexity disappears. In fact, the two books make the opposite point: difficult architecture consists of interacting trade-offs.

AllasCode's design choice is therefore:

```text
complexity exists
    -> formalize it
    -> automate it
    -> move it behind Runtime contracts
    -> prove/test/measure it
    -> prevent ordinary application code from reimplementing it
```

This is an AllasCode architectural thesis, not a statement directly made by the cited books.

The books provide the rationale for the first half:

- trade-offs are unavoidable;
- coupling and data decisions are entangled;
- architecture must evolve;
- fitness must be measured.

AllasCode provides the implementation thesis for the second half:

- Agents express semantic responsibility;
- Intents express desired macro-behavior;
- AtomicAction Behaviors expose reusable atomic capabilities;
- the Runtime resolves, binds, heals, proves, governs and orchestrates;
- the Data Plane materializes only the representations required by the semantic contract;
- fitness functions allow those implementations to evolve without changing the semantic intent.

---

## 7. Citation discipline for future documentation

To avoid overstating academic support, every future architecture document should distinguish:

### Direct foundation

The cited source defines substantially the same concept.

Example:

- AllasCode Saga compensation ↔ Garcia-Molina & Salem.

### Adaptation

AllasCode applies an established concept in a new runtime context.

Example:

- architectural fitness functions ↔ automated storage selection.

### Analogy

The source offers useful mathematical machinery, but the AllasCode concept is not the same concept.

Example:

- ACID recovery ↔ Action execution restart.

### Original project rule

The design is specific to AllasCode and should not be presented as academically established merely because neighboring concepts have citations.

Example:

- “No Action may directly mutate durable Agent state.”

---

## 8. Primary bibliography

1. Ford, N.; Richards, M.; Sadalage, P.; Dehghani, Z. **Software Architecture: The Hard Parts**. O'Reilly Media, 2021.
2. Ford, N.; Parsons, R.; Kua, P.; Sadalage, P. **Building Evolutionary Architectures**, 2nd ed. O'Reilly Media.
3. Lamport, L. **Time, Clocks, and the Ordering of Events in a Distributed System**. Communications of the ACM, 21(7), 1978. DOI: `10.1145/359545.359563`.
4. Herlihy, M.; Wing, J. **Linearizability: A Correctness Condition for Concurrent Objects**. ACM TOPLAS, 12(3), 1990. DOI: `10.1145/78969.78972`.
5. Papadimitriou, C. H. **The Serializability of Concurrent Database Updates**. Journal of the ACM, 26(4), 1979. DOI: `10.1145/322154.322158`.
6. Härder, T.; Reuter, A. **Principles of Transaction-Oriented Database Recovery**. ACM Computing Surveys, 15(4), 1983. DOI: `10.1145/289.291`.
7. Gilbert, S.; Lynch, N. **Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services**. SIGACT News, 33(2), 2002. DOI: `10.1145/564585.564601`.
8. Abadi, D. **Consistency Tradeoffs in Modern Distributed Database System Design: CAP is Only Part of the Story**. IEEE Computer, 45(2), 2012. DOI: `10.1109/MC.2012.33`.
9. Shapiro, M.; Preguiça, N.; Baquero, C.; Zawirski, M. **Conflict-Free Replicated Data Types**. SSS 2011, LNCS 6976. DOI: `10.1007/978-3-642-24550-3_29`.
10. Garcia-Molina, H.; Salem, K. **Sagas**. ACM SIGMOD, 1987. DOI: `10.1145/38713.38742`.
11. Fagin, R.; Kolaitis, P. G.; Miller, R. J.; Popa, L. **Data Exchange: Semantics and Query Answering**. Theoretical Computer Science, 336, 2005. DOI: `10.1016/j.tcs.2004.10.033`.
12. Codd, E. F. **A Relational Model of Data for Large Shared Data Banks**. Communications of the ACM, 13(6), 1970. DOI: `10.1145/362384.362685`.
13. Chen, P. P.-S. **The Entity-Relationship Model—Toward a Unified View of Data**. ACM Transactions on Database Systems, 1(1), 1976. DOI: `10.1145/320434.320440`.

---

## 9. Research backlog

The following topics deserve dedicated future theoretical-foundation sections as the architecture stabilizes:

- CALM theorem / monotonicity and coordination avoidance;
- deterministic state-machine replication;
- exactly-once *effects* versus exactly-once message delivery;
- idempotency and deduplication formal models;
- provenance semirings for evidence and projection provenance;
- temporal databases and bitemporal semantics;
- incremental view maintenance;
- event-log compaction and semantic garbage collection;
- formal verification of self-healing workflows;
- algebraic effects / effect typing for AtomicAction Behaviors;
- dependent types and Agda proofs for runtime obligations;
- linear/affine resource semantics for Action lifecycle;
- actor-model supervision and restart semantics;
- formal semantics for Intent-to-Behavior resolution.

These should be added only when the precise relationship between the external formalism and the AllasCode mechanism is documented.