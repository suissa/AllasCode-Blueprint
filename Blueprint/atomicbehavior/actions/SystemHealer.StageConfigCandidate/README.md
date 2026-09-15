# SystemHealer.StageConfigCandidate

Stage a bounded system-configuration intervention authorized by an immutable system-fault hypothesis.

## Authority

- Actor role: `SystemHealerAgent`
- Mode: `bounded_config_write`
- Reads: HealingHypothesis, configs/core.yml, configuration schema, safety bounds
- Writes: `configs/core.yml#<authorized-healable-property>`

This Action is specified as an isolated Actor with a Supervisor. The listened request event is injected at creation, and terminal events are fixed to `SystemHealer.StageConfigCandidate.Ok` or `SystemHealer.StageConfigCandidate.Error`.

## Semantic contract

Preconditions:

- `hypothesis_fault_class_is_system`
- `config_property_is_declared_healable`
- `candidate_value_is_inside_safety_bounds`

Invariants:

- **INV-CONFSTAGE-001:** only configs/core.yml and only an authorized healable property may change.
- **INV-CONFSTAGE-002:** Action implementations and semantic contracts are read-only.
- **INV-CONFSTAGE-003:** one causal configuration dimension changes per experiment whenever operationally safe.
- **INV-CONFSTAGE-004:** the candidate cannot promote or verify itself.

It must never:

- modify code.
- change immutable or operator-only properties.
- change multiple unrelated settings.
- commit or merge.

## Skill projections

- [Authoring Skill](skills/authoring/SKILL.md) explains how to create or modify this Action and its tests.
- [Semantic Skill](skills/semantics/SKILL.md) explains what the Action means and how it participates in the healing flow.

Both are derived from the same canonical artifact version. They are not independent sources of truth.
