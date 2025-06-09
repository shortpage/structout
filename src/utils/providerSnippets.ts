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
 * File   : providerSnippets.ts
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  Emit a **self‑contained Python demo** for the user‑generated
 *  schema: reads the prompt & schema, calls the chosen provider SDK,
 *  validates the JSON response with Pydantic, prints pretty output
 *  and saves both raw & pretty artifacts to ../output/.
 *
 *  Compose the snippet in *one* place by stitching together small
 *  blocks (banner → I/O → provider call → validation → list‑sampler)
 *  so downstream changes (e.g. new validation style) are done in a
 *  single function instead of scattered template files.
 *
 *  • Consumers: <GeneratedSchemaPanel/> only.
 *  • To support a new provider SDK *without touching this file* – add
 *    a `renderCall()` lambda in providerRegistry.ts.
 *  • If you need to adjust the validation logic (e.g. switch from
 *    Pydantic v2 → v3) just edit the `validate` block here and all
 *    providers inherit the change automatically.
 * -------------------------------------------------------------- */

import { ProviderId, PROVIDER_META, ModelKey } from "./providerRegistry";
import { ProviderMeta } from "./providerRegistry";
/* ------------------------------------------------------------------ */
export function buildMainTemplate(
  provider: ProviderId,
  id: string,
  modelCls: string,
  hasArray: boolean,
  layout: string,
  modelKey?: ModelKey,
): string {
  /* ---------- look-ups ------------------------------------------ */
  const meta = PROVIDER_META[provider] as ProviderMeta;

  const clientCtor = meta.clientCtor; // ← restore this
  const modelDict = meta.models;
  const keySafe: keyof typeof modelDict = (modelKey ??
    meta.defaultModel) as keyof typeof modelDict;

  const modelId = modelDict[keySafe];
  const clientExtra = meta.clientExtra ?? "";
  const needsTool = meta.needsToolName === true;

  /* ---------- filenames ----------------------------------------- */
  const schemaFile = `${id}_schema.json`;
  const promptFile = `${id}_content.txt`;

  /* ---------- banner + imports ---------------------------------- */
  const banner = `
"""Tiny self-contained demo (${provider.toUpperCase()} SDK)

• Validates JSON output against \`${schemaFile}\`
• Pretty-prints the validated data
• Saves results in ../output/
• Shows static Pydantic layout (below)
• Dumps the first element of every list (if any)

—— MODEL LAYOUT —————————————————————————
${layout.trim()}
————————————————————————————————————————"""
import os, json, logging, sys
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
${meta.sdkImport}
from pydantic import BaseModel, ValidationError
from pprint   import pprint
from typing   import Any
from ${id}_model import ${modelCls}

client = ${clientCtor}(api_key=os.getenv("${meta.apiKeyEnv}")${clientExtra})

# -------- output paths -------------------------------------------
out_dir  = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "output"))
os.makedirs(out_dir, exist_ok=True)
_base    = os.path.basename(__file__)[:-8]           # strip "_main.py"
out_json = os.path.join(out_dir, _base + ".json")
out_txt  = os.path.join(out_dir,  _base + ".out")
`;

  /* ---------- read prompt + schema ------------------------------ */
  const io = `
with open("./${schemaFile}", encoding="utf-8") as f:
    schema = json.load(f)

with open("../input/${promptFile}", encoding="utf-8") as f:
    content = f.read()
`;

  /* ---------- provider request ---------------------------------- */
  const apiCall = meta.renderCall({
    modelId,
    schemaVar: "schema",
    contentVar: "content",
    toolNameVar: needsTool ? JSON.stringify(id) : undefined,
  });

  /* ---------- validation block ---------------------------------- */
  const validate = `
# -------- strict validation with graceful error report ------------
try:
    result: ${modelCls} = ${modelCls}.model_validate(payload)
except ValidationError as err:
    # ❶ save raw payload
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    # ❷ build and save validation report
    missing, type_errors, other_errors = [], [], []
    for e in err.errors():
        path = ".".join(str(p) for p in e["loc"])
        t    = e.get("type", "")
        if t == "missing":
            missing.append(path)
        elif t.startswith("type"):
            type_errors.append((path, e["msg"]))
        else:
            other_errors.append((path, e["msg"]))

    with open(out_txt, "w", encoding="utf-8") as f:
        f.write(datetime.now().isoformat() + "\\n\\nRAW PAYLOAD:\\n")
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\\n\\nVALIDATION SUMMARY:\\n")
        if missing:
            f.write("\\n— Missing required keys:\\n")
            for p in missing: f.write("   • " + p + "\\n")
        if type_errors:
            f.write("\\n— Type mismatches:\\n")
            for p, msg in type_errors: f.write(f"   • {p}: {msg}\\n")
        if other_errors:
            f.write("\\n— Other issues:\\n")
            for p, msg in other_errors: f.write(f"   • {p}: {msg}\\n")

    # ❸ console output
    print("\\n❌ Raw JSON from model\\n",
          json.dumps(payload, indent=2, ensure_ascii=False))
    print("\\n*** Validation problems detected ***")
    for line in open(out_txt, encoding="utf-8").read().splitlines()[3:]:
        print(line)
    raise SystemExit(0)

# -------- pretty-print validated result + save -------------------
pretty = ""
try:
    pretty = result.model_dump_json(indent=2, ensure_ascii=False)
except TypeError:  # Pydantic v1 fallback
    pretty = json.dumps(result.model_dump(), indent=2, ensure_ascii=False)

print("\\n✅ Pretty JSON\\n", pretty)

with open(out_json, "w", encoding="utf-8") as f:
    f.write(pretty)

with open(out_txt, "w", encoding="utf-8") as f:
    f.write(datetime.now().isoformat() + "\\n\\n")
    f.write(pretty)
`;

  /* ---------- optional list-sampler ----------------------------- */
  const sampler = hasArray
    ? `
def _dump_first(obj: BaseModel, path: str = "") -> None:
    for field, val in obj:
        full = f"{path}.{field}" if path else field
        if isinstance(val, list) and val:
            print(f"{full}[0] →", val[0])
            if isinstance(val[0], BaseModel):
                _dump_first(val[0], f"{full}[0]")
        elif isinstance(val, BaseModel):
            _dump_first(val, full)

print("\\n🗂️  First samples from every list")
_dump_first(result)
`
    : "";

  /* ---------- stitch & return ----------------------------------- */
  return banner + io + apiCall + validate + sampler;
}
