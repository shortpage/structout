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
 * Date   : 2025-06-09
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

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/** Pragmatic Draft-7 placeholder – tweak if you need deeper access */
type Draft7Schema = Record<string, unknown>;

/** Minimal node shape we read while walking the schema */
interface JsonSchemaNode {
  type?: string;
  description?: string;
  items?: JsonSchemaNode;
  properties?: Record<string, JsonSchemaNode>;
  [k: string]: unknown; // allow vendor extensions
}

export interface HelperFiles {
  modelCode: string;
  mainCode: string;
  filenameModel: string;
  filenameMain: string;
}

/* ------------------------------------------------------------------ */
/* Utility – unwrap OpenAI’s extra “type=json_schema” layer           */
/* ------------------------------------------------------------------ */
const stripJsonSchemaWrapper = (node: unknown): Draft7Schema | undefined => {
  if (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "json_schema" &&
    (node as { json_schema?: { schema?: Draft7Schema } }).json_schema?.schema
  ) {
    return (node as { json_schema: { schema: Draft7Schema } }).json_schema
      .schema;
  }
  // best effort: assume the passed node is already a Draft-7 schema
  return node as Draft7Schema | undefined;
};

/* ------------------------------------------------------------------ */
/* Provider-specific adapters                                         */
/* ------------------------------------------------------------------ */
type Adapter = {
  getName(root: unknown): string | undefined;
  getSchema(root: unknown): Draft7Schema | undefined;
};

/* —— Add/adjust providers with only TWO lambdas each  -------------- */
const ADAPTERS = {
  /* ——— OpenAI ———————————————————————————————— */
  openai: {
    getName: (r: unknown) =>
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      stripJsonSchemaWrapper(
        (r as { json_schema?: { schema?: unknown } }).json_schema?.schema,
      ),
  },

  /* ——— Anthropic ——————————————————————————— */
  anthropic: {
    getName: (r: unknown) => (r as { name?: string }).name,
    getSchema: (r: unknown) =>
      (r as { input_schema?: Draft7Schema }).input_schema,
  },

  /* ——— Google Gemini —————————————————————— */
  "google-gemini": {
    // designer saves **raw** schema, so the root *is* the schema
    getName: (r: unknown) =>
      (r as { title?: string; name?: string }).title ??
      (r as { name?: string }).name,
    getSchema: (r: unknown) =>
      (r as { schema?: Draft7Schema }).schema ?? (r as Draft7Schema),
  },

  /* ——— Llama API ——————————————————————————— */
  llama: {
    getName: (r: unknown) =>
      (r as { json_schema?: { name?: string } }).json_schema?.name,
    getSchema: (r: unknown) =>
      (r as { json_schema?: { schema?: Draft7Schema } }).json_schema?.schema,
  },

  /* ——— Grok & Perplexity reuse OpenAI logic ——— */
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

  /* ——— Fallback (best-effort) ———————————— */
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

/* ------------------------------------------------------------------ */
/* Provider list & Utility types                                      */
/* ------------------------------------------------------------------ */
type ProviderId = Exclude<keyof typeof ADAPTERS, "default">;

/* ------------------------------------------------------------------ */
/* Tiny utils                                                         */
/* ------------------------------------------------------------------ */
const IND = "    ";

const safePy = (s: string) =>
  (/^[A-Za-z_]/.test(s) ? s : `_${s}`).replace(/[^0-9A-Za-z_]/g, "_");

const toClass = (s: string) =>
  safePy(s).replace(/(?:^|_)(\w)/g, (_, c: string) => c.toUpperCase());

/* ------------------------------------------------------------------ */
/* Build Pydantic model + static tree layout comment                  */
/* ------------------------------------------------------------------ */
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

  /* — simple helper: map JSON-Schema primitives → Python types —— */
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
      /* — default: primitive mapping (falls back to str) — */
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

/* ------------------------------------------------------------------ */
/* Public generator – returns both helper texts + filenames           */
/* ------------------------------------------------------------------ */
export function generateHelperFiles(
  schemaJson: string,
  provider: ProviderId = "openai",
  modelKey?: string,
  schemaId?: string,
): HelperFiles {
  const parsed = JSON.parse(schemaJson);
  const adapter = ADAPTERS[provider] ?? ADAPTERS.default;

  /* —— locate Draft-7 schema ------------------------------------ */
  const schema = adapter.getSchema(parsed);
  if (!schema) throw new Error(`Schema not found for provider “${provider}”`);

  /* —— derive safe identifier ----------------------------------- */
  const rawName = schemaId ?? adapter.getName(parsed) ?? "schema";
  const id = safePy(rawName);
  const modelCls = toClass(id);

  /* —— generate helpers ----------------------------------------- */
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
