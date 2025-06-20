import type { Fetcher } from "@cloudflare/workers-types/experimental";

export interface Env {
  CF_SECRET_KEY: string;
  ASSETS: Fetcher; // ↩ KV / R2 / Static-asset binding
}
