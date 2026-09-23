import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { DeleteWorkflowResponseDTO } from "./workflowsDTO"

export const deleteWorkflowRequest = async (
  id: string,
): Promise<ResponseApi<DeleteWorkflowResponseDTO> | null> => {
  try {
    const req = await api.delete(`/workflows/${id}`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
