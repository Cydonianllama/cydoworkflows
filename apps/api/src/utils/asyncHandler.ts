import type { NextFunction, Request, RequestHandler, Response } from "express"

/** Envuelve handlers async para que los errores lleguen al errorHandler. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next)
  }
}
