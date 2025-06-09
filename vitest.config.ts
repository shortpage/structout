import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // <-- put YOUR test locations here
    include: ["src/**/*.{test,spec}.{ts,tsx,js}"],

    // ↙ standard ignores + pnpm’s special folder
    exclude: [
      "node_modules/**",
      ".ignored_node_modules/**",
      "dist/**",
      "coverage/**",
      "src-tauri/**",
    ],
  },
});
