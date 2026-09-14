import { randomUUID } from 'node:crypto';
import type {
  BuyOneProductInput,
  BuyOneProductOutput,
  BuyOneProductState,
  InternalResult,
  PaymentAuthorization,
  PaymentCapability,
  ProductRecord,
  RuntimeError,
  RuntimeEvent,
  RuntimeEventSink,
  StockReservation,
  TraceContext,
} from './types.js';

const BEHAVIOR = 'CheckoutAgent.BuyOneProduct';

type StepOk = Record<string, unknown>;
type StepResult<T extends StepOk> = InternalResult<T, RuntimeError>;

function err(code: string, message: string, details?: unknown): InternalResult<never, RuntimeError> {
  return { status: 'Error', error: { code, message, details } };
}

function resolveProduct(state: BuyOneProductState, productRef: string): InternalResult<ProductRecord, RuntimeError> {
  const normalized = productRef.trim().toLowerCase();
  const matches = [...state.products.values()].filter(product =>
    product.active && (product.product_id.toLowerCase() === normalized || product.aliases.some(alias => alias.toLowerCase() === normalized)),
  );
  if (matches.length !== 1) return err('PRODUCT_NOT_UNIQUE', 'Product reference must resolve to exactly one active product', { product_ref: productRef, matches: matches.length });
  return { status: 'Ok', value: matches[0] };
}

function resolveAuthoritativePrice(product: ProductRecord): InternalResult<{ product: ProductRecord; amount: number; currency: ProductRecord['currency'] }, RuntimeError> {
  if (product.unit_price < 0) return err('INVALID_AUTHORITATIVE_PRICE', 'Authoritative price cannot be negative');
  return { status: 'Ok', value: { product, amount: product.unit_price, currency: product.currency } };
}

function reserveOneStockUnit(state: BuyOneProductState, trace: TraceContext, product: ProductRecord): InternalResult<StockReservation, RuntimeError> {
  const reservationId = `${trace.trace_id}:${product.product_id}:1`;
  const existing = state.reservations.get(reservationId);
  if (existing && !existing.released) return { status: 'Ok', value: existing };
  const available = state.stock.get(product.product_id) ?? 0;
  if (available < 1) return err('OUT_OF_STOCK', 'No stock unit is available', { product_id: product.product_id, available });
  const reservation: StockReservation = { reservation_id: reservationId, trace_id: trace.trace_id, product_id: product.product_id, quantity: 1, committed: false, released: false };
  state.reservations.set(reservationId, reservation);
  return { status: 'Ok', value: reservation };
}

function releaseStockReservation(state: BuyOneProductState, reservation: StockReservation): InternalResult<StockReservation, RuntimeError> {
  if (reservation.committed) return err('RESERVATION_ALREADY_COMMITTED', 'Committed stock cannot be released as a reservation');
  const released = { ...reservation, released: true };
  state.reservations.set(reservation.reservation_id, released);
  return { status: 'Ok', value: released };
}

function registerSale(
  state: BuyOneProductState,
  trace: TraceContext,
  input: BuyOneProductInput,
  product: ProductRecord,
  payment: PaymentAuthorization,
): InternalResult<BuyOneProductOutput, RuntimeError> {
  const previous = state.idempotency.get(input.idempotency_key);
  if (previous) return { status: 'Ok', value: previous };
  if (payment.trace_id !== trace.trace_id || payment.released) return err('INVALID_PAYMENT_AUTHORIZATION', 'Sale requires an active payment authorization bound to the same trace');
  const saleId = `sale-${randomUUID()}`;
  const sale = {
    sale_id: saleId,
    trace_id: trace.trace_id,
    buyer_id: input.buyer_id,
    product_id: product.product_id,
    quantity: 1 as const,
    amount: payment.amount,
    currency: payment.currency,
    payment_id: payment.payment_id,
  };
  state.sales.set(saleId, sale);
  const output: BuyOneProductOutput = { sale_id: saleId, product_id: product.product_id, quantity: 1, amount: payment.amount, currency: payment.currency, payment_id: payment.payment_id };
  return { status: 'Ok', value: output };
}

function commitStockReservation(state: BuyOneProductState, trace: TraceContext, reservation: StockReservation): InternalResult<StockReservation, RuntimeError> {
  const current = state.reservations.get(reservation.reservation_id);
  if (!current || current.released) return err('INVALID_STOCK_RESERVATION', 'Stock reservation is missing or released');
  if (current.trace_id !== trace.trace_id) return err('RESERVATION_TRACE_MISMATCH', 'Reservation belongs to another trace');
  if (current.committed) return { status: 'Ok', value: current };
  const available = state.stock.get(current.product_id) ?? 0;
  if (available < 1) return err('STOCK_COMMIT_UNDERFLOW', 'Stock cannot become negative');
  state.stock.set(current.product_id, available - 1);
  const committed = { ...current, committed: true };
  state.reservations.set(current.reservation_id, committed);
  return { status: 'Ok', value: committed };
}

export class BuyOneProductRuntime {
  constructor(
    private readonly state: BuyOneProductState,
    private readonly payments: PaymentCapability,
    private readonly events: RuntimeEventSink,
  ) {}

  execute(input: BuyOneProductInput, trace: TraceContext): InternalResult<BuyOneProductOutput, RuntimeError> {
    const prior = this.state.idempotency.get(input.idempotency_key);
    if (prior) return this.finish({ status: 'Ok', value: prior }, trace);

    const product = resolveProduct(this.state, input.product_ref);
    if (product.status === 'Error') return this.finish(product, trace);

    const price = resolveAuthoritativePrice(product.value);
    if (price.status === 'Error') return this.finish(price, trace);

    const reservation = reserveOneStockUnit(this.state, trace, product.value);
    if (reservation.status === 'Error') return this.finish(reservation, trace);

    const payment = this.payments.authorize({
      trace_id: trace.trace_id,
      amount: price.value.amount,
      currency: price.value.currency,
      payment_method: input.payment_method,
      idempotency_key: input.idempotency_key,
    });
    if (payment.status === 'Error') {
      releaseStockReservation(this.state, reservation.value);
      return this.finish(payment, trace);
    }
    this.state.payments.set(payment.value.payment_id, payment.value);

    const sale = registerSale(this.state, trace, input, product.value, payment.value);
    if (sale.status === 'Error') {
      this.payments.release(payment.value);
      releaseStockReservation(this.state, reservation.value);
      return this.finish(sale, trace);
    }

    const commit = commitStockReservation(this.state, trace, reservation.value);
    if (commit.status === 'Error') {
      this.state.sales.delete(sale.value.sale_id);
      this.payments.release(payment.value);
      releaseStockReservation(this.state, reservation.value);
      return this.finish(commit, trace);
    }

    this.state.idempotency.set(input.idempotency_key, sale.value);
    return this.finish({ status: 'Ok', value: sale.value }, trace);
  }

  private finish<T>(result: InternalResult<T, RuntimeError>, trace: TraceContext): InternalResult<T, RuntimeError> {
    const event: RuntimeEvent = {
      event_id: randomUUID(),
      trace_id: trace.trace_id,
      causation_id: trace.causation_id,
      canonical_label: `${BEHAVIOR}.${result.status}`,
      occurred_at: new Date().toISOString(),
      payload: result.status === 'Ok' ? result.value : result.error,
    };
    this.events.emit(event);
    return result;
  }
}
