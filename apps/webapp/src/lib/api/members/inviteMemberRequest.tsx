import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { InviteMemberRequestDTO, InviteMemberResponseDTO } from "./membersDTO"

export const inviteMemberRequest = async (
  data: InviteMemberRequestDTO,
): Promise<ResponseApi<InviteMemberResponseDTO> | null> => {
  try {
    const req = await api.post("/members/invite", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
