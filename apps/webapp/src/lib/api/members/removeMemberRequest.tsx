import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { RemoveMemberResponseDTO } from "./membersDTO"

export const removeMemberRequest = async (
  id: string,
): Promise<ResponseApi<RemoveMemberResponseDTO> | null> => {
  try {
    const req = await api.delete(`/members/${id}`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
