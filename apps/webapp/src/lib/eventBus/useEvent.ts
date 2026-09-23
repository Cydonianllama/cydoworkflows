import { useEffect, useRef } from "react"
import { eventBus } from "./eventBus"
import type { AppEventName, AppEventPayload } from "./events"

/** Suscribe un handler a un evento durante la vida del componente. */
export function useEvent<K extends AppEventName>(
  event: K,
  handler: (payload: AppEventPayload<K>) => void,
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    return eventBus.on(event, (payload) => handlerRef.current(payload))
  }, [event])
}
