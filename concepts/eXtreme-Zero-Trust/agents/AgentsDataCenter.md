# AgentsDataCenter

`AgentsDataCenter` is a propagation coordinator, not a global value authority.

Responsibilities:

- know which configured agents are expected to observe a confirmed CDC revision;
- track acknowledgements after local application;
- retry pending agents after timeout;
- emit a convergence certificate when every required participant has confirmed.

The CRDT decides deterministic state merge. The DataCenter closes the operational anti-entropy loop. It MUST be shardable/recoverable and MUST NOT become the only recovery source for an actor.
