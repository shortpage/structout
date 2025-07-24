/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 *
 * File   : DemoBanner.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑24
 * Version: 1.0
 *
 *  A lightweight banner that shows only in read‑only demo builds.
 *  It informs visitors that the hosted instance is for demo purposes
 *  and provides direct links to the open‑source repository and docs
 *  so they can clone, self‑host, and unlock full edit functionality.
 *
 *  Usage:
 *    import DemoBanner from "./components/DemoBanner";
 *    …
 *    {DEMO_READ_ONLY && <DemoBanner />}
 *
 *  Styling is pure Tailwind — no external icons to keep the bundle
 *  small and avoid failed imports in environments without lucide-react.
 * ------------------------------------------------------------------ */

import { Box, Link, Typography } from "@mui/material";
import { REPO_URL, DOCS_URL } from "../lib/constants";

export default function DemoBanner() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.2, // theme spacing * 1.2
        px: 2,
        py: 0.5,
        bgcolor: "#FEF9C3", // yellow‑100
        border: "1px solid #FACC15", // yellow‑400
        borderRadius: 1, // theme radius (≈4 px)
        boxShadow: 1,
        fontSize: "0.825rem",
        lineHeight: 1.2,
        whiteSpace: "pre-wrap",
      }}
    >
      {/* pulsing square */}
      <Box
        sx={{
          width: 10,
          height: 10,
          bgcolor: "#CA8A04", // yellow‑600
          borderRadius: 0.5,
          animation: "pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite",
          "@keyframes pulse": {
            "0%,100%": { opacity: 0.5 },
            "50%": { opacity: 1 },
          },
        }}
      />

      <Typography sx={{ fontWeight: 600, textTransform: "uppercase" }}>
        Demo Mode
      </Typography>

      <Box component="span" sx={{ mx: 0.5 }}>
        •
      </Box>

      <Typography component="span">
        Hosted for demo only — for full access{" "}
        <Link href={REPO_URL} target="_blank" underline="hover">
          clone the Git repo
        </Link>{" "}
        and{" "}
        <Link href={DOCS_URL} target="_blank" underline="hover">
          follow the docs
        </Link>
        .
      </Typography>
    </Box>
  );
}
