import { useCallback, useEffect } from "react"
import { toast } from "sonner"
import { getAccountOverviewRequest } from "@/lib/api/members"
import { errorMessage } from "@/utils/error"
import { useHomeStore } from "../store"

export const useHomeActions = () => {
  const { overview, loading, setOverview, setLoading } = useHomeStore()

  const fetchOverviewAction = useCallback(async () => {
    try {
      setLoading(true)

      const req = await getAccountOverviewRequest()

      if (!req) {
        toast.error("Error al cargar tu cuenta")
        return
      }

      if (!req.status) {
        toast.error(req.message ?? "Error al cargar tu cuenta")
        return
      }

      if (!req.data?.stats) {
        toast.error("Respuesta inesperada del servidor")
        return
      }

      setOverview(req.data)
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (FetchOverviewAction)"))
    } finally {
      setLoading(false)
    }
  }, [setLoading, setOverview])

  useEffect(() => {
    void fetchOverviewAction()
  }, [fetchOverviewAction])

  return { fetchOverviewAction, overview, loading }
}
