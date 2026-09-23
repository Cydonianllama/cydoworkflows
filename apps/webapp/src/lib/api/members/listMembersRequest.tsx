import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { ListMembersResponseDTO } from "./membersDTO"

export const listMembersRequest = async (): Promise<ResponseApi<ListMembersResponseDTO> | null> => {
  try {
    const req = await api.get("/members")
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
