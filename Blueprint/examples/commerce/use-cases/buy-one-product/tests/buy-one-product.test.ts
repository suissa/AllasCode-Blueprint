import test from 'node:test';
import assert from 'node:assert/strict';
import { BuyOneProductRuntime } from '../runtime/executor.js';
import { createState, MemoryEventSink, SandboxPaymentCapability } from '../runtime/sandbox.js';

function input(key = 'idem-1') {
  return { buyer_id: 'buyer-1', product_ref: 'coffee', payment_method: 'sandbox', idempotency_key: key };
}

function trace(id = 'trace-buy-1') {
  return { trace_id: id, causation_id: 'event-user-intent-1' };
}

test('runtime executes the behavior and derives the Ok event from the internal result', () => {
  const state = createState();
  const events = new MemoryEventSink();
  const payments = new SandboxPaymentCapability();
  const runtime = new BuyOneProductRuntime(state, payments, events);

  const result = runtime.execute(input(), trace());

  assert.equal(result.status, 'Ok');
  assert.equal(state.stock.get('coffee-500g'), 2);
  assert.equal(state.sales.size, 1);
  assert.equal(events.events.length, 1);
  assert.equal(events.events[0].canonical_label, 'CheckoutAgent.BuyOneProduct.Ok');
  assert.equal(events.events[0].trace_id, 'trace-buy-1');
});

test('out of stock becomes internal Error and Runtime emits canonical Error', () => {
  const state = createState();
  state.stock.set('coffee-500g', 0);
  const events = new MemoryEventSink();
  const payments = new SandboxPaymentCapability();
  const runtime = new BuyOneProductRuntime(state, payments, events);

  const result = runtime.execute(input(), trace());

  assert.equal(result.status, 'Error');
  if (result.status === 'Error') assert.equal(result.error.code, 'OUT_OF_STOCK');
  assert.equal(state.sales.size, 0);
  assert.equal(payments.authorizations.size, 0);
  assert.equal(events.events.at(-1)?.canonical_label, 'CheckoutAgent.BuyOneProduct.Error');
});

test('payment failure compensates the stock reservation before Runtime emits Error', () => {
  const state = createState();
  const events = new MemoryEventSink();
  const payments = new SandboxPaymentCapability();
  payments.failNextAuthorization = true;
  const runtime = new BuyOneProductRuntime(state, payments, events);

  const result = runtime.execute(input(), trace());

  assert.equal(result.status, 'Error');
  const reservation = [...state.reservations.values()][0];
  assert.equal(reservation.released, true);
  assert.equal(state.stock.get('coffee-500g'), 3);
  assert.equal(events.events.at(-1)?.canonical_label, 'CheckoutAgent.BuyOneProduct.Error');
});

test('idempotency prevents duplicate sale and duplicate stock decrement', () => {
  const state = createState();
  const events = new MemoryEventSink();
  const payments = new SandboxPaymentCapability();
  const runtime = new BuyOneProductRuntime(state, payments, events);

  const first = runtime.execute(input('same-key'), trace('trace-1'));
  const second = runtime.execute(input('same-key'), trace('trace-2'));

  assert.equal(first.status, 'Ok');
  assert.equal(second.status, 'Ok');
  assert.equal(state.sales.size, 1);
  assert.equal(state.stock.get('coffee-500g'), 2);
});
