# Runtime concepts

This directory contains runtime-level architectural principles that constrain how AllasCode executes, evolves and heals systems.

- [Complexity Containment](COMPLEXITY-CONTAINMENT.md) — keeps runtime complexity from leaking into domain semantics.
- [Evolutionary Architecture](EVOLUTIONARY-ARCHITECTURE.md) — governs admissible architectural evolution through measurable fitness and evidence.
- [Capability-Bounded Read-Only Self-Healing](CAPABILITY-BOUNDED-SELF-HEALING.md) — defines OS-enforced read-only boundaries, per-Agent mutation capabilities, `CodeHealerAgent`, `SystemHealerAgent`, independent verification and promotion.
