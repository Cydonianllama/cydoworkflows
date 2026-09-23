import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { AcceptInviteRequestDTO, AcceptInviteResponseDTO } from "./membersDTO"

export const acceptInviteRequest = async (
  token: string,
  data: AcceptInviteRequestDTO,
): Promise<ResponseApi<AcceptInviteResponseDTO> | null> => {
  try {
    const req = await api.post(`/invites/${token}/accept`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
