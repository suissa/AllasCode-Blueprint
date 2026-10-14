# Behavior-Derived Agent

## Definition

In AllasCode, an Agent is not primarily a hand-written class. A semantic Agent instance is derived from Intent, Behavior Flow, capability projection and Runtime.

    Intent + Behavior Flow + Capability projection + Runtime

The same Runtime can execute many different Agent instances.

    Agent A ─┐
    Agent B ─┼──> same Agent Runtime
    Agent C ─┘

## Example

Agent A: identify_customer -> select_product -> calculate_total

Agent B: identify_customer -> select_product -> recommend_product -> calculate_total -> authorize_payment

Agent A and Agent B are different semantic Agents because their Behavior Flows differ. They do not require different implementation classes.

    Agent A != Agent B
    BehaviorFlow(A) != BehaviorFlow(B)
    AgentRuntime(A) = AgentRuntime(B)

## Dynamic identity

The Runtime derives a deterministic Agent ID from semantic type/scenario and the ordered Behavior Flow. The identity is a semantic execution identity, not a model identity or source-code class identity.

## Agent Factory

Conceptually AllasCode has an Agent Factory:

    Intent -> Behavior Flow -> Agent Skill generation -> Agent identity -> Universal Runtime

The factory materializes a bounded semantic execution projection rather than duplicating source code.

## Consequence

Adding one existing Action to a flow can create a new Agent semantic instance without creating a new Action implementation.

## Sources

- AllasCode Runtime: system/runtime/a3e/src/semantic_skill.zig
- Anthropic Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic Skills: https://www.anthropic.com/research/skills