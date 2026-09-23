import type { ErrorRequestHandler, RequestHandler } from "express"
import { Error as MongooseError } from "mongoose"
import { ZodError } from "zod"
import { AuthError } from "@cydo/auth"
import { isProduction } from "../setup/env"

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ status: false, data: null, message: "Recurso no encontrado", code: "NOT_FOUND" })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AuthError) {
    res.status(error.status).json({ status: false, data: null, message: error.message, code: error.code })
    return
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      status: false,
      data: null,
      message: error.issues.map((issue) => issue.message).join(", "),
      code: "VALIDATION",
    })
    return
  }

  if (error instanceof MongooseError.ValidationError) {
    res.status(422).json({
      status: false,
      data: null,
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
      code: "VALIDATION",
    })
    return
  }

  if (typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000) {
    res.status(409).json({ status: false, data: null, message: "El registro ya existe", code: "DUPLICATED" })
    return
  }

  console.error("[api] error no manejado:", error)
  res.status(500).json({
    status: false,
    data: null,
    message: isProduction ? "Error inesperado" : error instanceof Error ? error.message : String(error),
    code: "UNEXPECTED",
  })
}
