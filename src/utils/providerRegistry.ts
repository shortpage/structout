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
 * File   : providerRegistry.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.1  (+ schemaExclude support)
 *
 *  Central registry that wraps the quirks of each LLM vendor SDK
 *  (OpenAI, Anthropic, Gemini, etc.) behind a *single* typed
 *  contract – so the rest of the codebase can stay vendor-agnostic.
 *  Expose a `PROVIDER_META` object where every key is a short id
 *  (`openai`, `anthropic`, …) and every value satisfies the
 *  `ProviderMeta` interface.  Doing so gives us full IntelliSense,
 *  compile-time guarantees, and predictable field names.
 *
 *  • Consumers: <Workbench/> (provider picker),
 *               jsonSchemaGenerator.ts (header rule & exclude list),
 *               providerSnippets.ts (client code).
 *  • To add another provider:
 *      1. Drop its JSON manifest in `/src/api/<id>.json`.
 *      2. Append a new entry to `PROVIDER_META` (keep list sorted!)
 *         filling in `sdkImport`, `models`, `renderCall`, etc.
 * ------------------------------------------------------------------ */

export type ModelKey = string;

/* ──────────── shared helper types ────────────────────────────── */
export interface HeaderRuleEntry {
  key: string;
  type: "keyvalue" | "string" | "boolean" | "object" | "array";
  value?: unknown;
  level: number;
  [extra: string]: unknown;
}

interface ProviderManifest {
  llmSchemaHeader?: unknown; // string | HeaderRuleEntry[]
  schemaExclude?: unknown; // string[]
}

/* ──────────── manifest loader (browser & node) ───────────────── */
async function loadManifest(provider: string): Promise<ProviderManifest> {
  /**  The file sits at /api/<name>.json in both dev & prod.   **/
  const res = await fetch(`/api/${provider}.json`);
  if (!res.ok) {
    throw new Error(`Unable to load /api/${provider}.json  (${res.status})`);
  }
  return (await res.json()) as ProviderManifest;
}

/* ──────────── normalisers -------------------------------------- */
function normaliseHeader(src: unknown, provider: string): HeaderRuleEntry[] {
  if (Array.isArray(src)) return src as HeaderRuleEntry[];
  if (typeof src === "string") return JSON.parse(src);
  throw new Error(`Invalid llmSchemaHeader for “${provider}”.`);
}

function normaliseExclude(src: unknown): string[] | undefined {
  if (Array.isArray(src)) return src.filter((s) => typeof s === "string");
  return undefined;
}

/* ──────────── ProviderMeta interface ─────────────────────────── */
export interface ProviderMeta {
  sdkImport: string;
  apiKeyEnv: string;
  clientCtor: string;
  clientExtra?: string;
  needsToolName?: boolean;

  models: Record<ModelKey, string>;
  defaultModel: ModelKey;

  /** Async because the header comes from a JSON file */
  getHeaderRule: () => Promise<HeaderRuleEntry[]>;

  /** Async for symmetry; returns undefined if provider keeps everything */
  getSchemaExclude?: () => Promise<string[] | undefined>;

  renderCall: (opts: {
    modelId: string;
    schemaVar: string;
    contentVar: string;
    toolNameVar?: string;
  }) => string;
}

/* =================================================================
 *   P  R  O  V  I  D  E  R     R  E  G  I  S  T  R  Y
 * ================================================================= */
