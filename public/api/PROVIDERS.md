# Provider Manifest Guide (`/src/api/*.json`)

> **TL;DR** – Each file under `/src/api/` describes **one LLM provider** in a
> small JSON fragment (≈ 15 lines).  The manifest is consumed at **build time**  
> by `providerRegistry.ts` and at **runtime** by the schema‑generator pipeline.  
> If the provider adds a new model or changes its JSON‑schema header format,  
> you **only touch this file** (plus `providerRegistry.ts`).

---

## 1  File naming & location

```
/src/api/
├─ openai.json
├─ anthropic.json
├─ google-gemini.json
├─ grok.json
├─ llama.json
└─ perplexity.json
```

*   The **filename** (without extension) becomes the provider **id** – keep it
    short, lowercase and use hyphens only if the official name contains one.
*   All manifests live **next to each other**; no sub‑folders, no mixed YAML.

---

## 2  Minimal manifest schema

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `provider` | ✓ | string | Human‑readable provider name (redundant but nice). |
| `apiKey`   | ✓ | string | **Environment variable name** or placeholder.  _Only used in the generated Python snippet._ |
| `llmSchemaHeader` | ✓ | **stringified** JSON‑array of header rules (see § 3). |
| `genAIURLPathParameter` | – | string | Optional REST upload path (used only by the demo CLI). |
| *any* | – | unknown | Ignored by core but preserved for future use. |

> **Why is `llmSchemaHeader` a *string*?** Keeping it stringified avoids the
> TypeScript JSON import assertion hazard and lets editors treat it as plain
> JSON for auto‑formatting.

---

## 3  `llmSchemaHeader` – anatomy

A header rule array describes how the **provider wants the JSON Schema wrapped**
when you send it in a prompt/tool call.  Each object conforms to the
`HeaderRuleEntry` interface:

```ts
interface HeaderRuleEntry {
  key: string;                 //  JSON key to emit
  type: "keyvalue" | "string" | "boolean" | "object" | "array";
  value?: unknown;             //  for literal key‑value pairs
  level: number;               //  nesting depth (root = 1)

  // optional extras ↓
  sourceparam?: "schemaName" | "schemaDescription";
  action?: "include" | "exclude";   // conditional copying
  actionLevel?: ("object" | "array")[];
  end?: boolean;                // tells the generator to close the object
}
```

### Quick cheat‑sheet

| Want to… | Rule example |
|----------|--------------|
| **Insert literal** pair | `{ "key":"type", "type":"keyvalue", "value":"json_schema", "level":1 }` |
| **Copy** dynamic value from metadata | `{ "key":"name", "type":"string", "level":2, "sourceparam":"schemaName" }` |
| **Open** an object wrapper | `{ "key":"json_schema", "type":"object", "level":1 }` |
| **Close** an object | same line + `"end": true` |

> 🛈 The generator crawls the rules **top‑down** and respects `level`/`end` to
> build the required wrapper before splicing in the user’s Draft‑7 schema.

---

## 4  Editing an existing provider

1. **Change in header format?**
  * Update only `llmSchemaHeader`.
  * Keep the array well‑formed JSON and ensure `level` / `end` pairings match.
2. **New REST upload path?**
  * Add/modify `genAIURLPathParameter` (string).  Leave blank if unused.
3. **API‑key rename?**
  * Adjust `apiKey` – the generated main.py will reflect the change.
4. **New model family?**
  * Add the key → model‑id mapping in `providerRegistry.ts` under
    `models: { … }` and bump `defaultModel` if appropriate.

No other code changes are needed – the UI and snippet engine pick up the new
values automatically.

---

## 5  Adding a brand‑new provider

1. **Create** `/<id>.json` in `/src/api/` using the minimal schema above.
2. **Update** `providerRegistry.ts`:

```ts
import type { ProviderMeta } from "./providerRegistry";
/* ——— acme ——— */
/* ——— acme ——— */
acme: {
    sdkImport: "from acme import AcmeClient", // import line in demo snippet
    defaultModel: "pro",
    getHeaderRule: () => loadHeaderRule("acme"),
    // 👉 REPLACE the body of `renderCall` with the real SDK invocation
    //    for your provider. Consult the provider’s docs. Requirements:
    //      • use `modelId`, `schemaVar`, and `contentVar`
    //      • set a variable named `payload` to the JSON result
    //      • return a *single* multiline string (\\`\\`\\`\\n ... \\n\\`\\`\\`)
    renderCall: ({ modelId, schemaVar, contentVar }) => `
    # Example only – edit to match the provider’s official SDK
    response = client.chat.completions.create(
        model="${modelId}",
        messages=[{"role":"user","content":${contentVar}}],
        response_format=${schemaVar},
)
payload = response.choices[0].message.parsed
`,
} as const satisfies ProviderMeta,

```

3. **Test** by selecting the provider in the UI → design a tiny schema →  
   _Download Bundle_.  The zip should include:
  * `<id>/<schema>_schema.json`
  * `<id>/<schema>_<modelKey>_main.py`

---

## 6  Current provider snapshot (2025‑06‑09)

| ID | Default model | Strict wrapper? | Upload path param |
|----|---------------|-----------------|-------------------|
| `openai` | `gpt-4o` | ✔ `json_schema` top‑level | `/genaiapp/uploadopenai/` |
| `anthropic` | `claude-3-5-sonnet-20240620` | *none* (plain `input_schema`) | *n/a* |
| `google-gemini` | `gemini-2.0-flash` | *none* (plain object) | `/market/uploadgemini/` |
| `grok` | `grok-3` | ✔ `json_schema` top‑level | `/genaiapp/uploadgrok/` |
| `llama` | `Llama-4-Maverick-17B-128E-Instruct-FP8` | ✔ `json_schema` top‑level | `/genaiapp/uploadllama/` |
| `perplexity` | `sonar-pro` | ✔ `json_schema` top‑level | `/genaiapp/uploadperplexity/` |

---

## 7  Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **“Invalid header rule format”** in console | `llmSchemaHeader` is not valid JSON or not an array | Run through a JSON lint; ensure outer brackets `[]`. |
| Provider picker shows new ID, but *Download Bundle* is missing files | Forgot to add provider entry to `providerRegistry.ts` **or** `models` object is empty | Complete step 2 of § 5. |
| Generated main.py raises `ValidationError` on *every* run | Header rule wraps schema incorrectly – check `level` / `end` nesting | Compare with a working provider; fix the nesting. 
