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

import { REPO_URL, DOCS_URL } from "../lib/constants";

export default function DemoBanner() {
  return (
    <div className="w-full bg-yellow-50 text-yellow-900 flex flex-wrap items-center justify-center gap-3 px-4 py-2 border-b border-yellow-300 text-sm">
      {/* square pulse indicator */}
      <div className="h-3 w-3 bg-yellow-600 rounded-sm animate-pulse" />

      {/* static label */}
      <span className="font-semibold uppercase tracking-wide">
        Demo&nbsp;Mode
      </span>

      {/* separator dot */}
      <span className="mx-1">•</span>

      {/* call‑to‑action block */}
      <span className="flex flex-wrap gap-1">
        Hosted&nbsp;for&nbsp;demo&nbsp;only — for&nbsp;full&nbsp;access&nbsp;
        <a
          href={REPO_URL}
          className="font-medium underline underline-offset-4 hover:text-yellow-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          clone&nbsp;the&nbsp;Git&nbsp;repo
        </a>
        &nbsp;and&nbsp;
        <a
          href={DOCS_URL}
          className="font-medium underline underline-offset-4 hover:text-yellow-700"
          target="_blank"
          rel="noopener noreferrer"
        >
          follow&nbsp;the&nbsp;docs
        </a>
        .
      </span>
    </div>
  );
}
