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
 * File   : jsonSchemaGenerator.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-10
 * Version: 1.1  (+ schemaExclude support)
 *
 *  Pure helper that takes a `SchemaField[]` or partial `JsonSchema`
 *  and returns a fully valid Draft-07 JSON Schema object (not
 *  stringified).  It is intentionally framework-agnostic so you can
 *  call it from Node scripts or unit tests without a DOM.
 *
 *  Steps
 *    1. Convert `SchemaField[]` → coreSchema (if provided).
 *    2. Parse the provider-specific header rule and merge it with
 *       `coreSchema` (headers win on key clashes).
 *    3. Apply include/exclude rules from the header.
 *    4. **NEW**  Prune any keyword listed in `schemaExclude`
 *       (e.g. ["additionalProperties"]) across the entire tree.
 * ------------------------------------------------------------------ */

import type { HeaderRuleEntry } from "../utils/providerRegistry";

/* ───────────── Helper – generic JSON-Schema node ─────────────── */
interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  /* allow anything else */
  [key: string]: unknown;
}

/* ──────────────── Field definition ───────────────────────────── */
export interface SchemaField {
  key: string;
  type: string;
  level: number;
  aiPrompt: string;
  parentKey: string | null;
  required: boolean;
}

/* ---------- flexible call interface --------------------------- */
interface GeneratorOpts {
  /* choose ONE ↓ */
  fields?: SchemaField[];
  baseSchema?: JsonSchema;

  /* always required ↓ */
  name: string;
  description: string;
  headerRule: string | HeaderRuleEntry[];

  /* NEW ↓ – provider can drop keywords globally */
  schemaExclude?: string[];
}

/* ---------- legacy positional overload ----------------------- */
export default function jsonSchemaGenerator(
  fields: SchemaField[],
  schemaName: string,
  schemaDescription: string,
  headerRule: string | HeaderRuleEntry[],
): JsonSchema;

/* ---------- new options-object overload ---------------------- */
export default function jsonSchemaGenerator(opts: GeneratorOpts): JsonSchema;

/* ---------- single implementation ---------------------------- */
export default function jsonSchemaGenerator(
  a: SchemaField[] | GeneratorOpts,
  b?: string,
  c?: string,
  d?: string | HeaderRuleEntry[],
): JsonSchema {
  const isOpts = !Array.isArray(a);
  const opts: GeneratorOpts = isOpts
    ? (a as GeneratorOpts)
    : { fields: a as SchemaField[], name: b!, description: c!, headerRule: d! };

  /* ── STEP A – build provider header skeleton ───────────────── */
  const { headerRoot, allRules } = buildHeaderFromRule(
    opts.headerRule,
    opts.name,
    opts.description,
  );

  /* ── STEP B – obtain core Draft-7 schema ───────────────────── */
  const coreSchema =
    opts.baseSchema ?? generateCoreSchema(opts.fields ?? [], null);

  /* ── STEP C – merge + apply include/exclude rules ──────────── */
  mergeCoreIntoHeader(headerRoot, coreSchema);
  applyRulesRecursively(headerRoot, allRules);

  /* ── STEP D – prune provider-black-listed keywords (NEW) ───── */
  if (opts.schemaExclude?.length) {
    pruneKeywords(headerRoot, new Set(opts.schemaExclude));
  }

  return headerRoot;
}

/* ============================================================== */
/* ===============  helper logic (type-safe)  =================== */
/* ============================================================== */

interface IRule {
  key: string;
  type: "object" | "string" | "keyvalue" | "boolean" | "array";
  value?: unknown;
  sourceparam?: "schemaName" | "schemaDescription" | string;
  level: number;
  end?: boolean;
  action?: "include" | "exclude";
  actionLevel?: ("object" | "array")[];
}

/* ---------- header builder ----------------------------------- */
function buildHeaderFromRule(
  llmRule: string | HeaderRuleEntry[],
  nameParam: string,
  descParam: string,
): { headerRoot: JsonSchema; allRules: IRule[] } {
  const ruleArray: IRule[] = Array.isArray(llmRule)
    ? (llmRule as IRule[])
    : (JSON.parse(llmRule) as IRule[]);

  const root: JsonSchema = {};
  type StackItem = { node: JsonSchema; level: number; nodeType: "object" | "array" };
  const stack: StackItem[] = [{ node: root, level: 0, nodeType: "object" }];

  for (const r of ruleArray) {
    while (stack.length && stack[stack.length - 1].level >= r.level) stack.pop();
    if (!stack.length) stack.push({ node: root, level: 0, nodeType: "object" });

    const { node: parent, nodeType: parentType } = stack[stack.length - 1];

    switch (r.type) {
      case "object":
        parent[r.key] = {};
        stack.push({ node: parent[r.key] as JsonSchema, level: r.level, nodeType: "object" });
        break;

      case "string":
        parent[r.key] =
          r.sourceparam === "schemaName"
            ? nameParam
            : r.sourceparam === "schemaDescription"
              ? descParam
              : "";
        break;

      case "keyvalue":
        parent[r.key] = r.value;
        break;

      case "boolean":
        if (r.action === "include" && r.actionLevel?.includes(parentType))
          parent[r.key] = Boolean(r.value);
        break;

      case "array":
        if (r.action === "include" && r.actionLevel?.includes(parentType)) {
          if (r.value === "{keynames}") {
            const props = parent.properties ?? parent.items?.properties;
            parent[r.key] = props ? Object.keys(props) : [];
          } else if (Array.isArray(r.value)) {
            parent[r.key] = r.value;
          } else {
            parent[r.key] = [];
          }
        }
        break;
    }
    if (r.end) stack.pop();
  }
  return { headerRoot: root, allRules: ruleArray };
}

