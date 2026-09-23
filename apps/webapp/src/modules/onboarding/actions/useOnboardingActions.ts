import { useAuth } from "@cydo/auth/client"
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { eventBus } from "@/lib/eventBus/eventBus"
import { errorMessage } from "@/utils/error"
import { ONBOARDING_STEPS } from "../catalog/onboardingCatalog"
import { useOnboardingStore } from "../store"

export const useOnboardingActions = () => {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuth()
  const { jobRole, expectedUsers, invites, loading, setLoading } = useOnboardingStore()

  const validInvites = invites.filter((invite) => invite.email.trim().length > 0)
  const lastStep = ONBOARDING_STEPS.length - 1
  const canContinueProfile = jobRole.trim().length > 0
  const canContinueTeam = Number(expectedUsers) > 0

  const completeOnboardingAction = useCallback(async () => {
    try {
      setLoading(true)

      await completeOnboarding({
        jobRole,
        expectedUsers: Number(expectedUsers),
        invites: validInvites.map((invite) => ({ email: invite.email.trim(), role: invite.role })),
      })

      eventBus.emit("onboarding.completed", {
        jobRole,
        expectedUsers: Number(expectedUsers),
        invited: validInvites.map((invite) => invite.email.trim()),
      })

      toast.success("¡Todo listo! Bienvenido a Cydo")
      navigate("/", { replace: true })
      return true
    } catch (error) {
      toast.error(errorMessage(error, "Error inesperado (CompleteOnboardingAction)"))
      return false
    } finally {
      setLoading(false)
    }
  }, [completeOnboarding, expectedUsers, jobRole, navigate, setLoading, validInvites])

  return {
    completeOnboardingAction,
    canContinueProfile,
    canContinueTeam,
    validInvites,
    loading,
    lastStep,
  }
}
