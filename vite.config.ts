/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : vite.config.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  • React plugin + Emotion dedupe
 *  • Port logic: 1420 for Tauri dev, 5173 for standalone dev/preview
 *  • Relative `base: "./"` for production so Tauri can load via file://
 *  • Rollup manualChunks helper → neat, cache-friendly vendor files
 * -------------------------------------------------------------- */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  const isDev = command === "serve";
  const tauriPort = process.env.TAURI_DEV_PORT
    ? Number(process.env.TAURI_DEV_PORT)
    : 1420;

  return {
    plugins: [react()],

    resolve: {
      dedupe: ["@emotion/react", "@emotion/styled"],
    },

    server: {
      port: isDev ? tauriPort : 5173,
      strictPort: true,
      // proxy block removed – no local API server
    },

    base: command === "build" ? "./" : "/",

    build: {
      target: "es2020",
      chunkSizeWarningLimit: 1500,
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
