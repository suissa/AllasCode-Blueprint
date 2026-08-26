import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { InMemoryHealingStore, JsonFileHealingStore, type HealingCaseStore } from './healing-store.js';

interface PersistenceConfig { store?: { driver?: 'memory'|'json-file'; path?: string } }

export async function createHealingCaseStore(root:string):Promise<HealingCaseStore>{
  const config=parse(await readFile(join(root,'healing','persistence.yml'),'utf8')) as PersistenceConfig;
  const driver=config.store?.driver??'memory';
  if(driver==='memory') return new InMemoryHealingStore();
  if(driver==='json-file'){
    if(!config.store?.path) throw new Error('json-file healing store requires store.path');
    return new JsonFileHealingStore(resolve(root,config.store.path));
  }
  throw new Error(`Unsupported healing store driver: ${String(driver)}`);
}
