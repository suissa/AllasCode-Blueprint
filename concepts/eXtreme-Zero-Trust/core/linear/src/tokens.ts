import { RuntimeLinearResource } from './linear-resource.js'

let nextId = 1

export class AppendToken<T> extends RuntimeLinearResource {
  readonly id = nextId++
  constructor(readonly value: T) { super() }
  persist(): PersistedEventToken<T> {
    this.consume('persist')
    return new PersistedEventToken(this.id, this.value)
  }
}

export class PersistedEventToken<T> extends RuntimeLinearResource {
  constructor(readonly appendTokenId: number, readonly value: T) { super() }
  receipt(): LocalAppendReceipt<T> {
    this.consume('receipt')
    return new LocalAppendReceipt(this.appendTokenId, this.value)
  }
}

export class LocalAppendReceipt<T> extends RuntimeLinearResource {
  constructor(readonly appendTokenId: number, readonly value: T) { super() }
  authorizeAck(): AckCapability<T> {
    this.consume('authorizeAck')
    return new AckCapability(this.appendTokenId, this.value)
  }
}

export class AckCapability<T> extends RuntimeLinearResource {
  constructor(readonly appendTokenId: number, readonly value: T) { super() }
  acknowledge(): { appendTokenId: number; value: T } {
    this.consume('acknowledge')
    return { appendTokenId: this.appendTokenId, value: this.value }
  }
}
