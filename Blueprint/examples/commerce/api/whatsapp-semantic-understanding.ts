import type { WhatsAppInboundMessage, WhatsAppMessageKind } from './whatsapp-conversation-orchestrator.js';

export type SemanticCandidate={field:string;value:unknown;confidence:number;source:'text'|'audio'|'image'|'document';ambiguity?:string|undefined};
export type ExtractionEvidence={
  evidence_id:string;
  message_id:string;
  kind:WhatsAppMessageKind;
  original_media?:Record<string,unknown>|undefined;
  original_payload?:unknown;
  extracted_text?:string|undefined;
  candidates:SemanticCandidate[];
  confidence:number;
  ambiguities:string[];
  created_at:string;
};
export type UnderstandingResult={
  candidates:Record<string,unknown>;
  evidence?:ExtractionEvidence|undefined;
  confidence:number;
  ambiguities:string[];
  requires_confirmation:boolean;
  confirmation_prompt?:string|undefined;
};

export interface AudioTranscriptionAdapter{
  transcribe(input:{message_id:string;media?:Record<string,unknown>|undefined;raw?:unknown}):Promise<{text:string;confidence:number;ambiguities?:string[]|undefined}>;
}
export interface ReceiptExtractionAdapter{
  extract(input:{message_id:string;kind:'image'|'document';media?:Record<string,unknown>|undefined;raw?:unknown}):Promise<{text?:string|undefined;fields:Record<string,unknown>;field_confidence?:Record<string,number>|undefined;ambiguities?:string[]|undefined}>;
}
export interface TextCandidateExtractor{
  extract(text:string,source:'text'|'audio'):Promise<{fields:Record<string,unknown>;field_confidence?:Record<string,number>|undefined;ambiguities?:string[]|undefined}>;
}
export interface MediaEvidenceStore{save(evidence:ExtractionEvidence):Promise<void>;load(evidenceId:string):Promise<ExtractionEvidence|undefined>;}
export interface MessageUnderstandingPort{understand(message:WhatsAppInboundMessage):Promise<UnderstandingResult>;}

export class InMemoryMediaEvidenceStore implements MediaEvidenceStore{
  private readonly values=new Map<string,ExtractionEvidence>();
  async save(evidence:ExtractionEvidence){this.values.set(evidence.evidence_id,structuredClone(evidence));}
  async load(evidenceId:string){const value=this.values.get(evidenceId);return value?structuredClone(value):undefined;}
}

export class FunctionAudioTranscriptionAdapter implements AudioTranscriptionAdapter{
  constructor(private readonly fn:AudioTranscriptionAdapter['transcribe']){}
  transcribe(input:Parameters<AudioTranscriptionAdapter['transcribe']>[0]){return this.fn(input);}
}
export class FunctionReceiptExtractionAdapter implements ReceiptExtractionAdapter{
  constructor(private readonly fn:ReceiptExtractionAdapter['extract']){}
  extract(input:Parameters<ReceiptExtractionAdapter['extract']>[0]){return this.fn(input);}
}
export class JsonTextCandidateExtractor implements TextCandidateExtractor{
  async extract(text:string){
    try{const parsed=JSON.parse(text);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?{fields:parsed as Record<string,unknown>,field_confidence:Object.fromEntries(Object.keys(parsed).map(key=>[key,1]))}:{fields:{},ambiguities:['text is not a structured object']};}
    catch{return{fields:{},ambiguities:['text could not be converted to structured candidates']};}
  }
}

function clamp(value:number):number{return Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;}
function evidenceId(message:WhatsAppInboundMessage):string{return `whatsapp-evidence:${message.instance}:${message.message_id}`;}
function candidateList(fields:Record<string,unknown>,source:SemanticCandidate['source'],confidence:Record<string,number>|undefined,ambiguities:string[]):SemanticCandidate[]{
  return Object.entries(fields).map(([field,value])=>({field,value,confidence:clamp(confidence?.[field]??1),source,ambiguity:ambiguities.find(item=>item.toLocaleLowerCase('pt-BR').includes(field.toLocaleLowerCase('pt-BR')))}));
}
function overall(candidates:SemanticCandidate[],fallback=1):number{return candidates.length?Math.min(...candidates.map(candidate=>candidate.confidence)):clamp(fallback);}
function prompt(ambiguities:string[]):string{return `Preciso confirmar a extração antes de continuar: ${ambiguities.length?ambiguities.join('; '):'a confiança da evidência está abaixo do limite'}. Confirme ou corrija os dados.`;}

