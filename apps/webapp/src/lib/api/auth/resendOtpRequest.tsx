import type { ResendOtpRequest } from "@cydo/auth"
import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { ResendOtpResponseDTO } from "./authDTO"

export const resendOtpRequest = async (
  data: ResendOtpRequest,
): Promise<ResponseApi<ResendOtpResponseDTO> | null> => {
  try {
    const req = await api.post("/auth/resend-otp", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
