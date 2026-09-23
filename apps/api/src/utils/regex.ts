/** Escapa caracteres especiales para usar el texto del usuario dentro de un RegExp. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
