# Internal Agent/Tool 2flow graphs

Each functional module owns exactly one `ManagerAgent`. The ManagerAgent is the only Agent allowed to coordinate sub-agents in that module. Sub-agents may call only Tools declared in the same graph. Tools never call Agents. Cross-module communication leaves the module only as an emitted Event/Intent owned by the ManagerAgent.

2flow notation used here:
- `->` event/input entering a node
- `<-` event/output leaving a node
- `->>` node calls Agent/Tool
- `<<-` Agent/Tool is called by a node
- every invocation preserves `context_id`, `correlation_id`, `causation_id`, `idempotency_key`
- every executable node declares explicit `Ok` and `Error` exits
- healing/normalization are explicit Tools, never hidden behavior

Modules: Purchase, Sales, Inventory, Financial, Customer, Supplier, Fiscal, Accounting, Communication, Marketing, Auth, AgentHarness.
