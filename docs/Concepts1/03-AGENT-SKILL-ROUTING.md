# Agent Skill as Semantic Routing Contract

## Definition

The AllasCode Agent Skill is a routing contract. It tells the Agent what capabilities exist, which capabilities are admissible, which Action represents each capability and what semantic meaning the Action has.

It does not need to contain how the Action is implemented. That belongs to the Atomic Skill and Action implementation boundary.

## Routing model

    Natural-language Intent
          ↓
    Intent Classifier
          ↓
        Agent
          ↓
      Agent Skill
          ↓
     Behavior Flow
          ↓
    Action Router / Classifier
          ↓
       Atomic Action
          ↓
        Runtime

A model can perform classification, but its candidate set is bounded by the Agent Skill.

## Authority

    LLM classification = proposal
    Agent Skill        = admissible semantic space
    Runtime             = execution authority

If a classifier proposes settle while the projected Agent Skill contains only reserve, the route is invalid and the Runtime must reject it.

## Why this differs from trigger-heavy skills

Anthropic uses Skill name and description as a progressive-disclosure trigger mechanism. @skills separates content, persistence and automatic triggering.

AllasCode constrains the candidate space before classification:

    capability universe -> Behavior Flow -> small admissible set -> classifier -> Action

This changes the problem from global capability discovery to local semantic classification.

## Invariants

- The classifier MUST NOT expand the Agent capability set.
- Routing MUST fail closed when no projected Action matches.
- Action implementation MUST remain behind the Action contract.
- Agent Skill MUST be reproducible from the Behavior Flow.
- Runtime execution MUST re-check semantic permission.

## Sources

- Anthropic: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- @skills: https://arxiv.org/abs/2608.12610
- Exploring AI: https://exploringartificialintelligence.substack.com/p/stop-installing-skills-start-using