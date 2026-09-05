import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { dpopSecurity } from '../../../security/tool-services.js';
export const dpopTokenBindingTool:ToolImplementation={execute(input){const i=input as Parameters<typeof dpopSecurity.issueBoundAccessToken>[0];const r=dpopSecurity.issueBoundAccessToken(i);return r.outcome==='Ok'?{status:'Ok',event:'DpopTokenBound',payload:r.value}:{status:'Error',event:'DpopTokenBindingError',payload:{code:r.code}};}};
