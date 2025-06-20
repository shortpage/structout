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
 * File   : ideHelperGenerator.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-10
 * Version: 1.0
 *
 *  Generate two helper files for the user bundle:
 *    1️⃣ <id>_model.py – Pydantic model matching the JSON Schema.
 *    2️⃣ <id>_main.py  – Self‑contained demo that calls the model
 *       provider, validates the response, and saves artefacts.

 *  Keep *all* provider quirks behind a small `ADAPTERS` table so the
 *  core logic (schema → Pydantic → Python snippet) is identical for
 *  every vendor.  The adapters only need two lambdas: `getName` and
 *  `getSchema`.
 *
 *  • Consumers: download button in <GeneratedSchemaPanel/>.
 *  • To add a new provider, drop two lambdas into `ADAPTERS`.
 *  • If Pydantic evolves (v3+), update `buildModel()` and error
 *    handling in providerSnippets.ts – the helpers will auto‑adapt.
 * -------------------------------------------------------------- */


import { buildMainTemplate } from "./providerSnippets";

/* ──────────── Types ────────────────────────────────────────────── */
type Draft7Schema = Record<string, unknown>;

interface JsonSchemaNode {
  type?: string;
  description?: string;
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
  [k: string]: unknown;
}

export interface HelperFiles {
  modelCode: string;
  mainCode: string;
  filenameModel: string;
  filenameMain: string;
}

/* ------------------------------------------------------------------
 *  Unwrap vendor-specific layers → return plain Draft-7 schema
 * ------------------------------------------------------------------ */
const stripJsonSchemaWrapper = (node: unknown): Draft7Schema | undefined => {
  /* Case 1 – OpenAI/Grok style wrapper */
  if (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "json_schema" &&
    (node as { json_schema?: { schema?: Draft7Schema } }).json_schema?.schema
  ) {
    return (node as { json_schema: { schema: Draft7Schema } }).json_schema
      .schema;
  }

  /* NEW fallback – many providers now put the schema directly under "schema" */
  if (
    typeof node === "object" &&
    node !== null &&
    (node as { schema?: Draft7Schema }).schema &&
    (node as { schema: { type?: string } }).schema.type === "object"
  ) {
    return (node as { schema: Draft7Schema }).schema;
  }

  /* If the node itself already looks like a Draft-7 schema */
  if ((node as { type?: string }).type === "object") {
    return node as Draft7Schema;
  }

  return undefined;
};

/* ------------------------------------------------------------------
 * Provider-specific adapters (two tiny lambdas each)
 * ------------------------------------------------------------------ */
type Adapter = {
  getName(root: unknown): string | undefined;
  getSchema(root: unknown): Draft7Schema | undefined;
};

const ADAPTERS = {
  /* ——— OpenAI ——————————————————————————————— */
  openai: {
    getName: (r: unknown) =>
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      stripJsonSchemaWrapper(
        (r as { json_schema?: { schema?: unknown } }).json_schema?.schema,
      ),
  },

  /* ——— Anthropic ———————————————————————————— */
  anthropic: {
    getName: (r: unknown) => (r as { name?: string }).name,
    getSchema: (r: unknown) =>
      (r as { input_schema?: Draft7Schema }).input_schema,
  },

  /* ——— Google Gemini ——————————————————————— */
  "google-gemini": {
    getName: (r: unknown) =>
      (r as { title?: string; name?: string }).title ??
      (r as { name?: string }).name,
    getSchema: (r: unknown) =>
      (r as { schema?: Draft7Schema }).schema ?? (r as Draft7Schema),
  },

  /* ——— Llama API ———————————————————————————— */
  llama: {
    getName: (r: unknown) =>
      (r as { name?: string }).name ??
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    // works for both wrapped *and* unwrapped payloads
    getSchema: (r: unknown) => stripJsonSchemaWrapper(r),
  },

  /* ——— Grok & Perplexity reuse OpenAI wrapper logic ———————— */
  grok: {
    getName: (r: unknown) =>
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      stripJsonSchemaWrapper(
        (r as { json_schema?: { schema?: unknown } }).json_schema?.schema,
      ),
  },
  perplexity: {
    getName: (r: unknown) =>
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      stripJsonSchemaWrapper(
        (r as { json_schema?: { schema?: unknown } }).json_schema?.schema,
      ),
  },

  /* ——— Fallback ———————————————————————————— */
  default: {
    getName: (r: unknown) =>
      (r as { name?: string }).name ??
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      stripJsonSchemaWrapper(
        (r as { schema?: unknown }).schema ??
        (r as { json_schema?: { schema?: unknown } }).json_schema?.schema ??
        (r as { input_schema?: unknown }).input_schema,
      ),
  },
} as const satisfies Record<string, Adapter>;

