# Concepts 1 — Semantic Agent Skills

This directory formalizes the concepts that emerged from comparing AllasCode Atomic Skills with the 2025 Agent Skills model and the 2026 @skills proposal.

> An Agent does not discover an arbitrary universe of capabilities. Its capabilities are derived from its Behavior Flow, producing an Agent Skill that exposes only the Actions required by that flow.

## Concepts

1. [Atomic Skill vs Agent Skill](./01-ATOMIC-SKILL-VS-AGENT-SKILL.md)
2. [Behavior-Derived Agent](./02-BEHAVIOR-DERIVED-AGENT.md)
3. [Agent Skill as Semantic Routing Contract](./03-AGENT-SKILL-ROUTING.md)
4. [Least-Capability Semantic Scoping](./04-LEAST-CAPABILITY-SEMANTIC-SCOPING.md)
5. [Dynamic Agent Composition](./05-DYNAMIC-AGENT-COMPOSITION.md)
6. [Hyperpersonalized Programming](./06-HYPERPERSONALIZED-PROGRAMMING.md)
7. [On-Demand Skills: AllasCode vs @skills](./07-ON-DEMAND-SKILLS.md)

## Runtime implementation

The concepts are implemented in system/runtime/a3e/src/semantic_skill.zig and its tests. The Runtime representation separates Atomic Skill, Action, Behavior Flow, Agent Skill and Agent Runtime.

## Sources

- Anthropic, Equipping agents for the real world with Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic, Introducing Agent Skills: https://www.anthropic.com/research/skills
- Yin et al., @skills: Attention is all you have: https://arxiv.org/abs/2608.12610
- Exploring AI, Stop installing skills. Start using them on demand.: https://exploringartificialintelligence.substack.com/p/stop-installing-skills-start-using