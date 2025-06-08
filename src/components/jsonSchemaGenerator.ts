/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 * …
 * ------------------------------------------------------------------ */

import type { HeaderRuleEntry } from "../utils/providerRegistry";

/* ───────────── Helper – generic JSON-Schema node ─────────────── */
interface JsonSchema {
  /* minimal Draft-7 surface this file needs */
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema; // may itself hold .properties
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

/* ---------- NEW flexible call interface ----------------------- */
interface GeneratorOpts {
  /* choose ONE ↓ */
  fields?: SchemaField[];
  baseSchema?: JsonSchema;

  /* always required ↓ */
  name: string;
  description: string;
  headerRule: string | HeaderRuleEntry[];
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
  type StackItem = {
    node: JsonSchema;
    level: number;
    nodeType: "object" | "array";
  };
  const stack: StackItem[] = [{ node: root, level: 0, nodeType: "object" }];

  for (const r of ruleArray) {
    while (stack.length && stack[stack.length - 1].level >= r.level)
      stack.pop();
    if (!stack.length) stack.push({ node: root, level: 0, nodeType: "object" });

    const { node: parent, nodeType: parentType } = stack[stack.length - 1];

    switch (r.type) {
      case "object":
        parent[r.key] = {};
        stack.push({
          node: parent[r.key] as JsonSchema,
          level: r.level,
          nodeType: "object",
        });
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
            if (parent.properties) {
              parent[r.key] = Object.keys(parent.properties);
            } else if (parent.items?.properties) {
              parent[r.key] = Object.keys(parent.items.properties);
            } else {
              parent[r.key] = [];
            }
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
  const requiredFields: string[] = [];

  const deduce = (t: string) => (t.startsWith("array-") ? "array" : t);

  allFields
    .filter((f) => f.parentKey === parentKey)
    .forEach((field) => {
      const prop: JsonSchema = { description: field.aiPrompt || "" };
      prop.type = deduce(field.type);

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

      if (field.required) requiredFields.push(field.key);
      schema.properties![field.key] = prop;
    });

  if (requiredFields.length)
    schema.required = Array.from(new Set(requiredFields));
  return schema;
}

/* ---------- merge core into deepest header node --------------- */
function mergeCoreIntoHeader(headerRoot: JsonSchema, coreSchema: JsonSchema) {
  const target = findDeepestPropertiesNode(headerRoot);
  if (target) {
    target.properties = {
      ...target.properties,
      ...coreSchema.properties,
    };
    if (coreSchema.required) target.required = coreSchema.required;
  } else {
    Object.assign(headerRoot, coreSchema);
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

/* ---------- BFS over final schema to enforce rules ------------- */
type SchemaKind = "object" | "array";
function applyRulesRecursively(rootNode: JsonSchema, rules: IRule[]) {
  if (typeof rootNode !== "object" || !rootNode) return;
  const q: JsonSchema[] = [rootNode];

  while (q.length) {
    const node = q.shift()!;
    const kind: SchemaKind | undefined =
      node.type === "object"
        ? "object"
        : node.type === "array"
          ? "array"
          : undefined;

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
