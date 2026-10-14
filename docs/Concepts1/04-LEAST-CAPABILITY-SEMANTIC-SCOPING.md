# Least-Capability Semantic Scoping

## Definition

AllasCode applies least capability at the semantic Agent boundary.

If the platform has 500 Atomic Skills, an Agent may receive only the five Actions required by its Behavior Flow. It does not need to know that the other 495 exist.

## Capability chain

    Platform capabilities
          ↓
    Scenario capabilities
          ↓
    Behavior Flow
          ↓
    Agent Skill
          ↓
    Action exposure
          ↓
    Runtime authorization

## Context versus authority

The @skills paper focuses on context economics: resident skill descriptions create standing token and attention cost. AllasCode can obtain a related context benefit, but its primary invariant is stronger: a capability outside the Agent Skill is not an available capability to that Agent.

    not projected + not authorized = not executable

## Security implication

An Agent for SellProduct may expose reserve, release and settle without inheriting mint, burn, transfer or reconcile simply because those Actions exist elsewhere.

## Runtime enforcement

The Runtime already rejects operations that are absent from the projected Agent Skill. The Behavior Flow projection makes the authority boundary explicit and inspectable.

## Why prompt restrictions are insufficient

A prompt saying do not use transfer is not an execution authority boundary. A projected Agent Skill with no transfer Action, combined with Runtime semantic validation, is an authority boundary. The model may propose transfer; the Runtime cannot execute it.

## Sources

- @skills: https://arxiv.org/abs/2608.12610
- Exploring AI: https://exploringartificialintelligence.substack.com/p/stop-installing-skills-start-using
- AllasCode Runtime: system/runtime/a3e/src/semantic_skill.zig
- AllasCode SBT: system/runtime/a3e/docs/SEMANTIC-BEHAVIOR-TYPE.md