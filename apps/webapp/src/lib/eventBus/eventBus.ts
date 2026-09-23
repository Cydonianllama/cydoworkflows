import type { AppEventName, AppEventPayload } from "./events"

type UntypedHandler = (payload: never) => void

/**
 * Bus tipado para comunicación entre módulos.
 * - El módulo que emite no conoce a quién escucha.
 * - No reemplaza llamadas directas dentro de un mismo módulo.
 */
export class EventBus {
  private readonly handlers = new Map<AppEventName, Set<UntypedHandler>>()

  on<K extends AppEventName>(event: K, handler: (payload: AppEventPayload<K>) => void): () => void {
    const set = this.handlers.get(event) ?? new Set<UntypedHandler>()
    set.add(handler as UntypedHandler)
    this.handlers.set(event, set)
    return () => this.off(event, handler)
  }

  off<K extends AppEventName>(event: K, handler: (payload: AppEventPayload<K>) => void): void {
    this.handlers.get(event)?.delete(handler as UntypedHandler)
  }

  emit<K extends AppEventName>(event: K, payload: AppEventPayload<K>): void {
    const set = this.handlers.get(event)
    if (!set) return

    for (const handler of set) {
      try {
        ;(handler as (value: AppEventPayload<K>) => void)(payload)
      } catch (error) {
        console.error(`[eventBus] handler falló para "${event}"`, error)
      }
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}

export const eventBus = new EventBus()
