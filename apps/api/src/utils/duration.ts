const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
}

/** Convierte "15m", "7d", "3600s" a milisegundos. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(value.trim())
  if (!match) throw new Error(`Duración inválida: "${value}"`)

  const amount = Number(match[1])
  const unit = (match[2] ?? "ms").toLowerCase()
  const factor = UNIT_MS[unit]
  if (!factor) throw new Error(`Unidad de duración inválida: "${unit}"`)

  return amount * factor
}
