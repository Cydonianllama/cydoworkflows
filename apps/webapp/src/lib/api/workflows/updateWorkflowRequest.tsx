import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { UpdateWorkflowRequestDTO, UpdateWorkflowResponseDTO } from "./workflowsDTO"

export const updateWorkflowRequest = async (
  id: string,
  data: UpdateWorkflowRequestDTO,
): Promise<ResponseApi<UpdateWorkflowResponseDTO> | null> => {
  try {
    const req = await api.patch(`/workflows/${id}`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
