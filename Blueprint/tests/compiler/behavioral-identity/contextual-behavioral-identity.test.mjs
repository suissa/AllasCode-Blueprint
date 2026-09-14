import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveBehavioralIdentity } from "../../../../src/compiler/behavioral-identity/index.mjs";

const stockIR = (couples = ["Product.sku", "Warehouse.location"]) => ({
  entities: [
    { name: "Product", properties: { sku: "SKU" }, identityKeys: ["sku"] },
    {
      name: "Warehouse",
      properties: { location: "GeoCell" },
      canonicalCharacteristics: ["location"],
    },
  ],
  behavioralIdentities: [{
    name: "StockBehavioralIdentity",
    context: "Stock",
    couples,
    provides: ["Stock.contextually_complete"],
  }],
});

test("derives a deterministic context-bound composite behavioral identity", () => {
  const result = deriveBehavioralIdentity(stockIR());
  const reversed = deriveBehavioralIdentity(
    stockIR(["Warehouse.location", "Product.sku"]),
  );

  assert.equal(result.semantic.state, "semantically_identified");
  assert.equal(result.couplings[0].state, "behaviorally_concretized");
  assert.match(result.couplings[0].identityId, /^cbi:sha256:[a-f0-9]{64}$/);
  assert.equal(result.couplings[0].identityId, reversed.couplings[0].identityId);
  assert.equal(result.completions[0].state, "contextually_complete");
  assert.equal(result.topology.edges.length, 2);
  assert.equal(result.proofs.every(({ status }) => status === "proved"), true);
});

test("changes the derived identity when the context changes", () => {
  const stock = deriveBehavioralIdentity(stockIR());
  const other = stockIR();
  other.behavioralIdentities[0].context = "Transfer";
  assert.notEqual(
    stock.couplings[0].identityId,
    deriveBehavioralIdentity(other).couplings[0].identityId,
  );
});

test("rejects a canonical characteristic whose property is undeclared", () => {
  const ir = stockIR();
  delete ir.entities[1].properties.location;
  const result = deriveBehavioralIdentity(ir);

  assert.equal(result.couplings[0].state, "behaviorally_partial");
  assert.deepEqual(result.couplings[0].missing, ["Warehouse.location"]);
  assert.equal(result.topology.edges.length, 0);
  assert.equal(result.diagnostics.some(({ code }) => code === "CBI_INVALID_PROPERTY"), true);
  assert.equal(result.proofs.some(({ status }) => status === "failed"), true);
});

test("normalizes object participants and never emits undefined paths", () => {
  const result = deriveBehavioralIdentity(
    stockIR([
      { entity: "Product", property: "sku" },
      { entity: "Warehouse", property: "location" },
    ]),
  );
  assert.equal(result.couplings[0].state, "behaviorally_concretized");
  assert.deepEqual(
    result.couplings[0].participants.map(({ path }) => path),
    ["Product.sku", "Warehouse.location"],
  );
  assert.equal(result.topology.edges.some(({ from }) => from === undefined), false);
});

test("requires a contextual coupling to join distinct entities", () => {
  const ir = stockIR(["Product.sku", "Product.sku"]);
  const result = deriveBehavioralIdentity(ir);
  assert.equal(result.couplings[0].state, "behaviorally_partial");
  assert.equal(result.topology.edges.length, 0);
  assert.match(result.couplings[0].structuralErrors[0], /distinct entities/);
});

test("isolates provided identities by exact behavior context", () => {
  const ir = stockIR();
  ir.contextualIdentities = [{
    name: "PaymentIdentity",
    context: "Billing",
    couples: ["Product.sku", "Warehouse.location"],
  }];
  ir.behavioralIdentities.push({
    name: "CheckoutBehavioralIdentity",
    context: "Order.Checkout",
    requires_identity: ["PaymentIdentity"],
  });
  const result = deriveBehavioralIdentity(ir);
  const checkout = result.completions.find(
    ({ name }) => name === "CheckoutBehavioralIdentity",
  );
  assert.equal(checkout.state, "behaviorally_partial");
  assert.deepEqual(checkout.missing, ["PaymentIdentity"]);
});

test("reports semantic identity independently for every entity", () => {
  const ir = stockIR();
  ir.entities.push({ name: "Anonymous", properties: { value: "Text" } });
  const result = deriveBehavioralIdentity(ir);
  assert.equal(result.semantic.state, "semantically_partial");
  assert.equal(
    result.semantic.entities.find(({ entity }) => entity === "Product").state,
    "semantically_identified",
  );
  assert.equal(
    result.semantic.entities.find(({ entity }) => entity === "Anonymous").state,
    "semantically_partial",
  );
});

test("keeps checkout partial until every same-context identity is concretized", () => {
  const result = deriveBehavioralIdentity({
    ...stockIR(),
    contextualIdentities: [{
      name: "UserIdentity",
      context: "Order.Checkout",
      couples: ["Product.sku", "Warehouse.location"],
    }],
    behavioralIdentities: [{
      name: "CheckoutBehavioralIdentity",
      context: "Order.Checkout",
      requires_identity: [
        "UserIdentity", "ProductIdentity", "StockIdentity",
        "PaymentIdentity", "AddressIdentity", "SessionIdentity",
      ],
    }],
  });
  assert.deepEqual(result.completions[0].missing, [
    "ProductIdentity", "StockIdentity", "PaymentIdentity",
    "AddressIdentity", "SessionIdentity",
  ]);
  assert.equal(result.completions[0].state, "behaviorally_partial");
});
