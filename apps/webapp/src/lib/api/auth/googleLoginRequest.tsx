import type { GoogleLoginRequest } from "@cydo/auth"
import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { SessionResponseDTO } from "./authDTO"

export const googleLoginRequest = async (
  data: GoogleLoginRequest,
): Promise<ResponseApi<SessionResponseDTO> | null> => {
  try {
    const req = await api.post("/auth/google", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
