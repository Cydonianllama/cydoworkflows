import { Toaster } from "sonner"
import { useTheme } from "./ThemeProvider"

export function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster position="top-right" richColors closeButton theme={resolvedTheme} />
}
