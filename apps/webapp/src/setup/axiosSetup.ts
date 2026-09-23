import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"
import { env } from "./env"

/** Instancia única de axios para toda la app. */
export const api: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<boolean> | null = null

/** Un solo refresh en vuelo, aunque exploten N requests a la vez. */
function refreshSession(): Promise<boolean> {
  refreshPromise ??= axios
    .post(`${env.VITE_API_URL}/auth/refresh`, null, { withCredentials: true })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const url = typeof original?.url === "string" ? original.url : ""
    const isAuthRoute = url.includes("/auth/")

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      const refreshed = await refreshSession()
      if (refreshed) return api.request(original)
    }

    return Promise.reject(error)
  },
)
