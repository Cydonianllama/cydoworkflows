import type { CompleteOnboardingRequest } from "@cydo/auth"
import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { OnboardingResponseDTO } from "./authDTO"

export const completeOnboardingRequest = async (
  data: CompleteOnboardingRequest,
): Promise<ResponseApi<OnboardingResponseDTO> | null> => {
  try {
    const req = await api.post("/onboarding/complete", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
