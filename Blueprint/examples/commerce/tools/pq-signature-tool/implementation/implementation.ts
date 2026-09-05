import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { postQuantumSecurity as pq } from '../../../security/tool-services.js';
export const pqSignatureTool:ToolImplementation={execute(input){const i=input as {operation?:'sign'|'verify';[key:string]:unknown};const r=i?.operation==='verify'?pq.verify(i as never):pq.sign(i as never);return r.outcome==='Ok'?{status:'Ok',event:'PqSignatureVerified',payload:r.value}:{status:'Error',event:'PqSignatureError',payload:{code:r.code}};}};
