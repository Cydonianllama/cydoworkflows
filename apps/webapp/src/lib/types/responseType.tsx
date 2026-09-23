import type { ResponsePagination } from "./responsePagination"

/** Formato por defecto de entrada de datos del API. */
export interface ResponseApi<T> {
  status: boolean
  data: T
  message?: string
  pagination?: ResponsePagination
}