export class WhatsAppSemanticUnderstanding implements MessageUnderstandingPort{
  constructor(
    private readonly evidence:MediaEvidenceStore,
    private readonly audio:AudioTranscriptionAdapter,
    private readonly receipt:ReceiptExtractionAdapter,
    private readonly text:TextCandidateExtractor=new JsonTextCandidateExtractor(),
    private readonly confidenceThreshold=0.8,
    private readonly now:()=>Date=()=>new Date(),
  ){}

  async understand(message:WhatsAppInboundMessage):Promise<UnderstandingResult>{
    if(message.kind==='text')return this.fromText(message,message.text??'','text');
    if(message.kind==='audio'){
      const transcription=await this.audio.transcribe({message_id:message.message_id,media:message.media,raw:message.raw});
      const parsed=await this.text.extract(transcription.text,'audio');
      const ambiguities=[...(transcription.ambiguities??[]),...(parsed.ambiguities??[])];
      const candidates=candidateList(parsed.fields,'audio',parsed.field_confidence,ambiguities).map(candidate=>({...candidate,confidence:Math.min(candidate.confidence,clamp(transcription.confidence))}));
      return this.persist(message,transcription.text,candidates,ambiguities,clamp(transcription.confidence));
    }
    if(message.kind==='image'||message.kind==='document'){
      const extracted=await this.receipt.extract({message_id:message.message_id,kind:message.kind,media:message.media,raw:message.raw});
      const ambiguities=[...(extracted.ambiguities??[])];
      const candidates=candidateList(extracted.fields,message.kind,extracted.field_confidence,ambiguities);
      return this.persist(message,extracted.text,candidates,ambiguities,overall(candidates));
    }
    return{candidates:{},confidence:0,ambiguities:['unsupported message kind'],requires_confirmation:true,confirmation_prompt:prompt(['tipo de mensagem não suportado'])};
  }

  private async fromText(message:WhatsAppInboundMessage,text:string,source:'text'|'audio'):Promise<UnderstandingResult>{
    const parsed=await this.text.extract(text,source);const ambiguities=parsed.ambiguities??[];const candidates=candidateList(parsed.fields,source,parsed.field_confidence,ambiguities);const confidence=overall(candidates,candidates.length?1:0);
    return{candidates:parsed.fields,confidence,ambiguities,requires_confirmation:candidates.length>0&&(confidence<this.confidenceThreshold||ambiguities.length>0),...(candidates.length>0&&(confidence<this.confidenceThreshold||ambiguities.length>0)?{confirmation_prompt:prompt(ambiguities)}:{})};
  }

  private async persist(message:WhatsAppInboundMessage,extractedText:string|undefined,candidates:SemanticCandidate[],ambiguities:string[],fallback:number):Promise<UnderstandingResult>{
    const confidence=overall(candidates,fallback);const evidence:ExtractionEvidence={evidence_id:evidenceId(message),message_id:message.message_id,kind:message.kind,original_media:message.media,original_payload:message.raw,extracted_text:extractedText,candidates,confidence,ambiguities,created_at:this.now().toISOString()};
    await this.evidence.save(evidence);
    const requiresConfirmation=confidence<this.confidenceThreshold||ambiguities.length>0;
    return{candidates:Object.fromEntries(candidates.map(candidate=>[candidate.field,candidate.value])),evidence,confidence,ambiguities,requires_confirmation:requiresConfirmation,...(requiresConfirmation?{confirmation_prompt:prompt(ambiguities)}:{})};
  }
}
