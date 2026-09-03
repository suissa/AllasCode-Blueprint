import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { arch, cpus, platform, release, totalmem } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';

const root = join(import.meta.dirname, '..');
const facop = parse(await readFile(join(root, 'facop.yml'), 'utf8')) as {
  qualification?: {
    server?: {
      memory_tolerance_percent?: number;
      profiles?: Array<{ id: string; cpu_cores: number; memory_mb: number; arch?: string; platform?: string; labels?: string[] }>;
    };
  };
};

const cpu = cpus();
const cpuModel = cpu[0]?.model?.trim() || 'unknown';
const memoryMb = Math.round(totalmem() / 1024 / 1024);
const fingerprint = {
  generated_at: new Date().toISOString(),
  cpu_cores: cpu.length,
  cpu_model: cpuModel,
  cpu_model_hash: createHash('sha256').update(cpuModel).digest('hex').slice(0, 16),
  memory_mb: memoryMb,
  arch: arch(),
  platform: platform(),
  kernel: release(),
  node: process.version,
  containerized: await access('/.dockerenv').then(() => true).catch(() => false),
  provider_hint: process.env.FACOP_PROVIDER || undefined,
};

const tolerance = facop.qualification?.server?.memory_tolerance_percent ?? 20;
const profiles = facop.qualification?.server?.profiles ?? [];
const selected = profiles.find(profile => {
  const memoryDelta = Math.abs(memoryMb - profile.memory_mb) / Math.max(1, profile.memory_mb) * 100;
  return profile.cpu_cores === cpu.length
    && memoryDelta <= tolerance
    && (!profile.arch || profile.arch === fingerprint.arch)
    && (!profile.platform || profile.platform === fingerprint.platform);
});

const profile = selected ? {
  ...selected,
  matched: true,
  observed_memory_mb: memoryMb,
  observed_cpu_model_hash: fingerprint.cpu_model_hash,
} : {
  id: `custom-${cpu.length}c-${Math.round(memoryMb / 256) * 256}m-${fingerprint.arch}`,
  cpu_cores: cpu.length,
  memory_mb: memoryMb,
  arch: fingerprint.arch,
  platform: fingerprint.platform,
  matched: false,
  observed_memory_mb: memoryMb,
  observed_cpu_model_hash: fingerprint.cpu_model_hash,
};

await mkdir(join(root, '.facop', 'server'), { recursive: true });
await writeFile(join(root, '.facop', 'server', 'fingerprint.json'), `${JSON.stringify(fingerprint, null, 2)}\n`);
await writeFile(join(root, '.facop', 'server', 'profile.json'), `${JSON.stringify(profile, null, 2)}\n`);
console.log(`FACoP server profile: ${profile.id} (${fingerprint.cpu_cores} vCPU, ${memoryMb} MiB, ${fingerprint.arch}).`);
