import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { MeResponseDTO } from "./authDTO"

export const meRequest = async (): Promise<ResponseApi<MeResponseDTO> | null> => {
  try {
    const req = await api.get("/auth/me")
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
