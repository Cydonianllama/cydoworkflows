import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { GetInviteResponseDTO } from "./membersDTO"

export const getInviteRequest = async (
  token: string,
): Promise<ResponseApi<GetInviteResponseDTO> | null> => {
  try {
    const req = await api.get(`/invites/${token}`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
