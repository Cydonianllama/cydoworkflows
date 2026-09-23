import { useEffect, useRef } from "react"
import { useFlowchartActions } from "../actions/useFlowchartActions"
import { useFlowchartStore } from "../store"

const AUTO_SAVE_DEBOUNCE_MS = 1500

export function useGraphAutoSave() {
  const { saveGraphAction, dirty, loading } = useFlowchartActions()
  const { nodes, edges } = useFlowchartStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failedRef = useRef(false)

  useEffect(() => {
    failedRef.current = false
  }, [nodes, edges])

  useEffect(() => {
    if (!dirty || loading || failedRef.current) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      void saveGraphAction().then((ok) => {
        if (!ok) failedRef.current = true
      })
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [dirty, loading, saveGraphAction, nodes, edges])
}
