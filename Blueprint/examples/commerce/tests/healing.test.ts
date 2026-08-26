import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionKernel } from '../runtime/execution-kernel.js';
import { diagnoseHealing, executeWithSemanticHealing } from '../runtime/semantic-healing.js';
import type { ActionResult } from '../runtime/types.js';

test('transient Action failure is retried once without transforming the payload', async () => {
  const kernel = await createExecutionKernel();
  let calls = 0;
  const execute = async (): Promise<ActionResult> => {
    calls++;
    if (calls === 1) return { status: 'Error', event: 'StockDecreaseError', payload: { message: 'temporary unavailable' } };
    return { status: 'Ok', event: 'StockDecreased', payload: { sale_id: 's1' } };
  };

  const outcome = await executeWithSemanticHealing(kernel.graph, 'InventoryAgent', 'DecreaseStock', execute);
  assert.equal(calls, 2);
  assert.equal(outcome.result.status, 'Ok');
  assert.equal(outcome.healed, true);
  assert.equal(outcome.decision.kind, 'Retry');
});

test('missing information escalates to Human-in-the-Healing-Loop instead of inventing data', async () => {
  const kernel = await createExecutionKernel();
  const decision = diagnoseHealing(kernel.graph, {
    agent: 'SalesAgent',
    action: 'ResolveSaleProducts',
    attempt: 0,
    error: { status: 'Error', event: 'SaleProductsResolutionError', payload: { message: 'required product evidence missing' } },
  });
  assert.equal(decision.kind, 'Human');
});

test('governed invariant-sensitive failure remains terminal when graph has no reversible path', async () => {
  const kernel = await createExecutionKernel();
  const decision = diagnoseHealing(kernel.graph, {
    agent: 'InventoryAgent',
    action: 'DecreaseStock',
    attempt: 0,
    error: { status: 'Error', event: 'StockDecreaseError', payload: { message: 'insufficient stock' } },
  });
  assert.equal(decision.kind, 'Terminal');
});
