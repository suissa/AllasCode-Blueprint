import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type HealingCaseStatus = 'pending-human' | 'resumed' | 'expired' | 'terminal';
export interface HealingCase {
  id: string;
  intent: string;
  agent: string;
  action: string;
  original_event: string;
  original_payload: unknown;
  original_payload_hash: string;
  error_event: string;
  error_message: string;
  correlation_id: string;
  resume_token: string;
  created_at: string;
  expires_at: string;
  status: HealingCaseStatus;
  attempts: number;
}
export interface HealingAuditEntry {
  at: string;
  case_id?: string;
  kind: 'attempt' | 'retry' | 'fallback' | 'human-escalation' | 'resume' | 'resolution' | 'terminal';
  agent: string;
  action: string;
  detail: string;
}
export interface HealingCaseStore {
  hash(payload: unknown): string;
  audit(entry: Omit<HealingAuditEntry,'at'>): void;
  auditLog(): readonly HealingAuditEntry[];
  listPending(): HealingCase[];
  get(caseId: string): HealingCase | undefined;
  escalate(input: Omit<HealingCase,'id'|'resume_token'|'created_at'|'expires_at'|'status'|'attempts'|'original_payload_hash'>, ttlMs: number): HealingCase;
  consumeResume(caseId: string, token: string): HealingCase;
}
interface HealingStoreSnapshot { version: 1; cases: HealingCase[]; audits: HealingAuditEntry[]; }
abstract class HealingStoreBase implements HealingCaseStore {
  protected readonly cases = new Map<string, HealingCase>();
  protected readonly audits: HealingAuditEntry[] = [];
  protected hydrate(snapshot?: Partial<HealingStoreSnapshot>): void { for(const value of snapshot?.cases??[])this.cases.set(value.id,value);this.audits.push(...(snapshot?.audits??[])); }
  protected snapshot(): HealingStoreSnapshot { return {version:1,cases:[...this.cases.values()],audits:[...this.audits]}; }
  protected changed(): void {}
  hash(payload: unknown): string { return createHash('sha256').update(JSON.stringify(payload??null)).digest('hex'); }
  audit(entry: Omit<HealingAuditEntry,'at'>): void { this.audits.push({at:new Date().toISOString(),...entry});this.changed(); }
  auditLog(): readonly HealingAuditEntry[] { return this.audits; }
  listPending(): HealingCase[] { const now=Date.now();let dirty=false;for(const value of this.cases.values())if(value.status==='pending-human'&&Date.parse(value.expires_at)<=now){value.status='expired';dirty=true;}if(dirty)this.changed();return [...this.cases.values()].filter(value=>value.status==='pending-human'); }
  get(caseId:string):HealingCase|undefined{return this.cases.get(caseId);}
  escalate(input:Omit<HealingCase,'id'|'resume_token'|'created_at'|'expires_at'|'status'|'attempts'|'original_payload_hash'>,ttlMs:number):HealingCase{
    const existing=this.listPending().find(value=>value.correlation_id===input.correlation_id&&value.action===input.action);if(existing)return existing;
    const now=Date.now();const value:HealingCase={...input,original_payload_hash:this.hash(input.original_payload),id:randomUUID(),resume_token:randomUUID(),created_at:new Date(now).toISOString(),expires_at:new Date(now+ttlMs).toISOString(),status:'pending-human',attempts:0};
    this.cases.set(value.id,value);this.audits.push({at:new Date().toISOString(),kind:'human-escalation',case_id:value.id,agent:value.agent,action:value.action,detail:value.error_message});this.changed();return value;
  }
  consumeResume(caseId:string,token:string):HealingCase{
    const value=this.cases.get(caseId);if(!value)throw new Error('Healing case not found');if(value.status!=='pending-human')throw new Error('Healing case already consumed');if(value.resume_token!==token)throw new Error('Invalid healing resume token');
    if(Date.parse(value.expires_at)<=Date.now()){value.status='expired';this.changed();throw new Error('Healing case expired');}
    value.status='resumed';value.attempts+=1;this.audits.push({at:new Date().toISOString(),kind:'resume',case_id:value.id,agent:value.agent,action:value.action,detail:'Human context accepted for single resume.'});this.changed();return value;
  }
}
export class InMemoryHealingStore extends HealingStoreBase {}
export class JsonFileHealingStore extends HealingStoreBase {
  constructor(readonly filePath:string){super();if(existsSync(filePath)){const raw=readFileSync(filePath,'utf8').trim();if(raw)this.hydrate(JSON.parse(raw) as HealingStoreSnapshot);}}
  protected override changed():void{mkdirSync(dirname(this.filePath),{recursive:true});const temporary=`${this.filePath}.${process.pid}.tmp`;writeFileSync(temporary,`${JSON.stringify(this.snapshot(),null,2)}\n`,'utf8');renameSync(temporary,this.filePath);}
}
