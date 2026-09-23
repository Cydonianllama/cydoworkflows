import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@cydo/auth/client", replacement: resolvePath("../../packages/auth/src/client/index.ts") },
      { find: "@cydo/auth/server", replacement: resolvePath("../../packages/auth/src/server/index.ts") },
      { find: "@cydo/auth", replacement: resolvePath("../../packages/auth/src/core/index.ts") },
      { find: "@", replacement: resolvePath("./src") },
    ],
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
