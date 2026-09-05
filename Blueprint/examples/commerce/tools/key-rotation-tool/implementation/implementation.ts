import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { postQuantumSecurity as pq } from '../../../security/tool-services.js';
export const keyRotationTool:ToolImplementation={execute(input){const i=input as {operation?:'create'|'rotate'|'retire';[key:string]:unknown};const r=i?.operation==='create'?pq.createKeySet(i as never):i?.operation==='retire'?pq.retire(i as never):pq.rotate(i as never);return r.outcome==='Ok'?{status:'Ok',event:'KeyRotated',payload:r.value}:{status:'Error',event:'KeyRotationError',payload:{code:r.code}};}};
