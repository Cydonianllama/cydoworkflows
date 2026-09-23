import type { ClockPort } from "@cydo/auth"

export class SystemClockAdapter implements ClockPort {
  now(): Date {
    return new Date()
  }
}
