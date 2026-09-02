import { readFile } from 'node:fs/promises'

export async function replayJsonLines<T>(path: string): Promise<T[]> {
  const text = await readFile(path, 'utf8').catch(() => '')
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}
