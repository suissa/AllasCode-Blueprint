import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const docs = {
  operator: new URL('../docs/operator-runbook.md', import.meta.url),
  providers: new URL('../docs/provider-setup-runbook.md', import.meta.url),
  incident: new URL('../docs/incident-runbook.md', import.meta.url),
  deploy: new URL('../docs/deployment-runbook.md', import.meta.url),
};

async function text(key:keyof typeof docs){ return readFile(docs[key],'utf8'); }

test('operator runbook covers healing and no database bypass',async()=>{const d=await text('operator');for(const s of ['waiting-human','Error','trace_id','correlation_id','Never bypass healing'])assert.match(d,new RegExp(s));});
test('provider setup covers WhatsApp payment fiscal and secret rotation',async()=>{const d=await text('providers');for(const s of ['Evolution Go','Payment provider','Fiscal provider','Secret handling','Duplicate test event'])assert.match(d,new RegExp(s));});
test('incident runbook maps traces, rollback, DR and secret rotation',async()=>{const d=await text('incident');for(const s of ['Intent trace','causation_id','disaster-recovery.md','secret rotation','Duplicate callbacks'])assert.match(d,new RegExp(s,'i'));});
test('deployment guide covers clean install migration readiness and rollback',async()=>{const d=await text('deploy');for(const s of ['Clean installation','readiness','Migration safety','Rollback','immutable release'])assert.match(d,new RegExp(s,'i'));});