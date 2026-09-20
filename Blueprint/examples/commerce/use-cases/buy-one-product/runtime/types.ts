export type Currency = 'BRL';

export type InternalResult<T, E> =
  | { status: 'Ok'; value: T }
  | { status: 'Error'; error: E };

export interface RuntimeError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ProductRecord {
  product_id: string;
  aliases: string[];
  active: boolean;
  unit_price: number;
  currency: Currency;
}

export interface StockReservation {
  reservation_id: string;
  trace_id: string;
  product_id: string;
  quantity: 1;
  committed: boolean;
  released: boolean;
}

export interface PaymentAuthorization {
  payment_id: string;
  trace_id: string;
  amount: number;
  currency: Currency;
  released: boolean;
}

export interface SaleRecord {
  sale_id: string;
  trace_id: string;
  buyer_id: string;
  product_id: string;
  quantity: 1;
  amount: number;
  currency: Currency;
  payment_id: string;
}

export interface BuyOneProductInput {
  buyer_id: string;
  product_ref: string;
  payment_method: string;
  idempotency_key: string;
}

export interface BuyOneProductOutput {
  sale_id: string;
  product_id: string;
  quantity: 1;
  amount: number;
  currency: Currency;
  payment_id: string;
}

export interface TraceContext {
  trace_id: string;
  causation_id: string;
}

export interface RuntimeEvent<T = unknown> {
  event_id: string;
  trace_id: string;
  causation_id: string;
  canonical_label: string;
  occurred_at: string;
  payload: T;
}

export interface BuyOneProductState {
  products: Map<string, ProductRecord>;
  stock: Map<string, number>;
  reservations: Map<string, StockReservation>;
  payments: Map<string, PaymentAuthorization>;
  sales: Map<string, SaleRecord>;
  idempotency: Map<string, BuyOneProductOutput>;
}

export interface RuntimeEventSink {
  emit(event: RuntimeEvent): void;
}

export interface RuntimeActionContext {
  state: BuyOneProductState;
  trace: TraceContext;
}

export interface PaymentCapability {
  authorize(input: { trace_id: string; amount: number; currency: Currency; payment_method: string; idempotency_key: string }): InternalResult<PaymentAuthorization, RuntimeError>;
  release(input: PaymentAuthorization): InternalResult<PaymentAuthorization, RuntimeError>;
}
