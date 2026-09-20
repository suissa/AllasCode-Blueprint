# Agentic-Native vs AI-Native

## Status

Proposed architectural terminology for AllasCode.

## Abstract

AllasCode distinguishes **AI-Native** systems from **Agentic-Native** systems.

An **AI-Native** system is designed around artificial-intelligence capabilities as a first-class part of the product or platform.

An **Agentic-Native** system is designed around autonomous or semi-autonomous agents as first-class computational actors, with explicit concepts for intent, action, delegation, supervision, memory, authority, orchestration, healing, proof, governance, and runtime execution.

The distinction matters because an Agentic-Native architecture may use AI heavily, minimally, or not at all in some execution paths. Likewise, an AI-Native product can make extensive use of LLMs without possessing an agentic execution model.

For AllasCode:

> **AI is a capability. Agency is an architectural model.**

---

## 1. Core distinction

### AI-Native

AI-Native describes a system whose product behavior or architecture depends fundamentally on AI techniques such as:

- large language models;
- generative models;
- embeddings;
- classifiers;
- ranking models;
- machine learning;
- neural inference;
- AI-assisted decision making.

Typical AI-Native design questions are:

- Which model should perform this task?
- How should prompts be constructed?
- How should model outputs be validated?
- How should embeddings be stored?
- How should inference cost and latency be optimized?
- How should model fallback and routing work?
- How should hallucination and prompt injection be controlled?

AI is central to implementation.

### Agentic-Native

Agentic-Native describes a system whose architecture is built around agents as first-class execution entities.

Typical Agentic-Native design questions are:

- What Intent is being pursued?
- Which Agent owns the Intent?
- Which Behaviors are required?
- Which Actions may be executed?
- Which Actor owns local state?
- Who supervises execution?
- What authority has been delegated?
- What context is local to the Agent?
- How are Actions orchestrated?
- How are failures healed?
- What evidence proves execution correctness?
- Which Governor decides whether a transition is allowed?
- What knowledge should be persisted?
- What can be executed autonomously versus requiring human authority?

Agency is central to architecture.

---

## 2. The simplest formulation

```text
AI-Native
  = AI is a first-class capability

Agentic-Native
  = Agency is a first-class architectural primitive
```

A system can be:

```text
AI-Native but not Agentic-Native
Agentic-Native but not strongly AI-Native
both AI-Native and Agentic-Native
neither
```

---

## 3. Four possible system classes

### 3.1 AI-Native, not Agentic-Native

Example structure:

```text
User
 -> Application
 -> LLM
 -> Response
```

The product may depend heavily on AI, but execution remains request/response oriented.

Characteristics:

- prompts are central;
- models are central;
- no explicit Agent ownership;
- no delegated authority model;
- no formal Action lifecycle;
- no independent supervision;
- no runtime-level governance;
- memory may be conversational rather than operational.

This is AI-Native, but not necessarily Agentic-Native.

---

### 3.2 Agentic-Native, weakly AI-Native

Example:

```text
Intent
 -> Agent
 -> deterministic Behavior
 -> Action
 -> Actor
 -> Runtime
 -> Event
```

The Agent may operate using:

- deterministic rules;
- Prolog;
- state machines;
- constraint solvers;
- policies;
- static planners;
- symbolic reasoning;
- event-driven logic.

No LLM is required for the path.

This can still be fully Agentic-Native.

---

### 3.3 AI-Native and Agentic-Native

Example:

```text
Intent
 -> Agent
 -> Behavior
 -> LLM-assisted planning
 -> Action
 -> Runtime
 -> Proof
 -> Governor
 -> Persistence
```

AI provides reasoning or generation, while the Agentic Runtime controls authority, execution, supervision, validation, and persistence.

This is the primary AllasCode model.

---

### 3.4 Neither

Traditional application:

```text
UI
 -> Controller
 -> Service
 -> Database
```

Neither AI nor agents are first-class architectural primitives.

---

## 4. Comparison

| Dimension | AI-Native | Agentic-Native |
|---|---|---|
| Primary abstraction | AI capability/model | Agent/Intent/Action |
| Core concern | Intelligence | Agency |
| LLM required | Often, but not necessarily | No |
| Autonomous execution | Optional | Architectural concern |
| Intent ownership | Usually implicit | Explicit |
| Action model | Optional | Required |
| Delegated authority | Usually external | First-class |
| Supervision | Model/application-specific | Architectural |
| Runtime governance | Optional | Core |
| Human-in-the-loop | Product feature | Authority model |
| Memory | Conversation/model context often central | Operational, semantic, episodic, causal, procedural |
| Failure recovery | Retry/fallback often | Supervised healing lifecycle |
| Proof/acceptance | Output validation | Runtime lifecycle concern |
| Knowledge reuse | Prompt/model/data driven | Skills + state + evidence + memory |
| Multi-agent interaction | Optional | Native |
| Non-AI execution | Secondary | Fully supported |
| Evolution | Model/app update | Governed capability evolution |

