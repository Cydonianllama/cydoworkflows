import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { RunWorkflowRequestDTO, RunWorkflowResponseDTO } from "./workflowsDTO"

export const runWorkflowRequest = async (
  workflowId: string,
  data: RunWorkflowRequestDTO,
): Promise<ResponseApi<RunWorkflowResponseDTO> | null> => {
  try {
    const req = await api.post(`/workflows/${workflowId}/run`, data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) return ex.response?.data ?? null
    return null
  }
}
