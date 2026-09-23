import { useCallback, useEffect, useMemo, useState } from "react"

export interface UseOtpCountdownResult {
  secondsLeft: number
  canResend: boolean
  start: () => void
}

export function useOtpCountdown(initialSeconds: number): UseOtpCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [running, secondsLeft])

  const start = useCallback(() => {
    setSecondsLeft(initialSeconds)
    setRunning(true)
  }, [initialSeconds])

  return useMemo(
    () => ({ secondsLeft, canResend: secondsLeft <= 0, start }),
    [secondsLeft, start],
  )
}
