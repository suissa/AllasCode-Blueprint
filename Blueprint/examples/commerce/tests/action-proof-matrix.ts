import type { ActionTestType } from './action-harness.js';

export const ACTION_PROOF_MATRIX: Record<string, Partial<Record<ActionTestType, string[]>>> = {
  RegisterPurchase: {
    unit: ['Invariant:PurchaseSingleStockEffect', 'Policy:IdempotentMutation'],
  },
  IncreaseStock: {
    unit: ['Invariant:StockNonNegative', 'Invariant:StockIdentityStable', 'Invariant:PurchaseSingleStockEffect', 'Policy:IdempotentMutation'],
    security: ['Policy:StockMutationAuthority'],
  },
  DecreaseStock: {
    unit: ['Invariant:StockNonNegative', 'Invariant:StockIdentityStable', 'Invariant:SaleSingleStockEffect', 'Policy:IdempotentMutation'],
    security: ['Policy:AvailableQuantityPolicy', 'Policy:StockMutationAuthority', 'Policy:ResolvedProductsBeforeSaleMutation'],
  },
  DecreaseStockVerified: {
    unit: ['Invariant:StockNonNegative', 'Invariant:StockIdentityStable', 'Invariant:SaleSingleStockEffect', 'Policy:IdempotentMutation'],
    security: ['Policy:AvailableQuantityPolicy', 'Policy:StockMutationAuthority', 'Policy:ResolvedProductsBeforeSaleMutation'],
  },
  RecordPurchaseExpense: {
    unit: ['Invariant:FinancialAppendOnly', 'Invariant:PurchaseSingleStockEffect', 'Policy:IdempotentMutation'],
    security: ['Policy:AppendOnlyFinancialLedger'],
  },
  ResolveSaleProducts: {
    unit: ['Invariant:SaleSingleStockEffect'],
    integration: ['Policy:ResolvedProductsBeforeSaleMutation'],
  },
  CloseSale: {
    unit: ['Invariant:FinancialAppendOnly', 'Invariant:SaleSingleStockEffect', 'Policy:IdempotentMutation'],
    security: ['Policy:AppendOnlyFinancialLedger'],
  },
};

export function claimsFor(action: string, type: ActionTestType): string[] {
  return ACTION_PROOF_MATRIX[action]?.[type] ?? [];
}
