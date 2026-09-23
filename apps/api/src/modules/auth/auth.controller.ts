import {
  toSessionUser,
  type AuthSessionPayload,
  type GoogleLoginRequest,
  type LoginRequest,
  type RegisterRequest,
  type ResendOtpRequest,
  type VerifyOtpRequest,
} from "@cydo/auth"
import type { Request, Response } from "express"
import { authService } from "../../setup/container"
import { sendCreated, sendOk } from "../../setup/response"
import { clearSessionCookies, readRefreshCookie, setSessionCookies } from "../../setup/sessionCookies"

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const data = await authService.register(req.body as RegisterRequest)
  sendCreated(res, data, "Revisa tu correo para verificar la cuenta")
}

export async function verifyOtpHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.verifyOtp(req.body as VerifyOtpRequest)
  setSessionCookies(res, result.tokens)
  sendOk<AuthSessionPayload>(res, { user: result.user })
}

export async function resendOtpHandler(req: Request, res: Response): Promise<void> {
  const data = await authService.resendOtp(req.body as ResendOtpRequest)
  sendOk(res, data)
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginRequest)
  setSessionCookies(res, result.tokens)
  sendOk<AuthSessionPayload>(res, { user: result.user })
}

export async function googleHandler(req: Request, res: Response): Promise<void> {
  const result = await authService.loginWithGoogle(req.body as GoogleLoginRequest)
  setSessionCookies(res, result.tokens)
  sendOk<AuthSessionPayload>(res, { user: result.user })
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const refreshToken = readRefreshCookie(req)
  if (!refreshToken) {
    clearSessionCookies(res)
    res.status(401).json({ status: false, data: null, message: "No hay sesión activa", code: "INVALID_TOKEN" })
    return
  }

  const result = await authService.refresh(refreshToken)
  setSessionCookies(res, result.tokens)
  sendOk<AuthSessionPayload>(res, { user: result.user })
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  await authService.logout(readRefreshCookie(req))
  clearSessionCookies(res)
  sendOk(res, { ok: true })
}

export function meHandler(req: Request, res: Response): void {
  if (!req.user) {
    res.status(401).json({ status: false, data: null, message: "No hay sesión activa", code: "INVALID_TOKEN" })
    return
  }
  sendOk(res, toSessionUser(req.user))
}
