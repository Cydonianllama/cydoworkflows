import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { SessionResponseDTO } from "./authDTO"

export const refreshRequest = async (): Promise<ResponseApi<SessionResponseDTO> | null> => {
  try {
    const req = await api.post("/auth/refresh")
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
