import { CronExpressionParser } from "cron-parser"

const PARSE_OPTIONS = (timezone: string, from?: Date) => ({
  tz: timezone,
  ...(from ? { currentDate: from } : {}),
})

export function isValidCron(expression: string, timezone = "UTC"): boolean {
  if (!expression.trim()) return false
  try {
    CronExpressionParser.parse(expression, PARSE_OPTIONS(timezone))
    return true
  } catch {
    return false
  }
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export function nextCronRun(
  expression: string,
  timezone = "UTC",
  from: Date = new Date(),
): Date | null {
  if (!expression.trim()) return null
  try {
    const interval = CronExpressionParser.parse(expression, PARSE_OPTIONS(timezone, from))
    return interval.next().toDate()
  } catch {
    return null
  }
}
