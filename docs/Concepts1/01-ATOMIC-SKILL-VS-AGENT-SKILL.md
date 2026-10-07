# Atomic Skill vs Agent Skill

## Definition

AllasCode uses two semantic scales:

    Atomic Skill = one bounded reusable capability
    Agent Skill  = the bounded capability set required by one Agent Behavior Flow

An Atomic Skill belongs to an Action capability. An Agent Skill is generated from the composition of the Atomic Skills required by the Agent Behavior Flow.

This is related to, but architecturally different from, Anthropic Agent Skills. Anthropic describes a Skill as a directory containing instructions, resources and optional executable code that an agent can discover and load. The @skills proposal separates content, persistence and automatic triggering.

AllasCode addresses a different boundary: capability authority.

## Atomic Skill

An Atomic Skill describes one atomic capability: semantic identity, operation, invariants, constraints, implementation contract, tests and proof obligations.

Example:

    AtomicSkill: reserve / Behavior: Reservable

## Agent Skill

An Agent Skill is generated from the Agent Behavior Flow:

    Behavior Flow -> required Actions -> Atomic Skills -> Agent Skill

Example:

    Agent: SellProduct
    Behavior Flow:
      identify_customer
      reserve
      calculate_total
      settle

The resulting Agent Skill does not contain every capability available to the platform. It contains the semantic projection necessary for this flow.

## Key difference

Traditional skill systems ask which installed skill should be activated. AllasCode asks which Behavior Flow defines the Agent and therefore which capabilities are admissible.

## Invariants

- An Agent Skill MUST NOT expose an Action absent from its Behavior Flow.
- Adding an Action to a Behavior Flow MUST change the semantic Agent identity.
- Reordering the Behavior Flow MUST change the identity when order changes execution semantics.
- Identical semantic flows MUST produce the same deterministic identity.
- Atomic Skill identity remains independent of the Agent using it.
- Implementation details remain behind the Atomic Skill and Action boundary.

## Sources

- Anthropic: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Anthropic Skills: https://www.anthropic.com/research/skills
- @skills paper: https://arxiv.org/abs/2608.12610
- Exploring AI: https://exploringartificialintelligence.substack.com/p/stop-installing-skills-start-using