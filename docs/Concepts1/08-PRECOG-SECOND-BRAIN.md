# PreCog-2nd-Brain — Predictive Cognitive Substrate

## Concept

**PreCog-2nd-Brain** is the canonical persistent cognitive substrate used by the AllasCode architecture.

Its purpose is not to be a conventional vector-memory layer or a prompt-history database. PreCog preserves execution experience as evidence and continuously derives memory, knowledge and future behavioral signals from that evidence while retaining temporal and provenance relationships.

The canonical model is:

```text
Experience -> Consolidation -> Knowledge -> Capability -> Behavior -> Experience
```

This creates a closed learning loop in which the system can learn from what actually happened without replacing the original evidence with a lossy summary.

The canonical project is:

- **Repository:** https://github.com/suissa/PreCog-2nd-brain
- **Specification:** `PRE-CORD.md`
- **Role:** persistent cognitive substrate for agentic systems.

## Why PreCog exists in AllasCode

AllasCode defines how intent becomes executable behavior through semantic contracts, Atomic Skills, Actions, Behavior Flows, Agent Skills and Runtimes.

That architecture needs a complementary answer to a different question:

> How does the system retain what happened, understand what happened, derive reusable knowledge from it, and use that knowledge to improve future behavior?

PreCog is the canonical answer.

Therefore the relationship is:

```text
                         AllasCode
                            |
          Intent -> Behavior -> Action -> Runtime
                            |
                            v
                    execution experience
                            |
                            v
                    PreCog-2nd-Brain
                            |
          +-----------------+------------------+
          |                 |                  |
       Memory           Knowledge          Prediction
          |                 |                  |
          +-----------------+------------------+
                            |
                            v
                 future Behavior / Capability
```

PreCog does not replace the AllasCode semantic architecture. It provides the persistent cognitive substrate from which future semantic behavior can be informed.

## Experience is the source of truth

The central design law of PreCog is:

> Preserve experience as evidence; derive memory and knowledge from it; never make a lossy summary the sole source of truth.

An execution therefore produces immutable experience records. Memories, knowledge objects, relations and behavioral predictions are derived representations.

This distinction is important for AllasCode because an Agent Skill or Behavior Flow is a semantic projection, not an historical database.

The system can therefore distinguish:

- what actually happened;
- what the system currently remembers about it;
- what knowledge was derived from those experiences;
- what behavior is predicted to be useful next.

A derived representation can be rebuilt or superseded without destroying the underlying evidence.

## Temporal cognitive model

PreCog is explicitly temporal. It distinguishes the time at which something occurred from the time at which it was recorded.

Its canonical entities include:

- **Experience** — immutable execution evidence;
- **Trajectory** — ordered experience over a behavioral episode;
- **Memory** — episodic, semantic, entity, procedural or observational representation;
- **Relation** — provenance and semantic relationships between derived objects;
- **Knowledge** — validated statements with evidence, confidence, scope and temporal validity;
- **Behavior** — intent, preconditions, context, actions, expected outcome, invariants and evidence.

This allows AllasCode to reason about behavior as something that evolves through experience rather than as a static prompt or configuration.

## Retrieval is evidence selection

PreCog does not define retrieval as “dump the memory database into the model context.”

Retrieval is an evidence-selection operation.

The canonical retrieval contract exposes independent signals such as:

- lexical/BM25;
- semantic/vector;
- entity and metadata;
- temporal;
- trajectory;
- optional relation signals.

Results retain identity, provenance, score components, temporal validity and lifecycle state.

This is particularly important for Agent Skills: retrieved information can inform classification, consolidation or behavioral decisions without becoming an implicit authority that bypasses the Agent Skill's capability boundary.

## Consolidation

Consolidation transforms accumulated experience and current derived state into proposals for new or changed knowledge.

A consolidation proposal may contain:

- evidence;
- observations;
- root-cause analysis;
- generalization;
- candidate knowledge changes;
- contradictions;
- confidence;
- expected benefit;
- validation requirements.

The proposal does not automatically become active knowledge. It must pass the configured validation gate.

This preserves a deterministic boundary between observed experience and derived cognitive state.

## PreCog and Behavior

PreCog explicitly separates memory from prediction.

The normative model is:

```text
P(BehaviorID | query, state, retrieved evidence, trajectory, history)
```

