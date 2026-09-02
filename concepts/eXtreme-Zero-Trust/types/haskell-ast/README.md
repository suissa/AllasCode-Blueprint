# Atomic Behavior Semantic Types

Haskell models legal semantic transitions independently of runtime infrastructure. The goal is to validate that only behaviorally valid states can be projected into executable implementations.

The initial sample encodes the security/persistence lifecycle using phantom states.
