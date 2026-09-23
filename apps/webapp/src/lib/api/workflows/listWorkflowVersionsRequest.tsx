import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type {
  ListWorkflowVersionsRequestDTO,
  ListWorkflowVersionsResponseDTO,
} from "./workflowsDTO"

export const listWorkflowVersionsRequest = async (
  workflowId: string,
  data: ListWorkflowVersionsRequestDTO,
): Promise<ResponseApi<ListWorkflowVersionsResponseDTO> | null> => {
  try {
    const req = await api.get(`/workflows/${workflowId}/versions`, { params: data })
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
