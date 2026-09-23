import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { GetWorkflowVersionResponseDTO } from "./workflowsDTO"

export const getWorkflowVersionRequest = async (
  workflowId: string,
  version: number,
): Promise<ResponseApi<GetWorkflowVersionResponseDTO> | null> => {
  try {
    const req = await api.get(`/workflows/${workflowId}/versions/${version}`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