type ProviderId = Exclude<keyof typeof ADAPTERS, "default">;

/* ───────── tiny utils ─────────────────────────────────────────── */
const IND = "    ";
const safePy = (s: string) =>
  (/^[A-Za-z_]/.test(s) ? s : `_${s}`).replace(/[^0-9A-Za-z_]/g, "_");
const toClass = (s: string) =>
  safePy(s).replace(/(?:^|_)(\w)/g, (_, c: string) => c.toUpperCase());

/* ------------------------------------------------------------------
 * Draft-7 → Pydantic model (+ static layout comment)
 * ------------------------------------------------------------------ */
function buildModel(
  schema: JsonSchemaNode,
  rootId: string,
): { code: string; hasArray: boolean; layout: string } {
  const header = [
    "from pydantic import BaseModel",
    "from typing    import List\n",
  ];

  const classLines: string[] = [];
  const layoutLines: string[] = [];
  let hasArray = false;

  const pyType = (t?: string): string =>
    (
      ({
        string: "str",
        number: "float",
        integer: "int",
        boolean: "bool",
      }) as Record<string, string>
    )[t ?? ""] ?? "str";

  function walk(node: JsonSchemaNode, name: string, depth = 0) {
    const cls = toClass(name);
    const props = node.items?.properties ?? node.properties ?? {};
    const attr: string[] = [];
    const pref = "  ".repeat(depth);

    layoutLines.push(`${pref}- ${safePy(name)}: (${cls})`);

    Object.entries(props).forEach(([propName, def]) => {
      let typ = pyType(def.type);

      if (def.type === "array") {
        hasArray = true;
        if (def.items?.type === "object") {
          const childCls = toClass(`${name}_${propName}_item`);
          walk(def.items, `${name}_${propName}_item`, depth + 1);
          typ = `List[${childCls}]`;
        } else {
          typ = `List[${pyType(def.items?.type)}]`;
        }
      } else if (def.type === "object") {
        const childCls = toClass(`${name}_${propName}`);
        walk(def, `${name}_${propName}`, depth + 1);
        typ = childCls;
      }

      attr.push(
        `${IND}${safePy(propName)}: ${typ}` +
        (def.description ? `  # ${def.description}` : ""),
      );
    });

    classLines.push(`\nclass ${cls}(BaseModel):`);
    classLines.push(attr.length ? attr.join("\n") : `${IND}pass`);
  }

  walk(schema, rootId);

  return {
    code: header.join("\n") + classLines.join("\n") + "\n",
    hasArray,
    layout: layoutLines.join("\n"),
  };
}

/* ------------------------------------------------------------------
 * Public generator – produces <id>_model.py and <id>_main.py
 * ------------------------------------------------------------------ */
export function generateHelperFiles(
  schemaJson: string,
  provider: ProviderId = "openai",
  modelKey?: string,
  schemaId?: string,
): HelperFiles {
  const parsed   = JSON.parse(schemaJson);
  const adapter  = ADAPTERS[provider] ?? ADAPTERS.default;

  const schema   = adapter.getSchema(parsed);
  if (!schema)
    throw new Error(`Schema not found for provider “${provider}”`);

  const rawName  = schemaId ?? adapter.getName(parsed) ?? "schema";
  const id       = safePy(rawName);
  const modelCls = toClass(id);

  const { code: modelCode, hasArray, layout } = buildModel(schema, id);

  let mainCode = buildMainTemplate(
    provider,
    id,
    modelCls,
    hasArray,
    layout,
    modelKey,
  )
    .replace(
      new RegExp(`open\\("${id}_schema\\.json"`, "g"),
      `open("../${id}_schema.json"`,
    )
    .replace(
      new RegExp(`open\\("${id}_content\\.txt"`, "g"),
      `open("../../input/${id}_content.txt"`,
    );

  return {
    modelCode,
    mainCode,
    filenameModel: `${id}_model.py`,
    filenameMain: `${id}_main.py`,
  };
}
