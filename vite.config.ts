import { defineConfig } from "vitest/config";

console.log(process.env.POB_VITEST_COVERAGE);

export default defineConfig({
  test: {
    setupFiles: ["src/test-setup.ts"],
    include: ["src/**/__tests__/**/*.ts?(x)", "src/**/*.test.ts?(x)"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts?(x)"],
      exclude: ["src/**/__mocks__/**/*.ts?(x)"],
      reportsDirectory: "docs/coverage",
      reporter: (process.env.POB_VITEST_COVERAGE || "json,text").split(","),
    },
  },
});
