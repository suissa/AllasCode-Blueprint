export class LinearUseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LinearUseError'
  }
}

export abstract class RuntimeLinearResource {
  #consumed = false

  protected consume(operation: string): void {
    if (this.#consumed) {
      throw new LinearUseError(`${this.constructor.name} already consumed before ${operation}`)
    }
    this.#consumed = true
  }

  get consumed(): boolean {
    return this.#consumed
  }
}
