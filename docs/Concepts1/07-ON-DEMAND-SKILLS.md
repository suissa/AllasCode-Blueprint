# On-Demand Skills: AllasCode vs @skills

## Why this concept appeared

The 2026 @skills proposal argues that installing every skill is inefficient because installed descriptions remain resident in the agent prompt and compete for attention. It separates Content, Persistence and Triggering.

## Different architectural problem

    @skills
    solves access to a large external skill universe without keeping every skill resident.

    AllasCode
    derives the capabilities of an Agent from its Behavior Flow.

Therefore the distinction is:

    JIT discovery vs behavior-derived capability construction

## @skills model

    Skill Universe -> Reference / Save / Install -> Agent loads or triggers Skill

## AllasCode model

    Canonical Intent -> Behavior Flow -> Agent Skill generation -> required Actions -> Runtime

## Complementarity

An AllasCode Atomic Skill may be represented by an external SKILL.md or another procedural artifact. That artifact may be referenced or loaded on demand. The Runtime Agent Skill remains a semantic capability projection.

    External procedural Skill
          ↓
    Atomic Skill knowledge
          ↓
    Action contract
          ↓
    Behavior Flow
          ↓
    Agent Skill

## Context and authority

On-demand loading reduces context cost. AllasCode additionally reduces the semantic authority surface because unrelated capabilities are not projected into the Agent.

## Sources

- @skills: https://arxiv.org/abs/2608.12610
- Exploring AI: https://exploringartificialintelligence.substack.com/p/stop-installing-skills-start-using
- Anthropic: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills