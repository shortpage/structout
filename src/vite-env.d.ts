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
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : vite-env.d.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-07-18
 * Version: 1.0
 *
 * Purpose
 *   Augments Vite’s ambient types to expose a single build-time flag:
 *     • VITE_DEMO_READ_ONLY = "1" → run the demo in read-only mode
 *
 *   This file is auto-included via the `/// <reference types="vite/client" />`
 *   directive so that `import.meta.env.VITE_DEMO_READ_ONLY` is fully typed
 *   across the project.
 * ------------------------------------------------------------------ */

/// <reference types="vite/client" />

// augment Vite’s ambient types ---------------------------
declare interface ImportMetaEnv {
  /** “1” when the demo build should be read-only */
  readonly VITE_DEMO_READ_ONLY?: "0" | "1";
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
