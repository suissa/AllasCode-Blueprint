import test from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationApi } from '../api/application-api.js';
import { HttpApplicationAdapter } from '../api/http-adapter.js';
import { CommerceProjectionReader } from '../api/commerce-projection-reader.js';
import { createCommerceState } from '../runtime/state.js';

test('HTTP adapter maps authenticated Intent command without exposing Action/Agent', async()=>{
  let executed:any;
  const api=new ApplicationApi({async execute(input){executed=input;return{outcome:'Ok',data:{accepted:true}};}},new CommerceProjectionReader(createCommerceState()),{allows(){return true;}});
  const http=new HttpApplicationAdapter(api);
  const response=await http.handle({method:'POST',path:'/v1/intents/ProcessSaleIntent',headers:{'x-correlation-id':'c1','idempotency-key':'i1'},body:{sale_id:'s1'},principal:{id:'u1',permissions:['sales:write']}});
  assert.equal(response.status,200);
  assert.equal(executed.intent,'ProcessSaleIntent');
  assert.equal(executed.correlation_id,'c1');
  assert.equal(executed.idempotency_key,'i1');
  assert.equal('action' in executed,false);
  assert.equal('agent' in executed,false);
});

test('HTTP adapter maps boundary authorization to HTTP without leaking internals',async()=>{
  const api=new ApplicationApi({async execute(){throw new Error('secret stack');}},new CommerceProjectionReader(createCommerceState()),{allows(){return false;}});
  const http=new HttpApplicationAdapter(api);
  const response=await http.handle({method:'POST',path:'/v1/intents/ProcessSaleIntent',headers:{'x-correlation-id':'c2','idempotency-key':'i2'},body:{},principal:{id:'u1',permissions:[]}});
  assert.equal(response.status,403);
  assert.equal(response.body.error?.code,'FORBIDDEN');
  assert.equal(JSON.stringify(response.body).includes('secret stack'),false);
});

test('commerce projections paginate and filter inventory read model',async()=>{
  const state=createCommerceState();
  state.inventory.set('beer',8);state.inventory.set('water',20);state.inventory.set('wine',3);
  const reader=new CommerceProjectionReader(state);
  const filtered=await reader.read({projection:'inventory',filters:{product_id:'wa'},page:1,page_size:10,principal_id:'u1'}) as any;
  assert.equal(filtered.total,1);assert.equal(filtered.items[0].product_id,'water');
  const paged=await reader.read({projection:'inventory',filters:{},page:2,page_size:1,principal_id:'u1'}) as any;
  assert.equal(paged.page,2);assert.equal(paged.page_size,1);assert.equal(paged.total,3);assert.equal(paged.items.length,1);
});

test('unknown HTTP route returns stable semantic envelope',async()=>{
  const api=new ApplicationApi({async execute(){return{outcome:'Ok'};}},new CommerceProjectionReader(createCommerceState()),{allows(){return true;}});
  const response=await new HttpApplicationAdapter(api).handle({method:'GET',path:'/internal/agents',headers:{'x-correlation-id':'c3'},principal:{id:'u1',permissions:[]}});
  assert.equal(response.status,404);assert.equal(response.body.version,'v1');assert.equal(response.body.outcome,'Error');
});