export const PROVIDER_META = {
  /* ————————————————— OpenAI ————————————————— */
  openai: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "OPENAI_API_KEY",
    clientCtor: "OpenAI",
    models: { gpt4o: "gpt-4o", gpt35: "gpt-3.5-turbo" },
    defaultModel: "gpt4o",

    getHeaderRule: async () =>
      normaliseHeader((await loadManifest("openai")).llmSchemaHeader, "openai"),
    getSchemaExclude: async () => undefined,
    renderCall: ({ modelId, schemaVar, contentVar }) => /* unchanged */ `
completion = client.beta.chat.completions.parse(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format=${schemaVar},
)
msg     = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)`,
  } as const satisfies ProviderMeta,

  /* ————————————————— Anthropic ————————————————— */
  anthropic: {
    sdkImport: "from anthropic import Anthropic, APIError",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    clientCtor: "Anthropic",
    needsToolName: true,
    models: {
      sonnet: "claude-3-5-sonnet-20240620",
      haiku: "claude-3-5-haiku-20241022",
    },
    defaultModel: "sonnet",

    getHeaderRule: async () =>
      normaliseHeader(
        (await loadManifest("anthropic")).llmSchemaHeader,
        "anthropic",
      ),
    getSchemaExclude: async () => undefined,

    renderCall: ({
      modelId,
      schemaVar,
      contentVar,
      toolNameVar,
    }) => /* unchanged */ `
msg = client.messages.create(
    model="${modelId}",
    max_tokens=4096,
    temperature=0,
    tools=[${schemaVar}],
    tool_choice={"type":"tool","name":${toolNameVar}},
    messages=[{"role":"user","content":${contentVar}}],
)
tool_block = next(
    blk for blk in msg.content if getattr(blk,"type",None)=="tool_use"
)
payload = tool_block.input`,
  } as const satisfies ProviderMeta,

  /* ————————————————— Google Gemini ————————————————— */
  "google-gemini": {
    sdkImport: "from google import genai",
    apiKeyEnv: "GEMINI_API_KEY",
    clientCtor: "genai.Client",
    models: { flash: "gemini-2.0-flash", pro: "gemini-1.5-pro" },
    defaultModel: "flash",

    getHeaderRule: async () =>
      normaliseHeader(
        (await loadManifest("google-gemini")).llmSchemaHeader,
        "google-gemini",
      ),

    /* NEW: provider-specific exclude list */
    getSchemaExclude: async () =>
      normaliseExclude((await loadManifest("google-gemini")).schemaExclude),

    renderCall: ({ modelId, schemaVar, contentVar }) => /* unchanged */ `
contents = [genai.types.Content(role="user",
            parts=[genai.types.Part.from_text(text=${contentVar})])]
cfg = genai.types.GenerateContentConfig(
    temperature=1, top_p=0.95, top_k=40,
    max_output_tokens=12500,
    response_mime_type="application/json",
    response_schema=${schemaVar},
)
response = client.models.generate_content(
    model="${modelId}", contents=contents, config=cfg,
)
payload = json.loads(response.text)`,
  } as const satisfies ProviderMeta,

  /* ————————————————— Llama API ————————————————— */
  llama: {
    sdkImport: "from llama_api_client import LlamaAPIClient",
    apiKeyEnv: "LLAMA_API_KEY",
    clientCtor: "LlamaAPIClient",
    models: { maverick17b: "Llama-4-Maverick-17B-128E-Instruct-FP8" },
    defaultModel: "maverick17b",

    getHeaderRule: async () =>
      normaliseHeader((await loadManifest("llama")).llmSchemaHeader, "llama"),
    getSchemaExclude: async () => undefined,

    renderCall: ({ modelId, schemaVar, contentVar }) => /* unchanged */ `
completion = client.chat.completions.create(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format={
        "type":"json_schema",
        "json_schema":${schemaVar},
    },
)
payload = json.loads(completion.completion_message.content.text)`,
  } as const satisfies ProviderMeta,

  /* ————————————————— Grok (x.ai) ————————————————— */
  grok: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "GROK_API_KEY",
    clientCtor: "OpenAI",
    clientExtra: ', base_url="https://api.x.ai/v1"',
    models: {
      grok3: "grok-3",
      grok3fast: "grok-3-fast",
      grok3mini: "grok-3-mini",
      grok3minifast: "grok-3-minifast",
    },
    defaultModel: "grok3",

    getHeaderRule: async () =>
      normaliseHeader((await loadManifest("grok")).llmSchemaHeader, "grok"),
    getSchemaExclude: async () => undefined,

    renderCall: ({ modelId, schemaVar, contentVar }) => /* unchanged */ `
completion = client.beta.chat.completions.parse(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format=${schemaVar},
)
msg     = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)`,
  } as const satisfies ProviderMeta,

  /* ————————————————— Perplexity ————————————————— */
  perplexity: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "PERPLEXITY_API_KEY",
    clientCtor: "OpenAI",
    clientExtra: ', base_url="https://api.perplexity.ai"',
    models: { sonarpro: "sonar-pro", sonar: "sonar" },
    defaultModel: "sonarpro",

    getHeaderRule: async () =>
      normaliseHeader(
        (await loadManifest("perplexity")).llmSchemaHeader,
        "perplexity",
      ),
    getSchemaExclude: async () => undefined,

    renderCall: ({ modelId, schemaVar, contentVar }) => /* unchanged */ `
completion = client.beta.chat.completions.parse(
    model="${modelId}",
    messages=[
        {"role":"system","content":"You are a helpful assistant."},
        {"role":"user","content":${contentVar}},
    ],
    response_format=${schemaVar},
)
msg     = completion.choices[0].message
payload = msg.parsed if msg.parsed else json.loads(msg.content)`,
  } as const satisfies ProviderMeta,
} as const;

/* ──────────── convenience exports ────────────────────────────── */
export type ProviderId = keyof typeof PROVIDER_META;
export const PROVIDERS =
  Object.keys(PROVIDER_META) as readonly ProviderId[];
