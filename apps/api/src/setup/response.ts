import type { Response } from "express"

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export function sendOk<T>(res: Response, data: T, message?: string): void {
  res.status(200).json({ status: true, data, ...(message ? { message } : {}) })
}

export function sendCreated<T>(res: Response, data: T, message?: string): void {
  res.status(201).json({ status: true, data, ...(message ? { message } : {}) })
}

export function sendList<T>(res: Response, items: T[], pagination: PaginationMeta): void {
  res.status(200).json({ status: true, data: { items }, pagination })
}