Therefore PreCog can become a source of behavioral evidence for AllasCode without conflating prediction with authority.

A useful architectural distinction is:

```text
PreCog:     evidence -> memory -> knowledge -> behavioral signal
AllasCode:  intent  -> authorized behavior -> action -> execution
```

Prediction can propose what is likely to be useful. The AllasCode runtime still determines what is semantically valid and executable.

This preserves the principle that a classifier or predictive component may propose a route, but cannot expand the Agent's capability set.

## Relationship with Agent Skills

An AllasCode Agent Skill is derived from the Agent's Behavior Flow and defines the semantic capability surface available to that Agent instance.

PreCog can influence the formation or evolution of that Behavior Flow through accumulated evidence, but it does not become the Agent Skill itself.

The conceptual chain is:

```text
Experience
   ↓
PreCog consolidation
   ↓
Knowledge / behavioral evidence
   ↓
Intent + Behavior Flow evolution
   ↓
Agent Skill projection
   ↓
Authorized Actions
   ↓
Runtime execution
   ↓
new Experience
```

This makes PreCog complementary to the concepts documented in this directory:

- **Atomic Skill** defines a reusable bounded capability;
- **Behavior Flow** defines the ordered semantic behavior;
- **Agent Skill** projects the capabilities required by that behavior;
- **PreCog** preserves and consolidates the experience from which future behavior can be improved.

## Provenance and rebuildability

PreCog requires provenance closure: every derived memory and knowledge object must be traceable to source experiences or trajectories.

It also requires derived-state rebuildability. Projections can be reconstructed from authoritative experience plus versioned derivation metadata.

This matters to AllasCode's Semantic-as-Code model because generated or projected semantic artifacts should remain explainable in terms of the evidence and contracts that produced them.

A cognitive result should therefore be inspectable as:

```text
prediction / knowledge
        ↓
derived from
        ↓
memory / relation
        ↓
derived from
        ↓
experience / trajectory
        ↓
execution
```

## Deterministic authority boundary

PreCog deliberately separates deterministic mechanisms from model-assisted operations.

The deterministic core includes:

- identity;
- provenance;
- lifecycle;
- filtering;
- authorization;
- temporal validity;
- rebuildability.

Models may assist with:

- extraction;
- consolidation;
- summarization;
- reflection;
- root-cause analysis;
- embeddings;
- reranking;
- prediction.

This division aligns with AllasCode's broader architecture: probabilistic components may assist semantic interpretation, but executable authority remains governed by deterministic contracts and runtime invariants.

## Canonical implementation

AllasCode should treat **PreCog-2nd-brain as the canonical project for persistent cognitive memory, provenance-aware consolidation and predictive behavioral evidence**.

The project is specification-first. Its normative contract is `PRE-CORD.md`.

Initial implementation direction defined by the canonical project:

```text
TypeScript
PostgreSQL
JSONB
pgvector
filesystem / Markdown
Git
provider-neutral adapters
```

These implementation choices are not the semantic contract. The contract is defined by the PreCog model and its invariants.

## What PreCog is not

PreCog is not:

1. a vector database used as the source of truth;
2. a prompt-injection mechanism for blindly inserting memories into an Agent;
3. a provider-specific memory API;
4. a replacement for AllasCode Behavior Flows or Agent Skills;
5. a mechanism that turns predictions directly into executable authority;
6. a destructive replacement for historical experience.

The distinction is fundamental:

```text
Memory is evidence-derived.
Prediction is a proposal.
Behavior is authorized by AllasCode.
Execution produces new evidence.
```

## Canonical source

The canonical PreCog specification and implementation are maintained in:

**PreCog-2nd-brain:** https://github.com/suissa/PreCog-2nd-brain

The normative contract is:

**PRE-CORD:** https://github.com/suissa/PreCog-2nd-brain/blob/main/PRE-CORD.md

AllasCode documentation should reference this repository rather than reproducing PreCog's cognitive substrate as a second, divergent implementation.

## Sources

- PreCog-2nd-brain — canonical repository: https://github.com/suissa/PreCog-2nd-brain
- PreCog PRE-CORD — normative technical contract: https://github.com/suissa/PreCog-2nd-brain/blob/main/PRE-CORD.md
- AllasCode Concepts 1 — Semantic Agent Skills: ../Concepts1/README.md
