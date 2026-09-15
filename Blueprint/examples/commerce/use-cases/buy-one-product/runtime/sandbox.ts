import { randomUUID } from 'node:crypto';
import type {
  BuyOneProductState,
  InternalResult,
  PaymentAuthorization,
  PaymentCapability,
  RuntimeError,
  RuntimeEvent,
  RuntimeEventSink,
} from './types.js';

export function createState(): BuyOneProductState {
  return {
    products: new Map([
      ['coffee-500g', { product_id: 'coffee-500g', aliases: ['cafe 500g', 'café 500g', 'coffee'], active: true, unit_price: 24.9, currency: 'BRL' }],
    ]),
    stock: new Map([['coffee-500g', 3]]),
    reservations: new Map(),
    payments: new Map(),
    sales: new Map(),
    idempotency: new Map(),
  };
}

export class MemoryEventSink implements RuntimeEventSink {
  readonly events: RuntimeEvent[] = [];
  emit(event: RuntimeEvent): void { this.events.push(event); }
}

export class SandboxPaymentCapability implements PaymentCapability {
  readonly authorizations = new Map<string, PaymentAuthorization>();
  failNextAuthorization = false;

  authorize(input: { trace_id: string; amount: number; currency: 'BRL'; payment_method: string; idempotency_key: string }): InternalResult<PaymentAuthorization, RuntimeError> {
    if (this.failNextAuthorization) {
      this.failNextAuthorization = false;
      return { status: 'Error', error: { code: 'PAYMENT_DECLINED', message: 'Sandbox payment declined' } };
    }
    const existing = [...this.authorizations.values()].find(value => value.trace_id === input.trace_id && value.amount === input.amount && !value.released);
    if (existing) return { status: 'Ok', value: existing };
    const authorization: PaymentAuthorization = {
      payment_id: `pay-${randomUUID()}`,
      trace_id: input.trace_id,
      amount: input.amount,
      currency: input.currency,
      released: false,
    };
    this.authorizations.set(authorization.payment_id, authorization);
    return { status: 'Ok', value: authorization };
  }

  release(input: PaymentAuthorization): InternalResult<PaymentAuthorization, RuntimeError> {
    const current = this.authorizations.get(input.payment_id) ?? input;
    const released = { ...current, released: true };
    this.authorizations.set(released.payment_id, released);
    return { status: 'Ok', value: released };
  }
}
