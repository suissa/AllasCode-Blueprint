import {SemanticUiClient,type SemanticEnvelope} from './api-client.js';
import {Card,Field,StateView,Status,Table} from './design-system.js';

export type BusinessProfile={name:string;legal_name?:string;document?:string;phone?:string;timezone:string;currency:string};
export type IntegrationStatus={provider:string;channel:string;status:'connected'|'degraded'|'disconnected';last_check_at?:string;configured:boolean};
export type UserRoleRow={user_id:string;display_name:string;role:string;status:'active'|'disabled';last_seen_at?:string};
export type OperationalSettings={minimum_stock_default:number;notification_preferences:{healing_required:boolean;low_stock:boolean;payment_failed:boolean};};
export type SecretWrite={provider:string;secret_name:string;secret_value:string};

function esc(v:unknown){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}

export class AdministrationSettingsUi{
  constructor(private readonly api:SemanticUiClient){}

  profile(correlationId:string){return this.api.query('BusinessProfileProjection',{},correlationId,1,1);}
  integrations(correlationId:string){return this.api.query('IntegrationStatusProjection',{},correlationId,1,100);}
  users(correlationId:string,page=1,pageSize=25){return this.api.query('UsersRolesProjection',{},correlationId,page,pageSize);}
  operationalSettings(correlationId:string){return this.api.query('OperationalSettingsProjection',{},correlationId,1,1);}
  auditTrail(correlationId:string,page=1,pageSize=50){return this.api.query('ConfigurationAuditProjection',{},correlationId,page,pageSize);}

  saveProfile(profile:BusinessProfile,correlationId:string,idempotencyKey:string){return this.api.command('UpdateBusinessProfileIntent',profile,correlationId,idempotencyKey);}
  saveOperationalSettings(settings:OperationalSettings,correlationId:string,idempotencyKey:string){return this.api.command('UpdateOperationalSettingsIntent',settings,correlationId,idempotencyKey);}
  saveUserRole(input:{user_id:string;role:string;status:'active'|'disabled'},correlationId:string,idempotencyKey:string){return this.api.command('UpdateUserRoleIntent',input,correlationId,idempotencyKey);}
  saveIntegrationConfig(input:{provider:string;enabled:boolean;config:Record<string,unknown>},correlationId:string,idempotencyKey:string){return this.api.command('UpdateIntegrationConfigIntent',input,correlationId,idempotencyKey);}
  writeSecret(secret:SecretWrite,correlationId:string,idempotencyKey:string){return this.api.command('StoreIntegrationSecretIntent',secret,correlationId,idempotencyKey);}
  activateConfiguration(input:{scope:string;version:string},correlationId:string,idempotencyKey:string){return this.api.command('ActivateValidatedConfigurationIntent',input,correlationId,idempotencyKey);}

  renderProfile(input:{kind:'loading'}|{kind:'error';message:string}|{kind:'ready';profile:BusinessProfile;result?:SemanticEnvelope}){
    if(input.kind==='loading')return StateView('loading');if(input.kind==='error')return StateView('error',input.message);
    const p=input.profile;const validation=input.result?.outcome==='Error'?`<div role="alert">${esc(input.result.error?.message??'Configuração inválida.')}</div>`:'';
    return `<section aria-labelledby="business-profile-title"><h1 id="business-profile-title">Identidade do negócio</h1>${validation}<form data-preserve-input="true">${Field({id:'business-name',label:'Nome',value:p.name,required:true})}${Field({id:'business-legal-name',label:'Razão social',value:p.legal_name??''})}${Field({id:'business-document',label:'Documento',value:p.document??''})}${Field({id:'business-phone',label:'Telefone',value:p.phone??''})}${Field({id:'business-timezone',label:'Fuso horário',value:p.timezone,required:true})}${Field({id:'business-currency',label:'Moeda',value:p.currency,required:true})}<button type="submit">Validar alteração</button></form></section>`;
  }

  renderIntegrations(items:IntegrationStatus[]){
    return Card({title:'Integrações',body:Table({caption:'Status das integrações',headers:['Provider','Canal','Estado','Configurado','Última verificação'],rows:items.map(i=>[i.provider,i.channel,Status({label:i.status,tone:i.status==='connected'?'success':i.status==='degraded'?'warning':'danger'}),i.configured?'Sim':'Não',i.last_check_at??'—'])})});
  }

  renderUsers(items:UserRoleRow[]){
    return Card({title:'Usuários e papéis',body:Table({caption:'Usuários autorizados',headers:['Usuário','Papel','Estado','Último acesso'],rows:items.map(u=>[u.display_name,u.role,Status({label:u.status,tone:u.status==='active'?'success':'neutral'}),u.last_seen_at??'—'])})});
  }

  renderOperationalSettings(settings:OperationalSettings){
    return `<section aria-labelledby="operational-settings-title"><h2 id="operational-settings-title">Configurações operacionais</h2><form data-preserve-input="true">${Field({id:'minimum-stock-default',label:'Estoque mínimo padrão',type:'number',value:String(settings.minimum_stock_default),required:true})}<fieldset><legend>Notificações</legend><label><input type="checkbox" name="healing_required" ${settings.notification_preferences.healing_required?'checked':''}/> Healing exige humano</label><label><input type="checkbox" name="low_stock" ${settings.notification_preferences.low_stock?'checked':''}/> Estoque baixo</label><label><input type="checkbox" name="payment_failed" ${settings.notification_preferences.payment_failed?'checked':''}/> Falha de pagamento</label></fieldset><button type="submit">Validar alteração</button></form></section>`;
  }

  renderSecretEditor(provider:string,secretName:string){
    return `<form aria-label="Segredo de integração" autocomplete="off"><input type="hidden" name="provider" value="${esc(provider)}"/><label for="integration-secret">${esc(secretName)}</label><input id="integration-secret" name="secret_value" type="password" value="" autocomplete="new-password" required/><small>Segredos são write-only: o valor armazenado nunca é retornado pela API.</small><button type="submit">Salvar segredo</button></form>`;
  }
}

// Reads come only from projections. Changes are proposed through Intents, validated/audited server-side and activated separately.
// Secret projections expose configured=true/false only; secret material is never rendered back to the browser.