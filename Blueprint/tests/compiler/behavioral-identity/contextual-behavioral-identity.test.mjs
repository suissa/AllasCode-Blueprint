import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveBehavioralIdentity } from "../../../../src/compiler/behavioral-identity/index.mjs";

test("derives contextual behavioral identity from canonical characteristics", () => {
  const result = deriveBehavioralIdentity({
    entities: [
      {
        name: "Product",
        properties: { sku: "SKU", id: "ProductId" },
        identityKeys: ["sku"],
      },
      {
        name: "Warehouse",
        properties: { location: "GeoCell" },
        canonicalCharacteristics: ["location"],
      },
    ],
    behavioralIdentities: [
      {
        name: "StockBehavioralIdentity",
        context: "Stock",
        couples: ["Product.sku", "Warehouse.location"],
        provides: ["Stock.contextually_complete"],
      },
    ],
  });

  assert.equal(result.pipelineStep, "4.5 Resolving Contextual Behavioral Identity");
  assert.equal(result.semantic.state, "semantically_identified");
  assert.equal(result.couplings[0].state, "behaviorally_concretized");
  assert.deepEqual(result.couplings[0].missing, []);
  assert.equal(result.topology.edges.length, 2);
  assert.equal(result.proofs.every((proof) => proof.status !== "failed"), true);
});

test("marks behavior as partial when required contextual identities are missing", () => {
  const result = deriveBehavioralIdentity({
    entities: [
      {
        name: "User",
        properties: { email: "Email", cpf: "CPF", name: "Text" },
        identityKeys: ["email", "cpf"],
      },
    ],
    behavioralIdentities: [
      {
        name: "CheckoutBehavioralIdentity",
        context: "Order.Checkout",
        requires_identity: [
          "UserIdentity",
          "ProductIdentity",
          "StockIdentity",
          "PaymentIdentity",
          "AddressIdentity",
        ],
        provides: ["Order.contextually_complete"],
      },
    ],
  });

  assert.equal(result.semantic.state, "semantically_identified");
  assert.equal(result.completions[0].state, "behaviorally_partial");
  assert.deepEqual(result.completions[0].missing, [
    "UserIdentity",
    "ProductIdentity",
    "StockIdentity",
    "PaymentIdentity",
    "AddressIdentity",
  ]);
});

