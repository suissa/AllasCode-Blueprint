import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export type AppendReceipt = Readonly<{ messageId: string; persistedAtMs: number }>

export class AppendOnlyStore {
  constructor(readonly path: string) {}

  async append(messageId: string, event: unknown): Promise<AppendReceipt> {
    await mkdir(dirname(this.path), { recursive: true })
    const record = JSON.stringify({ messageId, event, persistedAtMs: Date.now() }) + '\n'
    await appendFile(this.path, record, 'utf8')
    return { messageId, persistedAtMs: Date.now() }
  }
}
