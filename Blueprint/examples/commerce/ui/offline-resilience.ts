export type DraftRecord<T=unknown>={key:string;value:T;updated_at:string};
export interface DraftStore{load<T>(key:string):Promise<DraftRecord<T>|undefined>;save<T>(record:DraftRecord<T>):Promise<void>;remove(key:string):Promise<void>;}
export interface ProjectionRefresher{refresh(view:string):Promise<void>;}
export interface NetworkState{isOnline():boolean;}

export class MemoryDraftStore implements DraftStore{
  private readonly records=new Map<string,DraftRecord>();
  async load<T>(key:string){return this.records.get(key) as DraftRecord<T>|undefined;}
  async save<T>(record:DraftRecord<T>){this.records.set(record.key,record);}
  async remove(key:string){this.records.delete(key);}
}

export class OfflineResilienceCoordinator{
  private readonly staleViews=new Set<string>();
  private readonly submitted=new Set<string>();
  constructor(private readonly drafts:DraftStore,private readonly network:NetworkState,private readonly refresher:ProjectionRefresher,private readonly now:()=>string=()=>new Date().toISOString()){}

  async preserveDraft<T>(key:string,value:T){await this.drafts.save({key,value,updated_at:this.now()});}
  async restoreDraft<T>(key:string){return this.drafts.load<T>(key);}
  async clearDraft(key:string){await this.drafts.remove(key);}
  markProjectionStale(view:string){this.staleViews.add(view);}
  canSubmitCriticalMutation(idempotencyKey:string){return this.network.isOnline()&&!this.submitted.has(idempotencyKey);}
  markCriticalMutationSubmitted(idempotencyKey:string){this.submitted.add(idempotencyKey);}
  markCriticalMutationResolved(idempotencyKey:string){this.submitted.delete(idempotencyKey);}

  async reconnect(){
    if(!this.network.isOnline())return {refreshed:[] as string[]};
    const refreshed:string[]=[];
    for(const view of [...this.staleViews]){await this.refresher.refresh(view);this.staleViews.delete(view);refreshed.push(view);}
    return {refreshed};
  }
}

export function renderConnectivityBanner(input:{online:boolean;hasUnsavedDraft:boolean}){
  if(input.online&&!input.hasUnsavedDraft)return '';
  const message=!input.online?'Sem conexão. Seus dados digitados permanecem salvos neste dispositivo.':'Rascunho local preservado até confirmação do servidor.';
  return `<div class="connectivity-banner" role="status" aria-live="polite">${message}</div>`;
}

// Offline mode preserves user input and marks projections stale. It never queues or replays critical domain mutations automatically.
