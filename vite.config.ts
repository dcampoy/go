import type { ViteUserConfig } from "vitest/config"

export default {
  base: "",
  test: {
    globals: true,
    environment: "node",
  },
  build: {
    sourcemap: false,
    outDir: "dist",
  },
} satisfies ViteUserConfig
