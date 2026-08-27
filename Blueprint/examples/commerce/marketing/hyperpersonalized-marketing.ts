export type MarketingChannel='whatsapp'|'web'|'push';
export type MarketingOutcome='sent'|'delivered'|'read'|'clicked'|'converted'|'ignored';
export type ConsentState='granted'|'denied'|'unknown';
export type MarketingEvent={event_id:string;customer_id:string;kind:'sale'|'interaction'|'consent'|'inventory';occurred_at:string;product_id?:string;amount?:number;channel?:MarketingChannel;consent?:ConsentState;stock?:number};
export type MarketingProfile={customer_id:string;consent:Record<MarketingChannel,ConsentState>;purchase_count:number;total_spent:number;last_purchase_at:string|null;product_affinity:Record<string,number>;last_contact_at:Partial<Record<MarketingChannel,string>>};
export type OfferCandidate={offer_id:string;product_id:string;label:string;price:number;stock:number;base_score?:number};
export type ScoredOffer={offer_id:string;product_id:string;score:number;reasons:string[];breakdown:{affinity:number;recency:number;frequency:number;monetary:number;inventory:number;base:number}};
export type MarketingIntent={intent_id:string;campaign_id:string;customer_id:string;channel:MarketingChannel;offer:ScoredOffer;explanation:string;idempotency_key:string};

const DAY=86_400_000;
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));

export class HyperpersonalizedMarketing{
 private events=new Map<string,MarketingEvent>();
 private outcomes=new Map<string,MarketingOutcome>();
 private emitted=new Map<string,MarketingIntent>();
 private suppression=new Set<string>();
 constructor(private readonly frequencyCapHours=24){}

 consume(event:MarketingEvent){if(this.events.has(event.event_id))return{outcome:'Ok' as const,duplicate:true as const};this.events.set(event.event_id,{...event});return{outcome:'Ok' as const};}
 suppress(customer_id:string){this.suppression.add(customer_id);}
 unsuppress(customer_id:string){this.suppression.delete(customer_id);}

 profile(customer_id:string):MarketingProfile{
  const events=[...this.events.values()].filter(e=>e.customer_id===customer_id).sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at));
  const consent:Record<MarketingChannel,ConsentState>={whatsapp:'unknown',web:'unknown',push:'unknown'};
  const affinity:Record<string,number>={};let purchase_count=0,total_spent=0,last_purchase_at:string|null=null;const last_contact_at:Partial<Record<MarketingChannel,string>>={};
  for(const e of events){if(e.kind==='consent'&&e.channel&&e.consent)consent[e.channel]=e.consent;if(e.kind==='sale'){purchase_count++;total_spent+=e.amount??0;last_purchase_at=e.occurred_at;if(e.product_id)affinity[e.product_id]=(affinity[e.product_id]??0)+1;}if(e.kind==='interaction'&&e.channel)last_contact_at[e.channel]=e.occurred_at;}
  return{customer_id,consent,purchase_count,total_spent,last_purchase_at,product_affinity:affinity,last_contact_at};
 }

 score(customer_id:string,offers:OfferCandidate[],now:string):ScoredOffer[]{const p=this.profile(customer_id);const maxAffinity=Math.max(1,...Object.values(p.product_affinity));const recency=p.last_purchase_at?clamp(1-(Date.parse(now)-Date.parse(p.last_purchase_at))/(90*DAY)):0.2;const frequency=clamp(p.purchase_count/10);const monetary=clamp(p.total_spent/1000);return offers.filter(o=>o.stock>0).map(o=>{const affinity=clamp((p.product_affinity[o.product_id]??0)/maxAffinity);const inventory=clamp(o.stock/20);const base=clamp(o.base_score??0.5);const score=Number((affinity*.35+recency*.2+frequency*.15+monetary*.1+inventory*.1+base*.1).toFixed(4));const reasons:string[]=[];if(affinity>=.5)reasons.push('high-product-affinity');if(recency>=.6)reasons.push('recent-customer');if(frequency>=.5)reasons.push('frequent-customer');if(monetary>=.5)reasons.push('high-value-customer');if(inventory>=.5)reasons.push('inventory-available');if(!reasons.length)reasons.push('general-relevance');return{offer_id:o.offer_id,product_id:o.product_id,score,reasons,breakdown:{affinity,recency,frequency,monetary,inventory,base}};}).sort((a,b)=>b.score-a.score||a.offer_id.localeCompare(b.offer_id));}

 createIntent(input:{campaign_id:string;customer_id:string;channel:MarketingChannel;offers:OfferCandidate[];now:string}):{outcome:'Ok';intent:MarketingIntent;duplicate?:true}|{outcome:'Error';code:'ConsentRequired'|'Suppressed'|'FrequencyCap'|'NoEligibleOffer'}{
  const key=`${input.campaign_id}:${input.customer_id}:${input.channel}`;const existing=this.emitted.get(key);if(existing)return{outcome:'Ok',intent:{...existing,offer:{...existing.offer,breakdown:{...existing.offer.breakdown},reasons:[...existing.offer.reasons]}},duplicate:true};
  if(this.suppression.has(input.customer_id))return{outcome:'Error',code:'Suppressed'};const p=this.profile(input.customer_id);if(p.consent[input.channel]!=='granted')return{outcome:'Error',code:'ConsentRequired'};const last=p.last_contact_at[input.channel];if(last&&(Date.parse(input.now)-Date.parse(last))<this.frequencyCapHours*3_600_000)return{outcome:'Error',code:'FrequencyCap'};const offer=this.score(input.customer_id,input.offers,input.now)[0];if(!offer)return{outcome:'Error',code:'NoEligibleOffer'};const intent:MarketingIntent={intent_id:`marketing:${key}`,campaign_id:input.campaign_id,customer_id:input.customer_id,channel:input.channel,offer,explanation:offer.reasons.join(', '),idempotency_key:key};this.emitted.set(key,intent);return{outcome:'Ok',intent};
 }

 recordOutcome(intent_id:string,outcome:MarketingOutcome){this.outcomes.set(intent_id,outcome);return{outcome:'Ok' as const};}
 attribution(){const counts:Record<MarketingOutcome,number>={sent:0,delivered:0,read:0,clicked:0,converted:0,ignored:0};for(const o of this.outcomes.values())counts[o]++;return counts;}
}
