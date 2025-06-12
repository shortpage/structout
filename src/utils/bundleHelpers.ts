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
 * Version: 1.0
 * ------------------------------------------------------------------
 *  Assemble a **zip archive** that ships everything a user needs:
 *    • Pydantic model + demo driver (per provider & model)
 *    • Provider-specific JSON Schemas (now honour schemaExclude)
 *    • Input / output folders ready for prompts & results
 * ------------------------------------------------------------------ */

import JSZip from "jszip";
import secureKeyPy from "../scaffolds/secure_key_py.txt?raw";
import secureKeyGuiPy from "../scaffolds/secure_key_gui_py.txt?raw";
import secureKeyConstPy from "../scaffolds/constants_py.txt?raw";
import exampleMap from "../examples/exampleManifest.json" assert { type: "json" };

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

/* ------------------------------------------------------------------
 * Append common helper files (secure-key + GUI) to the bundle
 * ------------------------------------------------------------------ */
function addHelperFiles(dir: JSZip): void {
  dir.file("secure_key.py", secureKeyPy);
  dir.file("secure_key_gui.py", secureKeyGuiPy);
  dir.file("constants.py", secureKeyConstPy);
}

function addExampleFromManifest(dir: JSZip, schemaId: string): void {
  const txt = (exampleMap as Record<string, string>)[schemaId];
  if (!txt) return;

  const inputDir = dir.folder("input")!; // idempotent
  inputDir.file(`${schemaId}_content.txt`, txt);
}

/* --------------------------- helpers --------------------------- */
const safePy = (s: string) =>
  (/^[A-Za-z_]/.test(s) ? s : `_${s}`).replace(/[^0-9A-Za-z_]/g, "_");

function loadFieldsForId(schemaId: string): SchemaField[] | null {
  try {
    const raw = localStorage.getItem(`schema_metadata_${schemaId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.fields) ? parsed.fields : null;
  } catch {
    return null; // SSR / incognito
  }
}

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

/* ------------------------------------------------------------------
 *                              main API
 * ------------------------------------------------------------------ */
export async function buildZipBundle(
  rawSchemaJson: string,
  _provider?: ProviderId,
  _exampleName?: string,
  overrideId?: string,
): Promise<{ blob: Blob; id: string }> {
  /* ── 0. parse designer JSON ─────────────────────────────────── */
  const rootObj = JSON.parse(rawSchemaJson);

  /* ── 1. choose schemaId ─────────────────────────────────────── */
  let rawId = rootObj.metadataName || rootObj.title || rootObj.name || "schema";
  if (!overrideId) {
    const meta = loadStoredMeta(safePy(rawId));
    if (meta?.metadataName) rawId = meta.metadataName;
  }
  if (overrideId) rawId = overrideId;

  const schemaId = safePy(rawId);
  const bundleId = `${schemaId}_api`;

  /* ── 2. load saved field list (if any) ──────────────────────── */
  const fields = loadFieldsForId(schemaId);

  /* ── 3. build ZIP structure ─────────────────────────────────── */
  const zip = new JSZip();
  const rootFolder = zip.folder(bundleId)!;

  /* —— top-level Pydantic model —— */
  {
    const coreSchema = fields
      ? jsonSchemaGenerator({
          fields,
          name: schemaId,
          description: "",
          headerRule: "[]",
        })
      : stripWrappers(rootObj);

    const { filenameModel, modelCode } = generateHelperFiles(
      JSON.stringify({ json_schema: { name: schemaId, schema: coreSchema } }),
      undefined,
      undefined,
      schemaId,
    );
    rootFolder.file(filenameModel, modelCode);
  }

  /* —— provider-specific bundles —— */
  for (const provider of PROVIDERS) {
    const pFolder = rootFolder.folder(provider)!;
    const headerRule = await PROVIDER_META[provider].getHeaderRule();
    const schemaExcl = await PROVIDER_META[provider].getSchemaExclude?.(); // ← CHANGED

    const providerSchemaObj = fields
      ? jsonSchemaGenerator({
          fields,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
          schemaExclude: schemaExcl, // ← CHANGED
        })
      : jsonSchemaGenerator({
          baseSchema: stripWrappers(rootObj) as Record<string, unknown>,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
          schemaExclude: schemaExcl, // ← CHANGED
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

  /* —— shared helper scripts & examples —— */
  addHelperFiles(rootFolder);
  addExampleFromManifest(rootFolder, schemaId);

  /* ── 4. generate & return blob ───────────────────────────────── */
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, id: bundleId };
}
