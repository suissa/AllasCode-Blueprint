export type EvolutionGoMediaType='image'|'audio'|'document'|'video';
export type EvolutionGoSendResult={provider_message_id:string;raw:unknown};

export interface EvolutionGoProviderConfig{
  baseUrl:string;
  apiKey:string;
}

export class EvolutionGoProvider{
  constructor(private readonly config:EvolutionGoProviderConfig,private readonly http:typeof fetch=fetch){}

  async sendText(number:string,text:string):Promise<EvolutionGoSendResult>{
    return this.post('/send/text',{number,text});
  }

  async sendMedia(input:{number:string;url:string;type:EvolutionGoMediaType;caption?:string;filename?:string}):Promise<EvolutionGoSendResult>{
    return this.post('/send/media',input);
  }

  async messageStatus(id:string):Promise<unknown>{
    const response=await this.http(`${this.config.baseUrl}/message/status`,{
      method:'POST',headers:{'content-type':'application/json',apikey:this.config.apiKey},body:JSON.stringify({id}),
    });
    if(!response.ok) throw new Error(`Evolution Go status request failed with ${response.status}`);
    return response.json();
  }

  private async post(path:string,body:unknown):Promise<EvolutionGoSendResult>{
    const response=await this.http(`${this.config.baseUrl}${path}`,{
      method:'POST',headers:{'content-type':'application/json',apikey:this.config.apiKey},body:JSON.stringify(body),
    });
    if(!response.ok) throw new Error(`Evolution Go request failed with ${response.status}`);
    const raw:any=await response.json();
    const id=raw?.data?.Info?.ID??raw?.data?.messageId??raw?.messageId;
    if(typeof id!=='string'||!id) throw new Error('Evolution Go response has no provider message id');
    return {provider_message_id:id,raw};
  }
}
