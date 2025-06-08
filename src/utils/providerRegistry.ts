/* ------------------------------------------------------------------
 * MIT License © 2025 Sesh Ragavachari
 * File   : providerRegistry.ts
 * Version: 1.7.3 (syntax-fix, zero explicit-any)
 * ------------------------------------------------------------------ */

export type ModelKey = string;

/* ---------- HEADER-RULE TYPE ------------------------------------ */
export interface HeaderRuleEntry {
  key: string;
  type: "keyvalue" | "string" | "boolean" | "object" | "array";
  value?: unknown;
  level: number;
  [extra: string]: unknown;
}

/* ---------- helper: dynamic JSON import → HeaderRuleEntry[] ------ */
async function loadHeaderRule(provider: string): Promise<HeaderRuleEntry[]> {
  const normalise = (src: unknown): HeaderRuleEntry[] => {
    let candidate: unknown = src;

    if (typeof src === "object" && src !== null && "llmSchemaHeader" in src) {
      candidate = (src as { llmSchemaHeader?: unknown }).llmSchemaHeader;
    }

    if (Array.isArray(candidate)) return candidate as HeaderRuleEntry[];
    if (typeof candidate === "string")
      return JSON.parse(candidate) as HeaderRuleEntry[];

    throw new Error(`Invalid header rule format for provider “${provider}”.`);
  };

  /* Vite / Webpack ≥5 – works in browser builds ------------------ */
  try {
    const mod = await import(/* @vite-ignore */ `../api/${provider}.json`, {
      assert: { type: "json" },
    } as ImportCallOptions);

    // dev build → raw obj | prod build → { default: obj }
    return normalise(
      "default" in mod ? (mod as { default: unknown }).default : mod,
    );
  } catch {
    /* Node-only unit tests or legacy bundlers --------------------- */
    const res = await fetch(`/api/${provider}.json`);
    return normalise(await res.json());
  }
}

/* ---------- provider-metadata type ------------------------------ */
export interface ProviderMeta {
  sdkImport: string;
  apiKeyEnv: string;
  clientCtor: string;
  clientExtra?: string;
  needsToolName?: boolean;

  models: Record<ModelKey, string>;
  defaultModel: ModelKey;

  getHeaderRule: () => Promise<HeaderRuleEntry[]>;

  renderCall: (opts: {
    modelId: string;
    schemaVar: string;
    contentVar: string;
    toolNameVar?: string;
  }) => string;
}

/* ---------- registry ------------------------------------------- */
export const PROVIDER_META = {
  /* ————————— OpenAI ————————— */
  openai: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "OPENAI_API_KEY",
    clientCtor: "OpenAI",
    models: { gpt4o: "gpt-4o", gpt35: "gpt-3.5-turbo" },
    defaultModel: "gpt4o",

    getHeaderRule: () => loadHeaderRule("openai"),

    renderCall: ({ modelId, schemaVar, contentVar }) => `
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

  /* ————————— Anthropic ————————— */
  anthropic: {
    sdkImport: "from anthropic import Anthropic, APIError",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    clientCtor: "Anthropic",
    needsToolName: true,
    models: {
      sonnet: "claude-3-5-sonnet-20240620",
      haiku: "claude-3-5-haiku-20240620",
    },
    defaultModel: "sonnet",

    getHeaderRule: () => loadHeaderRule("anthropic"),

    renderCall: ({ modelId, schemaVar, contentVar, toolNameVar }) => `
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

  /* ————————— Google Gemini ————————— */
  "google-gemini": {
    sdkImport: "from google import genai",
    apiKeyEnv: "GEMINI_API_KEY",
    clientCtor: "genai.Client",
    models: { flash: "gemini-2.0-flash", pro: "gemini-1.5-pro" },
    defaultModel: "flash",

    getHeaderRule: () => loadHeaderRule("google-gemini"),

    renderCall: ({ modelId, schemaVar, contentVar }) => `
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

  /* ————————— Llama API ————————— */
  llama: {
    sdkImport: "from llama_api_client import LlamaAPIClient",
    apiKeyEnv: "LLAMA_API_KEY",
    clientCtor: "LlamaAPIClient",
    models: { maverick17b: "Llama-4-Maverick-17B-128E-Instruct-FP8" },
    defaultModel: "maverick17b",

    getHeaderRule: () => loadHeaderRule("llama"),

    renderCall: ({ modelId, schemaVar, contentVar }) => `
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

  /* ————————— Grok (x.ai) ————————— */
  grok: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "XAI_API_KEY",
    clientCtor: "OpenAI",
    clientExtra: ', base_url="https://api.x.ai/v1"',
    models: {
      grok3: "grok-3",
      grok3fast: "grok-3-fast",
      grok3mini: "grok-3-mini",
      grok3minifast: "grok-3-minifast",
    },
    defaultModel: "grok3",

    getHeaderRule: () => loadHeaderRule("grok"),

    renderCall: ({ modelId, schemaVar, contentVar }) => `
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

  /* ————————— Perplexity ————————— */
  perplexity: {
    sdkImport: "from openai import OpenAI, OpenAIError",
    apiKeyEnv: "PPLX_API_KEY",
    clientCtor: "OpenAI",
    clientExtra: ', base_url="https://api.perplexity.ai"',
    models: {
      sonarpro: "sonar-pro",
      sonar: "sonar",
    },
    defaultModel: "sonarpro",

    getHeaderRule: () => loadHeaderRule("perplexity"),

    renderCall: ({ modelId, schemaVar, contentVar }) => `
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

/* ---------- convenience exports -------------------------------- */
export type ProviderId = keyof typeof PROVIDER_META;
export const PROVIDERS = Object.keys(PROVIDER_META) as readonly ProviderId[];
