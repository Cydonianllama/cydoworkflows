import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { RestoreWorkflowResponseDTO } from "./workflowsDTO"

export const restoreWorkflowVersionRequest = async (
  workflowId: string,
  version: number,
): Promise<ResponseApi<RestoreWorkflowResponseDTO> | null> => {
  try {
    const req = await api.post(`/workflows/${workflowId}/versions/${version}/restore`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
