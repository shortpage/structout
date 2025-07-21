/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025 Sesh Ragavachari
 * … (rest of header unchanged) …
 * ------------------------------------------------------------------ */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path"; // <‑‑ NEW: used for alias

/*─────────────────────────────────────────────────────────────────────
 * Adjust **ONLY** this constant if your repo slug ever changes
 *───────────────────────────────────────────────────────────────────*/
const REPO_NAME = "structout";

export default defineConfig(({ command }) => {
  /* ── Build‑context helpers ───────────────────────────────────────*/
  const isDev = command === "serve";
  const tauriPort = Number(process.env.TAURI_DEV_PORT || 1420);
  const forTauri = Boolean(process.env.TAURI_PLATFORM);

  /* ── Core Vite config ────────────────────────────────────────────*/
  return {
    plugins: [react()],

    /*--------------------------------------------------------------
     * 1.  Alias so "@/..." maps to "<repo>/src/…"
     *     – works for both JS runtime & TypeScript
     *-------------------------------------------------------------*/
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      /* Keep Emotion dedupe */
      dedupe: ["@emotion/react", "@emotion/styled"],
    },

    /*--------------------------------------------------------------
     * 2.  Dev‑server ports
     *-------------------------------------------------------------*/
    server: {
      port: isDev ? tauriPort : 5173,
      strictPort: true,
    },

    /*--------------------------------------------------------------
     * 3.  Base path logic:  GitHub Pages vs Tauri vs local dev
     *-------------------------------------------------------------*/
    base: command === "build" ? (forTauri ? "./" : `/${REPO_NAME}/`) : "/",

    /*--------------------------------------------------------------
     * 4.  Build targets + Rollup chunk naming
     *-------------------------------------------------------------*/
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
