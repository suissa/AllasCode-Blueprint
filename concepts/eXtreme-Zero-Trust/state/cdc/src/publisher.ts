import type { ConfirmedChange } from './event-mapper.js'

export interface ChangePublisher {
  publish<T>(subject: string, change: ConfirmedChange<T>): Promise<void>
}

export async function publishConfirmedChange<T>(publisher: ChangePublisher, subject: string, change: ConfirmedChange<T>): Promise<void> {
  await publisher.publish(subject, change)
}
