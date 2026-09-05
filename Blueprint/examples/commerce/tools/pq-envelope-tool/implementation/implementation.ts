import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { postQuantumSecurity as pq } from '../../../security/tool-services.js';
export const pqEnvelopeTool:ToolImplementation={execute(input){const i=input as {operation?:'encrypt'|'decrypt';[key:string]:unknown};const r=i?.operation==='decrypt'?pq.decrypt(i as never):pq.encrypt(i as never);return r.outcome==='Ok'?{status:'Ok',event:'PqEnvelopeProtected',payload:{value:r.value}}:{status:'Error',event:'PqEnvelopeError',payload:{code:r.code}};}};
