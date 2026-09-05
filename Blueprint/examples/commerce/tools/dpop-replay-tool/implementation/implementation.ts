import type { ToolImplementation } from '../../../runtime/tool-registry.js';
import { DpopReplayStore } from '../../../security/dpop.js';
const store=new DpopReplayStore();
export const dpopReplayTool:ToolImplementation={execute(input){const i=input as {key?:string;now_ms?:number;ttl_ms?:number};if(typeof i?.key!=='string'||typeof i.now_ms!=='number'||typeof i.ttl_ms!=='number')return{status:'Error',event:'DpopReplayDetected',payload:{code:'InvalidReplayClaim'}};return store.accept(i.key,i.now_ms,i.ttl_ms)?{status:'Ok',event:'DpopProofClaimed',payload:{claimed:true}}:{status:'Error',event:'DpopReplayDetected',payload:{code:'DpopReplayDetected'}};}};
