import type { ToolImplementation } from '../../../runtime/tool-registry.js';

export const purchaseEvidenceReader: ToolImplementation = {
  async execute(input) {
    if (!input || typeof input !== 'object' || !('evidence' in input)) {
      return { status: 'Error', event: 'PurchaseEvidenceReadError', payload: { message: 'evidence is required' } };
    }
    const evidence = (input as { evidence: unknown }).evidence;
    return { status: 'Ok', event: 'PurchaseEvidenceRead', payload: { purchase: evidence } };
  },
};
