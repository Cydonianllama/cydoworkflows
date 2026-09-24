import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: "@cydo/auth/server", replacement: resolvePath("../../packages/auth/src/server/index.ts") },
      { find: "@cydo/auth", replacement: resolvePath("../../packages/auth/src/core/index.ts") },
      {
        find: "@cydo/workflow-engine/server",
        replacement: resolvePath("../../packages/workflow-engine/src/server/index.ts"),
      },
      { find: "@cydo/workflow-engine", replacement: resolvePath("../../packages/workflow-engine/src/core/index.ts") },
      {
        find: "@cydo/workflow-pipeline/server",
        replacement: resolvePath("../../packages/workflow-pipeline/src/server/index.ts"),
      },
      {
        find: "@cydo/workflow-pipeline",
        replacement: resolvePath("../../packages/workflow-pipeline/src/core/index.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
  },
})