---

## 5. Why AllasCode is Agentic-Native

AllasCode does not start from:

```text
Which LLM should answer this request?
```

It starts from:

```text
What Intent exists?
Which Agent owns it?
Which Behaviors satisfy it?
Which Actions are valid?
Who may authorize them?
How does the Runtime execute them?
How are results proved, governed, accepted, and persisted?
```

Its central model is:

```text
Intent
 -> Agent
 -> Behavior
 -> Action
 -> Actor
 -> Supervisor
 -> Runtime
```

The LLM is not the execution authority.

The Runtime is.

---

## 6. A³ as an Agentic-Native execution model

AllasCode uses the A³ model:

```text
Agent
Actor
Action
```

A simplified interpretation is:

### Agent

Owns or coordinates an Intent and its Behaviors.

### Actor

Maintains bounded local execution state and mailbox semantics.

### Action

Represents an atomic executable capability.

### Supervisor

Observes Action/Actor execution and participates in recovery.

This model exists independently of whether an LLM participates.

---

## 7. AtomicSkills reinforce Agentic-Native architecture

Each Action can be represented by an AtomicSkill.

```text
Action <-> AtomicSkill
```

The Action is the executable artifact.

The AtomicSkill is the portable operational knowledge describing how that Action should be understood, generated, validated, tested, healed, and constrained.

This allows:

```text
AtomicSkill
 + target language
 + target architecture
 + runtime constraints
 -> generated Action
```

The capability therefore belongs to the agentic knowledge model rather than to one fixed source-language implementation.

This is stronger than conventional AI-Native code generation because the generated code is constrained by a first-class execution contract.

---

## 8. AI inside an Agentic-Native system

In AllasCode, AI can provide capabilities such as:

- classification;
- semantic resolution;
- planning;
- code generation;
- hypothesis generation;
- root-cause analysis;
- summarization;
- translation;
- embedding;
- intent interpretation;
- natural-language interaction.

These capabilities should be invoked through the Runtime like other capabilities.

Therefore:

```text
Agent
 -> Action
 -> LLM Harness
 -> Model
```

rather than:

```text
Application
 -> arbitrary LLM call
```

The LLM Harness can enforce:

- prompt sanitation;
- context bounding;
- model routing;
- provider abstraction;
- token budgets;
- trace propagation;
- guardrails;
- output validation;
- structured output;
- retry/fallback;
- security policies;
- observability.

This preserves the distinction between intelligence and execution authority.

---

## 9. AI is not the authority boundary

An AI model may propose:

- an Action;
- a repair;
- an optimization;
- a new skill;
- a plan;
- a code change;
- a policy hypothesis.

That does not imply permission to execute or persist it.

The Agentic-Native rule is:

```text
ability to generate != authority to execute
ability to reason != authority to decide
ability to learn != authority to persist
capability != permission
```

Authority belongs to explicit architectural mechanisms such as Governor policy, delegation, runtime rules, and human authorization.

---

## 10. Human authority

In AI-Native products, human-in-the-loop is often implemented as a user-experience safeguard.

In an Agentic-Native architecture it can be a formal authority relation.

For example:

```text
Human
 -> delegates bounded authority
 -> Agent
 -> performs allowed Actions
```

or:

```text
Agent
 -> proposes Action
 -> Human approves
 -> Runtime executes
```

This allows AllasCode to distinguish:

- human initiated execution;
- agent-mediated execution;
- delegated execution;
- approval-required execution;
- autonomous bounded execution.

---

## 11. Memory distinction

AI-Native applications commonly treat memory as context supplied to a model.

Agentic-Native systems require broader operational memory.

AllasCode can distinguish:

```text
Working Context
Episodic Memory
Semantic Memory
Procedural Memory
Causal Memory
Negative Knowledge
Event History
Actor State
Skill Knowledge
```

Not all memory needs to enter an LLM context window.

This prevents architecture from becoming equivalent to prompt construction.

---

## 12. Agentic-Native observability

Observability must follow the Intent and Action lifecycle, not merely model calls.

Relevant identifiers include:

```text
intent_id
agent_id
actor_id
action_id
event_id
trace_id
correlation_id
causation_id
skill_id
model_call_id
```

A model call is therefore only one possible span inside a larger agentic trace.

---

## 13. Agentic-Native failure semantics

