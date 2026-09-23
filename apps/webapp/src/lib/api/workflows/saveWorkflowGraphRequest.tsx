import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { SaveWorkflowGraphRequestDTO, SaveWorkflowGraphResponseDTO } from "./workflowsDTO"

export const saveWorkflowGraphRequest = async (
  workflowId: string,
  data: SaveWorkflowGraphRequestDTO,
): Promise<ResponseApi<SaveWorkflowGraphResponseDTO> | null> => {
  try {
    const req = await api.put(`/workflows/${workflowId}/graph`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
