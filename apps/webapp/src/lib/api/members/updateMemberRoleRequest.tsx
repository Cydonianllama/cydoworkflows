import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { UpdateMemberRoleRequestDTO, UpdateMemberRoleResponseDTO } from "./membersDTO"

export const updateMemberRoleRequest = async (
  id: string,
  data: UpdateMemberRoleRequestDTO,
): Promise<ResponseApi<UpdateMemberRoleResponseDTO> | null> => {
  try {
    const req = await api.patch(`/members/${id}/role`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
