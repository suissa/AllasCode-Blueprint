# Intent Integrity Proof

## Purpose

Intent Integrity Proof (IIP) defines when an AllasCode execution may be accepted as a valid realization of an Intent.

A correct output is necessary but not sufficient. The runtime must also prove that the output was reached through an authorized trajectory, under the declared capabilities and invariants, and that the mechanism used to verify the outcome was not controlled or modified by the same execution being judged.

This prevents a class of failures analogous to reward hacking and specification gaming: an Agent or Action may make the acceptance signal appear correct without producing the intended system state.

## Core statement

AllasCode distinguishes `Outcome Satisfaction` from `Intent Satisfaction`.

```text
Outcome Satisfaction := the observable result matches the expected result.

Intent Satisfaction :=
    Outcome Satisfaction
    AND Invariant Satisfaction
    AND Capability Compliance
    AND Authorized Trajectory
    AND Verifier Integrity
    AND Provenance Validity
```

Formally, for an Intent `I`, execution trajectory `τ`, final state `s'`, verifier `V`, capability set `C`, invariant set `Inv`, and evidence set `E`:

```text
IIP(I, τ, s', V, C, Inv, E) =
    Outcome(I, s')
    ∧ ∀ inv ∈ Inv : inv(τ, s')
    ∧ CapabilitiesAllowed(τ, C)
    ∧ AuthorizedTrajectory(I, τ)
    ∧ VerifierTrusted(V, τ)
    ∧ ProvenanceComplete(E, τ)
```

An Intent may emit its external `Ok` result only when `IIP = true`.

## Separation of modifier and verifier

For resources that determine acceptance, the component that modifies the system MUST NOT control the evidence that proves the modification correct.

```text
ModifierCriticalWrites ∩ VerifierCriticalResources = ∅
```

At minimum, an execution under verification MUST NOT mutate:

- acceptance specifications used to judge that execution;
- verifier implementation or pinned verifier version;
- trusted reference data used only by verification;
- proof policy or invariant definitions used by that execution;
- evidence records after they have been sealed.

A violation invalidates the proof even when the functional tests pass.

## Proof dimensions

Every Intent Integrity Proof evaluates six independent dimensions.

| Dimension | Question |
| --- | --- |
| Outcome | Did the final state satisfy the declared Intent result? |
| Invariants | Were all semantic and domain invariants preserved? |
| Capabilities | Did every read, write and invocation occur under an authorized capability? |
| Trajectory | Was the sequence of Actions and state transitions authorized? |
| Verifier integrity | Was verification performed by a trusted, immutable/pinned verifier? |
| Provenance | Can the accepted result be traced to sealed evidence from the actual execution? |

A pass in one dimension never compensates for failure in another.

## Internal proof status

The external event contract remains `Ok | Error`. Internally, Proof uses richer states:

```text
ProofStatus := Verified | Compromised | Blocked | Inconclusive
```

- `Verified`: all proof obligations are satisfied.
- `Compromised`: direct evidence shows verifier tampering, forbidden capability use, invariant violation, unauthorized mutation, or provenance manipulation.
- `Blocked`: a forbidden operation was attempted and prevented before it could compromise the execution.
- `Inconclusive`: signals disagree, but there is insufficient evidence to prove either correctness or compromise.

`Inconclusive` MUST NOT be promoted to `Verified` automatically. The runtime routes it to Healing or Human-in-the-Healing-Loop according to policy.

## Runtime placement

The runtime pipeline uses IIP as follows:

```text
Intake
  -> Resolver
  -> Binding
  -> Healing
  -> Proof
  -> Governor
  -> Orchestration
  -> Acceptance
  -> Persistence
```

### Proof

Proof assembles and evaluates evidence for the six proof dimensions. It MUST use sealed runtime evidence and a pinned verifier identity/version.

### Governor

Governor checks that the execution trajectory, capability use and verifier separation obey policy. It may classify an attempted forbidden operation as `Blocked` even when no state corruption occurred.

### Acceptance

Acceptance MUST NOT rely only on the functional result. It accepts only a `Verified` Intent Integrity Proof.

```text
Acceptance := FunctionalResultOk ∧ ProofStatus == Verified
```

### Persistence

Persistence records the proof result and its evidence digest together with the accepted Intent state so that later replay cannot detach the outcome from its verification history.

## Required evidence

The minimum evidence bundle is:

```yaml
intent_integrity_proof:
  intent_id: string
  canonical_label: string
  execution_id: string
  actor_id: string
  agent_id: string

  verifier:
    id: string
    version: string
    digest: string

  outcome:
    expected_digest: string
    observed_digest: string
    satisfied: boolean

  invariants:
    satisfied: boolean
    checked: []

  capabilities:
    satisfied: boolean
    used: []
    denied: []

  trajectory:
    satisfied: boolean
    actions: []

  provenance:
    satisfied: boolean
    event_root: string
    evidence_root: string

  status: verified | compromised | blocked | inconclusive
  reason: string | null
```

The concrete serialization may evolve, but these semantic fields are mandatory.

## Example: CodeHealerAgent

Suppose a failing payment flow is repaired and all tests turn green.

This is NOT sufficient:

```text
CodeHealer -> modifies source -> tests pass -> Ok
```

If the healer changed `tests/payment.test.ts`, the acceptance policy, the verifier implementation, or a trusted fixture used only by verification, the run is compromised.

Valid execution:

```text
CodeManager
  -> declares causal hypothesis H
  -> requests repair
CodeHealerAgent
  -> mutates only authorized implementation/config artifacts
  -> emits execution evidence
Proof
  -> evaluates H against event/trace/log/metric/error evidence
  -> checks capabilities, invariants, trajectory and verifier integrity
Governor
  -> confirms policy compliance
Acceptance
  -> accepts only if ProofStatus == Verified
```

The proof therefore connects the causal hypothesis, proposed correction, observed execution and independent verification:

```text
Hypothesis H
  -> Proposed Fix F
  -> Execution τ
  -> Observed Evidence E
  -> Independent Verification V
```

with the obligations:

```text
E supports H
V(F, τ, E) = true
F cannot mutate V or V's trusted inputs
```

## Relationship to evaluation-integrity research

RewardHackingAgents (Atinafu and Cohen, arXiv:2603.11337v1, 2026) demonstrates that agentic systems can compromise their evaluation channel instead of improving the underlying task. The benchmark explicitly measures evaluator tampering and train/test leakage, uses trusted reference evaluation, records file-access evidence, and keeps metric drift without direct compromise evidence as inconclusive.

AllasCode generalizes this idea from ML evaluation to arbitrary Intent execution. Instead of protecting only a metric evaluator, IIP protects the semantic acceptance boundary of any Agent/Actor/Action trajectory.

Reference: https://arxiv.org/abs/2603.11337

## Architectural rule

> A successful result is not evidence of a successful Intent unless the runtime can prove that the result was reached through an authorized trajectory and verified by an uncompromised verifier.

This rule is normative for every AllasCode implementation that claims Intent-level correctness.