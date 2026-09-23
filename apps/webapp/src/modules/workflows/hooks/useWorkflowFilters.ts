import { useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { useWorkflowsActions } from "../actions/useWorkflowsActions"

/**
 * Hook del módulo: sincroniza el `?search=` de la URL con la primera carga.
 * Los compositions no necesitan conocer los query params.
 */
export function useWorkflowFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { fetchWorkflowsAction } = useWorkflowsActions()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    void fetchWorkflowsAction({ page: 1, search: searchParams.get("search") ?? "" })
  }, [fetchWorkflowsAction, searchParams])

  const syncSearchToUrl = useCallback(
    (search: string) => {
      setSearchParams(search ? { search } : {}, { replace: true })
    },
    [setSearchParams],
  )

  return { syncSearchToUrl }
}
