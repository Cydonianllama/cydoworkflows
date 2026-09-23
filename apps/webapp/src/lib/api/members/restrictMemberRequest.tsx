import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { RestrictMemberRequestDTO, RestrictMemberResponseDTO } from "./membersDTO"

export const restrictMemberRequest = async (
  id: string,
  data: RestrictMemberRequestDTO,
): Promise<ResponseApi<RestrictMemberResponseDTO> | null> => {
  try {
    const req = await api.patch(`/members/${id}/restrict`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
