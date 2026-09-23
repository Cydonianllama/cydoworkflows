import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { GetWorkflowGraphResponseDTO } from "./workflowsDTO"

export const getWorkflowGraphRequest = async (
  workflowId: string,
): Promise<ResponseApi<GetWorkflowGraphResponseDTO> | null> => {
  try {
    const req = await api.get(`/workflows/${workflowId}/graph`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
