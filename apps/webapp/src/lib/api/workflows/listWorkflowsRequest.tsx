import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { ListWorkflowsRequestDTO, ListWorkflowsResponseDTO } from "./workflowsDTO"

export const listWorkflowsRequest = async (
  data: ListWorkflowsRequestDTO,
): Promise<ResponseApi<ListWorkflowsResponseDTO> | null> => {
  try {
    const req = await api.get("/workflows", {
      params: { page: data.page, limit: data.limit, search: data.search || undefined },
    })
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
