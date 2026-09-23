import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { CreateWorkflowRequestDTO, CreateWorkflowResponseDTO } from "./workflowsDTO"

export const createWorkflowRequest = async (
  data: CreateWorkflowRequestDTO,
): Promise<ResponseApi<CreateWorkflowResponseDTO> | null> => {
  try {
    const req = await api.post("/workflows", data)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
