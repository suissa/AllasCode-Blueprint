import type {ApplicationApi,ApiEnvelope,ApiPrincipal} from './application-api.js';

export type ChannelCommand={intent:string;payload:unknown;correlation_id:string;idempotency_key:string;principal:ApiPrincipal};

export class ChannelAdapter{
  constructor(private api:ApplicationApi){}
  execute(command:ChannelCommand):Promise<ApiEnvelope>{return this.api.command(command);}
}

// HTTP, WhatsApp and UI adapters translate their transport-specific input into
// ChannelCommand. They never receive an Action/Agent reference and therefore
// cannot bypass the semantic runtime boundary.
