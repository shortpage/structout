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
 * File   : cfWorker.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-07-18
 * Version: 1.0
 *
 * Purpose
 *   Cloudflare Workers entry-point that:
 *     • Exposes a POST /api/cf-verify endpoint to validate Turnstile
 *       CAPTCHA tokens against Cloudflare’s site-verify API.
 *     • Pass-throughs all other requests to the static asset KV
 *       namespace (`env.ASSETS`) so the SPA bundle is served without a
 *       separate origin.
 *
 * Request flow
 *   Browser POST /api/cf-verify  ─►  Worker.fetch()
 *       • Extracts `token` from JSON body
 *       • Forward-verifies token with Turnstile
 *       • Returns raw JSON from siteverify
 *
 *   Any other URL          ─►  env.ASSETS.fetch()  →  static content
 *
 * Types
 *   • Import uses @cloudflare/workers-types/experimental for precise
 *     Request/Response typings in modules workers mode.
 * ------------------------------------------------------------------ */

// <reference types="@cloudflare/workers-types/experimental" />

import type {
  ExportedHandler,
  Request as CfRequest,
  Response as CfResponse,
} from "@cloudflare/workers-types/experimental";
import type { Env } from "../types/env";

interface TurnstileBody {
  token: string;
}

const handler: ExportedHandler<Env> = {
  async fetch(
    request: CfRequest<unknown, IncomingRequestCfProperties<unknown>>,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<CfResponse> {
    const url = new URL(request.url);

    /* ---------- POST /api/cf-verify ------------- */
    if (url.pathname === "/api/cf-verify" && request.method === "POST") {
      const { token } = (await request.json()) as TurnstileBody;

      const body = new URLSearchParams({
        secret: env.CF_SECRET_KEY,
        response: token,
      });

      const verify = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        { method: "POST", body },
      );

      /* cast to CfResponse so headers.getAll() etc. match */
      return new globalThis.Response(await verify.text(), {
        headers: { "content-type": "application/json" },
      }) as unknown as CfResponse;
    }

    /* ---------- Fallback → Static bundle ---------- */
    return (await env.ASSETS.fetch(
      request as unknown as CfRequest<unknown, CfProperties<unknown>>,
    )) as unknown as CfResponse;
  },
};

export default handler;
