import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { AccountOverviewResponseDTO } from "./membersDTO"

export const getAccountOverviewRequest = async (): Promise<ResponseApi<AccountOverviewResponseDTO> | null> => {
  try {
    const req = await api.get("/users/me")
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
