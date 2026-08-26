export interface RuntimeEvent {
  name: string;
  payload: unknown;
  at: string;
}

export class InMemoryEventBus {
  readonly history: RuntimeEvent[] = [];

  emit(name: string, payload: unknown): RuntimeEvent {
    const event = { name, payload, at: new Date().toISOString() };
    this.history.push(event);
    return event;
  }
}
