/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 * ------------------------------------------------------------------
 * File   : bundleHelpers.ts
 * Author : Sesh Ragavachari
 * Version: 1.0  (2025-07-16)
 * ------------------------------------------------------------------
 *  Assemble a **zip archive** that ships everything a user needs:
 *    • Pydantic model + demo driver (per provider & model)
 *    • Provider‑specific JSON Schemas (honours schemaExclude)
 *    • Input / output folders ready for prompts & results
 *    • requirements.txt generated from plain‑text scaffold files
 * ------------------------------------------------------------------ */

import JSZip from "jszip";
import secureKeyPy from "../scaffolds/secure_key_py.txt?raw";
import secureKeyGuiPy from "../scaffolds/secure_key_gui_py.txt?raw";
import secureKeyConstPy from "../scaffolds/constants_py.txt?raw";
import exampleMap from "../assets/manifests/examples.manifest.json" assert { type: "json" };
import baseReq from "../scaffolds/requirements/base.txt?raw";
import openaiReq from "../scaffolds/requirements/openai.txt?raw";
import anthropicReq from "../scaffolds/requirements/anthropic.txt?raw";
import googleReq from "../scaffolds/requirements/google.txt?raw";
import llamaReq from "../scaffolds/requirements/llama.txt?raw";

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

export const reqCatalogue: Record<string, string> = {
  base: baseReq,
  openai: openaiReq,
  anthropic: anthropicReq,
  google: googleReq,
  llama: llamaReq,
};

/* ───────────────────────────── helper utilities ───────────────────────────── */

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

/* ─────────────────────────────────── main API ─────────────────────────────────── */

export async function buildZipBundle(
  rawSchemaJson: string,
  _provider?: ProviderId,
  _exampleName?: string,
  overrideId?: string,
): Promise<{ blob: Blob; id: string }> {
  /* 0 ─ parse designer JSON */
  const rootObj = JSON.parse(rawSchemaJson);

  /* 1 ─ choose schemaId */
  let rawId = rootObj.metadataName || rootObj.title || rootObj.name || "schema";
  if (!overrideId) {
    const meta = loadStoredMeta(safePy(rawId));
    if (meta?.metadataName) rawId = meta.metadataName;
  }
  if (overrideId) rawId = overrideId;

  const schemaId = safePy(rawId);
  const bundleId = `${schemaId}_api`;

  /* 2 ─ load saved field list (if any) */
  const fields = loadFieldsForId(schemaId);

  /* 3 ─ build ZIP structure */
  const zip = new JSZip();
  const rootFolder = zip.folder(bundleId)!;

  // Ensure both input and output directories always exist
  rootFolder.folder("input");
  rootFolder.folder("output");

  /* —— top‑level Pydantic model —— */
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

  /* —— provider‑specific bundles —— */
  const usedProviders = new Set<ProviderId>();

  for (const provider of PROVIDERS) {
    const pFolder = rootFolder.folder(provider)!;
    const headerRule = await PROVIDER_META[provider].getHeaderRule();
    const schemaExcl = await PROVIDER_META[provider].getSchemaExclude?.();

    const providerSchemaObj = fields
      ? jsonSchemaGenerator({
          fields,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
          schemaExclude: schemaExcl,
        })
      : jsonSchemaGenerator({
          baseSchema: stripWrappers(rootObj) as Record<string, unknown>,
          name: schemaId,
          description: rootObj.description ?? `Schema for ${schemaId}`,
          headerRule,
          schemaExclude: schemaExcl,
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

    usedProviders.add(provider);
  }

  /* —— shared helper scripts & examples —— */
  addHelperFiles(rootFolder);
  addExampleFromManifest(rootFolder, schemaId);

  /* —— requirements.txt —— */
  const lines = new Set<string>(reqCatalogue.base?.trim().split(/\r?\n/) ?? []);
  for (const p of usedProviders) {
    reqCatalogue[p]
      ?.trim()
      .split(/\r?\n/)
      .forEach((l) => lines.add(l));
  }
  rootFolder.file("requirements.txt", [...lines].join("\n") + "\n");

  /* 4 ─ generate & return blob */
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, id: bundleId };
}

/* ───────────────────────────── helper add‑ins ───────────────────────────── */

function addHelperFiles(dir: JSZip): void {
  dir.file("secure_key.py", secureKeyPy);
  dir.file("secure_key_gui.py", secureKeyGuiPy);
  dir.file("constants.py", secureKeyConstPy);
}

/**
 * Writes an example content file into the `input/` directory, if one exists in the
 * manifest. Handles both string and string[] representations gracefully.
 */
function addExampleFromManifest(dir: JSZip, schemaId: string): void {
  const entry = (exampleMap as Record<string, string | string[]>)[schemaId];
  if (!entry) return;

  const txt = Array.isArray(entry) ? entry.join("\n") : entry;
  dir.folder("input")!.file(`${schemaId}_content.txt`, txt);
}
