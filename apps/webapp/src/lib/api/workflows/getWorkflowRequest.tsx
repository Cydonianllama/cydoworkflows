import axios from "axios"
import { api } from "@/setup/axiosSetup"
import type { ResponseApi } from "@/lib/types/responseType"
import type { GetWorkflowResponseDTO } from "./workflowsDTO"

export const getWorkflowRequest = async (
  id: string,
): Promise<ResponseApi<GetWorkflowResponseDTO> | null> => {
  try {
    const req = await api.get(`/workflows/${id}`)
    return req.data
  } catch (ex) {
    if (axios.isAxiosError(ex)) {
      return ex.response?.data ?? null
    }
    return null
  }
}
