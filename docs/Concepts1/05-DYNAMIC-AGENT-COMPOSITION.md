# Dynamic Agent Composition

## Definition

An Agent is a semantic composition, not necessarily a separately implemented software artifact.

    Agent = Runtime + Agent Skill + Behavior Flow + semantic identity

## Example

Two users can share the same canonical Intent RegisterSale while having different Behavior Flows.

User A: identify_customer -> select_product -> calculate_total -> persist_sale

User B: identify_customer -> recommend_product -> select_product -> apply_discount -> calculate_total -> authorize_payment -> persist_sale

Therefore:

    same Intent + different Behavior Flow = different semantic Agent

## No implementation fork

The Runtime does not need a separate class for every composition. It executes the same Runtime with different Agent Skill projections.

## Change model

    Flow v1: A -> B -> C
    Flow v2: A -> B -> D -> C

If D already exists as an Action, changing the behavior does not require a new Action implementation.

## Canonical semantics

The canonical Intent remains stable while the local Behavior Flow changes. This enables personalized execution without semantic fragmentation.

## Sources

- AllasCode Runtime: system/runtime/a3e/src/semantic_skill.zig
- AllasCode Semantic-as-Code: docs/Semantics/Semantic-as-Code.md
- Anthropic: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills