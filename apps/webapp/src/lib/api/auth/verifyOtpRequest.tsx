import type { VerifyOtpRequest } from "@cydo/auth"
import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { SessionResponseDTO } from "./authDTO"

export const verifyOtpRequest = async (data: VerifyOtpRequest): Promise<ResponseApi<SessionResponseDTO> | null> => {
  try {
    const req = await api.post("/auth/verify-otp", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