/* ---------- Draft-7 generator from flat field list ------------ */
function generateCoreSchema(
  allFields: SchemaField[],
  parentKey: string | null,
): JsonSchema {
  const schema: JsonSchema = { type: "object", properties: {} };
  const required: string[] = [];

  const norm = (t: string) => (t.startsWith("array-") ? "array" : t);

  allFields
    .filter((f) => f.parentKey === parentKey)
    .forEach((field) => {
      const prop: JsonSchema = { description: field.aiPrompt || "", type: norm(field.type) };

      if (field.type === "array-object") {
        const kids = allFields.filter((cf) => cf.parentKey === field.key);
        prop.items = kids.length
          ? generateCoreSchema(allFields, field.key)
          : { type: "object", properties: {} };
      } else if (field.type === "object") {
        const kids = allFields.filter((cf) => cf.parentKey === field.key);
        if (kids.length) {
          const child = generateCoreSchema(allFields, field.key);
          prop.properties = child.properties;
          if (child.required?.length) prop.required = child.required;
        } else {
          prop.properties = {};
        }
      } else if (field.type === "array-string") {
        prop.items = { type: "string" };
      } else if (field.type === "array-number") {
        prop.items = { type: "number" };
      }

      if (field.required) required.push(field.key);
      schema.properties![field.key] = prop;
    });

  if (required.length) schema.required = Array.from(new Set(required));
  return schema;
}

/* ---------- merge core into deepest header node --------------- */
function mergeCoreIntoHeader(headerRoot: JsonSchema, core: JsonSchema) {
  const target = findDeepestPropertiesNode(headerRoot);
  if (target) {
    target.properties = { ...target.properties, ...core.properties };
    if (core.required) target.required = core.required;
  } else {
    Object.assign(headerRoot, core);
  }
}

/* ---------- locate deepest “properties” holder ---------------- */
function findDeepestPropertiesNode(obj: JsonSchema): JsonSchema | null {
  if (typeof obj !== "object" || !obj) return null;
  let found: JsonSchema | null = null;

  if (obj.type === "object" && "properties" in obj) found = obj;
  for (const k of Object.keys(obj)) {
    const deeper = findDeepestPropertiesNode(obj[k] as JsonSchema);
    if (deeper) found = deeper;
  }
  return found;
}

/* ---------- BFS over final schema to enforce rules ------------ */
type SchemaKind = "object" | "array";
function applyRulesRecursively(root: JsonSchema, rules: IRule[]) {
  if (typeof root !== "object" || !root) return;
  const q: JsonSchema[] = [root];

  while (q.length) {
    const node = q.shift()!;
    const kind: SchemaKind | undefined =
      node.type === "object" ? "object" : node.type === "array" ? "array" : undefined;

    if (kind) {
      for (const r of rules) {
        if (r.action === "include" && r.actionLevel?.includes(kind)) {
          switch (r.type) {
            case "boolean":
              node[r.key] = Boolean(r.value);
              break;
            case "array":
              if (r.value === "{keynames}") {
                const props = node.properties ?? node.items?.properties;
                node[r.key] = props ? Object.keys(props) : [];
              } else if (Array.isArray(r.value)) {
                node[r.key] = r.value;
              } else {
                node[r.key] = [];
              }
              break;
            case "keyvalue":
              node[r.key] = r.value;
              break;
            case "string":
              node[r.key] = String(r.value ?? "");
              break;
            case "object":
              if (!node[r.key]) node[r.key] = {};
              break;
          }
        }
      }
    }
    for (const k of Object.keys(node)) {
      const child = node[k];
      if (typeof child === "object" && child) q.push(child as JsonSchema);
    }
  }
}

/* ---------- keyword pruning (provider-level) ------------------ */
function pruneKeywords(node: JsonSchema, ban: Set<string>) {
  if (typeof node !== "object" || node === null) return;
  for (const k of Object.keys(node)) {
    if (ban.has(k)) {
      delete node[k];
    } else {
      pruneKeywords(node[k] as JsonSchema, ban);
    }
  }
}
