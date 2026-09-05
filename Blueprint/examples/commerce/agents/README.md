# Agents

Agents are semantic holders of bounded knowledge. They do not mutate domain state directly; actions perform state transitions. An agent may validate messages entering or leaving its context and may route only information that its declared context permits.

This example uses four agents: `PurchaseAgent`, `InventoryAgent`, `FinancialAgent`, and `SalesAgent`. Cross-domain communication occurs through events, never by one agent reading another agent's private state.
