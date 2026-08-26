# v1.0 Semantic Baseline

Status: **candidate baseline**  
Roadmap: #24  
Baseline task: #25

## Purpose

This document freezes the semantic responsibilities that must remain stable while the commercial example evolves into v1.0. It is not a claim that every capability is already production-ready. It separates the semantic model already represented in the Blueprint from implementation work tracked by the v1 roadmap.

## Baseline rules

1. Business behavior is addressed through semantic identity, not file paths or language implementation names.
2. Entities do not directly call or mutate other entities. Cross-context collaboration is event choreography; a consumer chooses whether to listen to an emitted event.
3. Every Action has exactly two terminal event classes: `Ok` and `Error`.
4. Normalization is permitted only as part of validation/self-healing and must be reversible when used as a behavioral type transformation.
5. Agents below an Entity boundary have no knowledge outside their declared context.
6. Tools provide external capabilities but do not acquire domain authority.
7. Policies, Constraints, Invariants and Laws are executable semantic responsibilities and require evidence.
8. Flows/Intents describe desired choreography; implementation language is a projection concern.
9. Runtime architecture is derived from the Semantic Graph rather than hidden wiring in implementation code.
10. A protected semantic change must be visible through Semantic PR Diff and governed by Semantic Merge Gate.

## v1 business lifecycle

### Purchase

External purchase evidence (text/audio/image/document/payment evidence) → purchase intent → evidence interpretation → supplier/product/quantity/price candidates → validation/healing → purchase registration → financial event → inventory event → fiscal/accounting projections where configured.

### Sale

External sale/payment detection → financial event → sale resolution intent → missing product composition may be requested through WhatsApp → validated products/quantities → sale close → inventory decrement → financial reconciliation → fiscal/accounting projections → UI/read-model update.

The producer does **not** address `Financial`, `Inventory`, or another Entity directly. It emits what happened/what is required with its semantic identity; interested Entity Agents subscribe according to configuration.

## v1 semantic surface

The release baseline must contain and validate these semantic artifact classes:

- Entities and Properties
- Actions / AtomicBehaviors
- Events
- Intents
- Flows / choreography
- Agents
- Actors / Supervisors
- Tools
- Capabilities
- Schemas and Types
- Policies
- Constraints
- Invariants
- Laws
- Interfaces
- Runtime graph relationships
- Test definitions and evidence

## Core commerce responsibilities

The minimum v1 domain surface is:

- Product
- Inventory / Stock
- Purchase
- Sale
- Payment / Financial transaction
- Financial account/projection
- Customer
- Supplier
- Fiscal document / Invoice
- Accounting projection/entry
- User / Operator identity where authorization is required

The exact implementation boundary of a concept is subordinate to its semantic responsibility. For example, `Payment` may be represented as a Financial-owned concept while remaining independently identifiable in schemas/events.

## Contract freeze criteria

This candidate becomes the accepted v1 baseline when all are true:

- Semantic Graph builds without unresolved references.
- Semantic Governor accepts all active relationships.
- Every active Action exposes Ok/Error terminal contracts.
- Every active cross-Entity interaction is event-mediated.
- Every release-critical Policy/Invariant/Law has test evidence.
- No legacy/untyped active contract bypasses the graph.
- Semantic PR Diff for accepting this baseline is reviewed.
- Issue #25 is closed only after these checks are proven by CI.

## Change policy after freeze

After acceptance, additive compatible semantic changes may proceed normally. Removal or incompatible modification of protected Policies, Invariants, Laws, Event contracts or critical graph relations must be classified by the Semantic Merge Gate and cannot be treated as an ordinary implementation refactor.

## Roadmap mapping

This baseline defines *what v1 means semantically*. Production completeness remains tracked separately: core commerce (#27–#34, #49), persistence/runtime (#35–#36, #59–#60), WhatsApp (#38–#41), UI (#42–#48, #50–#51, #58), production readiness (#52–#55, #57, #61–#63), and acceptance/release (#56, #64–#66).
