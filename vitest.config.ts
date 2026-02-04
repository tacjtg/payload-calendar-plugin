import { defineConfig } from 'vitest/config'

// Root config that references workspace
// Actual test configs are in each package's vitest.config.ts
export default defineConfig({
  test: {
    // Use workspace mode - will auto-discover vitest.workspace.ts
  },
})
