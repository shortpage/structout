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
 * File   : bundleHelpers.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  Assemble a **zip archive** that ships everything a user needs to
 *  try their schema locally:
 *    • Pydantic model + demo driver (per provider & model)
 *    • Provider‑specific JSON Schemas
 *    • Input / output folders ready for prompts & results
 *
 *  Push as much logic as possible to helpers (`jsonSchemaGenerator`,
 *  `ideHelperGenerator`) and keep this file focused on *layout* of
 *  the zip rather than schema introspection.
 *
 *  • Called by <GeneratedSchemaPanel/> → “Download bundle”.
 * -------------------------------------------------------------- */

import JSZip from "jszip";

import { generateHelperFiles } from "./ideHelperGenerator";
import {
  PROVIDERS,
  PROVIDER_META,
  ProviderId,
  ModelKey,
} from "./providerRegistry";
import jsonSchemaGenerator, {
  SchemaField,
} from "../components/jsonSchemaGenerator";

/* ───────── helpers ─────────────────────────────────────────────── */
const safePy = (s: string) =>
  (/^[A-Za-z_]/.test(s) ? s : `_${s}`).replace(/[^0-9A-Za-z_]/g, "_");

/* no-op stub: examples are no longer bundled */
function addExampleFiles(_: JSZip, __?: string): void {}

/* fetch authoring payload the Designer saved/loaded */
function loadFieldsForId(schemaId: string): SchemaField[] | null {
  try {
    const raw = localStorage.getItem(`schema_metadata_${schemaId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.fields) ? parsed.fields : null;
  } catch {
    return null; // SSR / tests / incognito
  }
}

/* quick helper: read metadataName & fields in one go */
function loadStoredMeta(
  slug: string,
): { metadataName?: string; fields?: SchemaField[] } | null {
  try {
    const raw = localStorage.getItem(`schema_metadata_${slug}`);
    return raw
      ? (JSON.parse(raw) as { metadataName?: string; fields?: SchemaField[] })
      : null;
  } catch {
    return null;
  }
}

/* peel nested “type=json_schema” wrappers (legacy path) */
type MaybeWrapped = { type?: string; json_schema?: { schema?: unknown } };

const stripWrappers = (node: unknown): unknown => {
  let cur: unknown = node;
  while (
    typeof cur === "object" &&
    cur !== null &&
    (cur as MaybeWrapped).type === "json_schema" &&
    (cur as MaybeWrapped).json_schema?.schema
  ) {
    cur = (cur as MaybeWrapped).json_schema!.schema;
  }
  return cur;
};

/* ───────── main API ────────────────────────────────────────────── */
export async function buildZipBundle(
  rawSchemaJson: string,
  _provider?: ProviderId,
  exampleName?: string, // retained for API backward-compat (ignored)
  overrideId?: string, // still works if a caller wants to force it
): Promise<{ blob: Blob; id: string }> {
  /* — 0.  Parse designer JSON —————————————————————————— */
  const rootObj = JSON.parse(rawSchemaJson);

  /* — 1.  Find the best identifier ———————————————— */
  //   Priority:
  //     1) explicit overrideId from caller
  //     2) metadataName saved in localStorage
  //     3) metadataName inside the JSON (rare)
  //     4) title / name inside the JSON
  //     5) fallback "schema"
  let rawId = rootObj.metadataName || rootObj.title || rootObj.name || "schema";

  // check localStorage first (unless caller forces overrideId)
  if (!overrideId) {
    const meta = loadStoredMeta(safePy(rawId)); // slugged key
    if (meta?.metadataName) rawId = meta.metadataName;
  }

  // caller always wins
  if (overrideId) rawId = overrideId;

  const schemaId = safePy(rawId); // -> “test”
  const bundleId = `${schemaId}_api`; // -> “test_api”

  /* — 2.  Load pristine field list (if saved) ————————— */
  const fields = loadFieldsForId(schemaId);

  /* — 3.  Build ZIP structure ——————————————————————— */
  const zip = new JSZip();
  const rootFolder = zip.folder(bundleId)!;

  /* —— top-level Pydantic model (needs a clean Draft-7 core) —— */
  {
    const coreSchema = fields
      ? jsonSchemaGenerator({
          fields,
          name: schemaId,
          description: "", // description unused for model
          headerRule: "[]",
        })
      : stripWrappers(rootObj); // legacy fallback

    const { filenameModel, modelCode } = generateHelperFiles(
      JSON.stringify({ json_schema: { name: schemaId, schema: coreSchema } }),
      undefined,
      undefined,
      schemaId,
    );
    rootFolder.file(filenameModel, modelCode);
  }

  /* (examples stub – remains a no-op) */
  addExampleFiles(rootFolder.folder("input")!, exampleName);

  /* —— provider-specific bundles —— */
  for (const provider of PROVIDERS) {
    const pFolder = rootFolder.folder(provider)!;
    const headerRule = await PROVIDER_META[provider].getHeaderRule();

    const providerSchemaObj = fields
      ? jsonSchemaGenerator({
          fields,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
        })
      : jsonSchemaGenerator({
          baseSchema: stripWrappers(rootObj) as Record<string, unknown>,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
        });

    pFolder.file(
      `${schemaId}_schema.json`,
      JSON.stringify(providerSchemaObj, null, 2),
    );

    const modelDict = PROVIDER_META[provider].models;
    for (const modelKey of Object.keys(modelDict) as ModelKey[]) {
      const { mainCode } = generateHelperFiles(
        JSON.stringify(providerSchemaObj),
        provider,
        modelKey,
        schemaId,
      );
      pFolder.file(`${schemaId}_${modelKey}_main.py`, mainCode);
    }
  }

  /* — 4.  Generate & return the blob ——————————————— */
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, id: bundleId }; // id === "<metadataName>_api"
}
