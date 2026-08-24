export type Money = number;

export function isBetween(value: Money, lower: Money, upper: Money): boolean {
  return value >= lower && value <= upper;
}

export const canonicalLabel = 'Payment.amount.isBetween';
