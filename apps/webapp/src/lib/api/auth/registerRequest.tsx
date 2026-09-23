import type { RegisterRequest } from "@cydo/auth"
import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { RegisterResponseDTO } from "./authDTO"

export const registerRequest = async (data: RegisterRequest): Promise<ResponseApi<RegisterResponseDTO> | null> => {
  try {
    const req = await api.post("/auth/register", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