AI-Native systems commonly focus on:

- malformed model output;
- hallucination;
- timeout;
- provider error;
- context overflow;
- moderation failure.

Agentic-Native systems must also represent:

- Action failure;
- Actor failure;
- Behavior failure;
- Intent failure;
- authority denial;
- invariant violation;
- proof failure;
- healing exhaustion;
- orchestration failure;
- dependency failure;
- state conflict;
- replay conflict.

This is one reason an LLM harness alone is not an agentic runtime.

---

## 14. Agentic-Native generation

AllasCode is intended to allow parts of the system to be generated for a target developer architecture and language.

The generation source is not only natural-language prompting.

The source should include semantic architectural artifacts:

```text
Intent definition
Behavior definition
Action contract
AtomicSkill
Policies
Constraints
Types
Events
Tests
Proof obligations
Target profile
```

Then:

```text
Semantic Capability
       |
       v
AtomicSkill
       |
       + Target Architecture
       + Target Language
       + Runtime Contract
       + Constraints
       |
       v
Generated Implementation
       |
       v
Validation
       |
       v
Runtime-compatible Action
```

This is Agentic-Native generation rather than generic AI code generation.

---

## 15. Agentic-Native vs "agents added later"

An application does not become Agentic-Native by adding:

- a chatbot;
- an LLM tool loop;
- a planner;
- an agent SDK;
- a multi-agent library.

Agentic-Native means the system's core abstractions and lifecycle assume agency from the beginning.

A useful test is:

> If the LLM is removed, does the architecture still have explicit Intent ownership, Actions, supervision, authority, governance, memory, orchestration, and execution semantics?

If yes, it may still be Agentic-Native.

Another test is:

> If the agent layer is removed, does the architecture fundamentally collapse into a conventional application?

If yes, agency is probably architectural rather than incidental.

---

## 16. Agentic-Native and Syntropic-by-Construction

The concepts address different dimensions.

### Agentic-Native

Defines **who and what executes**:

```text
Intent
 -> Agent
 -> Behavior
 -> Action
 -> Runtime
```

### Syntropic-by-Construction

Defines **what happens to operational experience over time**:

```text
Experience
 -> Evidence
 -> Healing / Optimization / Evolution
 -> Proof
 -> Governance
 -> Persistence
 -> Reuse
 -> Increased capability
```

Therefore:

```text
Agentic-Native
       |
       v
Agentic Runtime
       |
       v
Syntropic-by-Construction
       |
       +-- Self-Healing
       +-- Self-Optimizing
       +-- Governed Self-Evolving
       |
       v
Validated reusable knowledge
```

Agentic-Native provides the execution ontology.

Syntropic-by-Construction provides the evolutionary direction.

---

## 17. Relationship to the AllasCode LLM Harness

The LLM Harness is an important module, but it is subordinate to the Runtime.

```text
AllasCode Runtime
 |
 +-- Agent execution
 +-- Actor supervision
 +-- Action execution
 +-- Governor
 +-- Proof
 +-- Persistence
 +-- LLM Harness
       |
       +-- prompt sanitation
       +-- context assembly
       +-- routing
       +-- inference
       +-- guardrails
       +-- trace
       +-- output validation
```

This relationship is intentional.

If the LLM Harness were the architectural root, AllasCode would be primarily AI-Native.

Because the Runtime, Agent, Actor, Action, Intent, supervision, and governance model remain authoritative, AllasCode is primarily Agentic-Native and can additionally be AI-Native where AI capabilities are structurally used.

---

## 18. Canonical terminology

Recommended terminology:

> **AllasCode is an Agentic-Native architecture.**

When AI use is relevant:

> **AllasCode is Agentic-Native and AI-enabled/AI-capable.**

Where both properties are materially present:

> **AllasCode is an Agentic-Native, AI-Native platform.**

But the ordering is intentional:

```text
Agentic-Native > AI-Native
```

This does not mean "better than."

It means **architecturally more fundamental to AllasCode**.

---

## 19. Canonical statement

> **AI-Native systems make artificial intelligence a first-class capability. Agentic-Native systems make agency a first-class architectural primitive. AllasCode is Agentic-Native because Intent ownership, Actions, Actors, supervision, delegated authority, governance, memory, healing, proof, and runtime execution exist independently of any particular AI model. AI can reason, generate, classify, or plan, but the Agentic Runtime remains the execution and authority boundary.**

---

## 20. Short form

```text
AI-Native:
AI is built into the system.

Agentic-Native:
Agency is built into the architecture.
```

For AllasCode:

> **The model may think. The Agent may act. The Runtime decides how execution occurs.**
