import { randomUUID } from 'node:crypto';

export type AuthStrength='standard'|'strong';
export type SessionState='active'|'revoked'|'expired';
export type PrincipalType='operator'|'customer';
export type Role='admin'|'manager'|'operator'|'viewer';

export interface AuthSession {
  session_id:string;
  principal_id:string;
  principal_type:PrincipalType;
  role:Role;
  capabilities:string[];
  context_id:string;
  auth_strength:AuthStrength;
  created_at:string;
  expires_at:string;
  state:SessionState;
  revoked_at?:string;
}

export interface AuthAuditEvent {
  event:'Session.Created'|'Session.Revoked'|'Authorization.Ok'|'Authorization.Error'|'WhatsAppIdentity.Linked';
  at:string;
  session_id?:string;
  principal_id:string;
  context_id:string;
  capability?:string;
  reason?:string;
}

const roleCapabilities:Record<Role,string[]>={
  admin:['*'],
  manager:['inventory.read','inventory.adjust','sales.read','sales.manage','purchases.read','purchases.manage','customers.read','suppliers.read','financial.read','settings.manage'],
  operator:['inventory.read','sales.read','sales.manage','purchases.read','purchases.manage','customers.read','suppliers.read'],
  viewer:['inventory.read','sales.read','purchases.read','financial.read']
};

export class AuthSessionService {
  private readonly sessions=new Map<string,AuthSession>();
  private readonly whatsappLinks=new Map<string,{principal_id:string;principal_type:PrincipalType;context_id:string}>();
  readonly audit:AuthAuditEvent[]=[];

  createSession(input:{principal_id:string;principal_type:PrincipalType;role:Role;context_id:string;auth_strength?:AuthStrength;ttl_ms:number;now:string;capabilities?:string[]}):AuthSession {
    const session:AuthSession={session_id:randomUUID(),principal_id:input.principal_id,principal_type:input.principal_type,role:input.role,capabilities:[...new Set([...(roleCapabilities[input.role]??[]),...(input.capabilities??[])])],context_id:input.context_id,auth_strength:input.auth_strength??'standard',created_at:input.now,expires_at:new Date(new Date(input.now).getTime()+input.ttl_ms).toISOString(),state:'active'};
    this.sessions.set(session.session_id,session);
    this.audit.push({event:'Session.Created',at:input.now,session_id:session.session_id,principal_id:session.principal_id,context_id:session.context_id});
    return {...session,capabilities:[...session.capabilities]};
  }

  revoke(session_id:string,now:string):boolean { const s=this.sessions.get(session_id); if(!s||s.state!=='active')return false; s.state='revoked';s.revoked_at=now;this.audit.push({event:'Session.Revoked',at:now,session_id,principal_id:s.principal_id,context_id:s.context_id});return true; }

  get(session_id:string,now:string):AuthSession|undefined { const s=this.sessions.get(session_id); if(!s)return undefined; if(s.state==='active'&&new Date(now).getTime()>=new Date(s.expires_at).getTime())s.state='expired'; return {...s,capabilities:[...s.capabilities]}; }

  authorize(input:{session_id:string;capability:string;context_id:string;now:string;sensitive?:boolean}){
    const s=this.get(input.session_id,input.now);
    if(!s||s.state!=='active')return this.deny(s,input,'SessionInactive');
    if(s.context_id!==input.context_id)return this.deny(s,input,'CrossContextDenied');
    if(input.sensitive&&s.auth_strength!=='strong')return this.deny(s,input,'StrongAuthorizationRequired');
    const allowed=s.capabilities.includes('*')||s.capabilities.includes(input.capability);
    if(!allowed)return this.deny(s,input,'CapabilityDenied');
    this.audit.push({event:'Authorization.Ok',at:input.now,session_id:s.session_id,principal_id:s.principal_id,context_id:s.context_id,capability:input.capability});
    return {outcome:'Ok' as const,session:s};
  }

  private deny(s:AuthSession|undefined,input:{session_id:string;capability:string;context_id:string;now:string},reason:string){this.audit.push({event:'Authorization.Error',at:input.now,session_id:input.session_id,principal_id:s?.principal_id??'unknown',context_id:input.context_id,capability:input.capability,reason});return{outcome:'Error' as const,code:reason};}

  linkWhatsApp(input:{whatsapp:string;principal_id:string;principal_type:PrincipalType;context_id:string;now:string}){const key=input.whatsapp.replace(/\D/g,'');this.whatsappLinks.set(key,{principal_id:input.principal_id,principal_type:input.principal_type,context_id:input.context_id});this.audit.push({event:'WhatsAppIdentity.Linked',at:input.now,principal_id:input.principal_id,context_id:input.context_id});return{outcome:'Ok' as const};}
  resolveWhatsApp(whatsapp:string){const link=this.whatsappLinks.get(whatsapp.replace(/\D/g,''));return link?{...link}:undefined;}
}
