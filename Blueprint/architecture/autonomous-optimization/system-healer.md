# SystemHealer

## Responsibility

SystemHealer owns configuration and runtime healing. It does not modify Action source code.

## Allowed mutation surface

Canonical target:

```text
configs/core.yml
```

or the equivalent approved runtime configuration projection.

## Typical concerns

- worker/concurrency counts
- queue/backpressure thresholds
- timeouts and retry policy
- memory/runtime limits
- connection pools
- scheduling parameters
- resource reservations
- runtime feature flags

## Boundary with CodeHealer

If the root cause is implementation/algorithmic, CodeHealer owns the correction.
If the root cause is configuration/runtime policy, SystemHealer owns the correction.
If evidence is mixed, CodeManager records the hypothesis and the system evaluates the alternatives independently in the clone.

A healing cycle must never mutate code and configuration simultaneously unless an explicit higher-level experiment requires both and can attribute the effect of each change separately.
