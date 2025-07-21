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
 * File   : env.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-07-18
 * Version: 1.0
 *
 * Purpose
 *   Compile-time-safe definition of the Cloudflare Workers
 *   environment bindings consumed by `worker.ts`.
 *   • `CF_SECRET_KEY` — Turnstile/recaptcha secret used to verify
 *     frontend challenge tokens.
 *   • `ASSETS`        — `KV`/`R2`/static-asset binding that serves the
 *     pre-built frontend bundle (and any other static files).
 *
 * Notes
 *   • Keep this interface in sync with `wrangler.toml` bindings.
 *   • Extend the interface whenever new environment variables or
 *     service bindings are introduced.
 * ------------------------------------------------------------------ */
import type { Fetcher } from "@cloudflare/workers-types/experimental";

export interface Env {
  CF_SECRET_KEY: string;
  ASSETS: Fetcher; // ↩ KV / R2 / Static-asset binding
}
