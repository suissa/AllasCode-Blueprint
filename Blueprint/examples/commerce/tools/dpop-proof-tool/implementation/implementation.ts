import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { dpopSecurity } from '../../../security/tool-services.js';
export const dpopProofTool:ToolImplementation={execute(input){const i=input as Parameters<typeof dpopSecurity.verifyProtectedRequest>[0];const r=dpopSecurity.verifyProtectedRequest(i);return r.outcome==='Ok'?{status:'Ok',event:'DpopProofVerified',payload:r.value}:{status:'Error',event:'DpopProofError',payload:{code:r.code}};}};
