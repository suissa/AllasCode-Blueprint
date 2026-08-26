# Actors

Actors are runtime execution identities. Each actor has one mailbox, one supervisor policy, one bounded set of actions, and no direct knowledge of another actor's state. Agents address actors by semantic identity; actors execute messages serially and return action results.

The example keeps actor execution in memory but preserves the contracts required to project actors later to threads, processes, services, workers, or distributed runtimes.
