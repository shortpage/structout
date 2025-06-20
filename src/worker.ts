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
