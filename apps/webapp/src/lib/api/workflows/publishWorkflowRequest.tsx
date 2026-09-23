import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { PublishWorkflowResponseDTO } from "./workflowsDTO"

export const publishWorkflowRequest = async (
  workflowId: string,
): Promise<ResponseApi<PublishWorkflowResponseDTO> | null> => {
  try {
    const req = await api.post(`/workflows/${workflowId}/publish`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
