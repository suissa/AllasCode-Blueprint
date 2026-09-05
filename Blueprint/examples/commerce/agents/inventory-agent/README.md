# InventoryAgent

Knowledge boundary for inventory. It delegates stock mutations to `InventoryActor` and never accesses purchase, sale, or financial state outside event payloads.
