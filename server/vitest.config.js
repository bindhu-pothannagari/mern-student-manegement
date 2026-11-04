import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/helpers/setup.js"],
    fileParallelism: false,
    clearMocks: true,
    testTimeout: 30000,
    hookTimeout: 300000,
  },
});
