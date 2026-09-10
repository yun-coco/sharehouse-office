import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "path";

const env = loadEnv("test", process.cwd(), "");

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    env,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.worktrees/**",
      "**/.git/**",
      "**/.cache/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/lib/test-support/server-only-noop.ts"),
    },
  },
});
