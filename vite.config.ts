/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025 Sesh Ragavachari
 * ------------------------------------------------------------------ */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ command }) => {
  /* ── Build‑context helpers ───────────────────────────────────── */
  const forTauri = Boolean(process.env.TAURI_PLATFORM);
  const isDev = command === "serve";
  const tauriPort = Number(process.env.TAURI_DEV_PORT || 1420);

  return {
    plugins: [react()],

    /* 1 — Alias "@/..." → "<repo>/src/…" */
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
      dedupe: ["@emotion/react", "@emotion/styled"],
    },

    /* 2 — Dev‑server ports */
    server: {
      port: isDev ? tauriPort : 5173,
      strictPort: true,
    },

    /* 3 — Base path
          •  Tauri desktop build ….. "./"
          •  All web builds ………….. "/"   (works on Cloudflare Pages)
    -----------------------------------------------------------------*/
    base: forTauri ? "./" : "/",

    /* 4 — Build targets & chunk naming */
    build: {
      target: "es2020",
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id
                .split("node_modules/")[1]
                .split("/")[0]
                .replace("@", "at-");
            }
          },
        },
      },
    },
  };
});
