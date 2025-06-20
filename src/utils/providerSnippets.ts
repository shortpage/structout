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
 * Date   : 2025-06-10
 * Version: 1.3  (+ run header; indent-safe; Pydantic-v1/2 pretty print)
 *
 *  Emit a **self-contained Python demo** for the user-generated
 *  schema: reads the prompt & schema, calls the chosen provider SDK,
 *  validates the JSON response with Pydantic, prints pretty output
 *  and saves both raw & pretty artifacts to ../output/.
 *
 *  Compose the snippet in *one* place by stitching together small
 *  blocks (banner → I/O → provider call → validation → list-sampler)
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

/* ---------- helper: secure-key preamble ----------------------- */
function renderSecureKeyBlock(apiKeyConst: string): string {
  return `
# >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
# Secure, cross-platform secret retrieval
from secure_key import get_api_key
api_key = get_api_key("${apiKeyConst}")
# <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

`;
}

/* ---------- helper: wrap provider call with timing & tokens --- */
function wrapWithStats(block: string): string {
  return `
# -------- timed provider call -----------------------------------
t0 = datetime.now()
${block.trim()}
elapsed_ms = (datetime.now() - t0).total_seconds() * 1000

# ----- best-effort token-usage extraction -----------------------
input_tokens  = None
output_tokens = None
for _var in ("completion", "response", "msg"):
    if _var in locals():
        _obj  = locals()[_var]
        usage = getattr(_obj, "usage", None)
        if usage:
            input_tokens  = getattr(usage, "prompt_tokens",
                           getattr(usage, "input_tokens",  None))
            output_tokens = getattr(usage, "completion_tokens",
                           getattr(usage, "output_tokens", None))
        break
`.trimStart();
}

/* ---------------------------------------------------------------- */
export function buildMainTemplate(
  provider: ProviderId,
  id: string,
  modelCls: string,
  hasArray: boolean,
  layout: string,
  modelKey?: ModelKey,
): string {
  /* ---------- look-ups --------------------------------------- */
  const meta = PROVIDER_META[provider] as ProviderMeta;
  const keySafe = (modelKey ?? meta.defaultModel) as keyof typeof meta.models;
  const modelId = meta.models[keySafe];
  const needsTool = meta.needsToolName === true;
  const clientCtor = `${meta.clientCtor}(api_key=api_key${meta.clientExtra ?? ""})`;

  /* ---------- filenames -------------------------------------- */
  const schemaFile = `${id}_schema.json`;
  const promptFile = `${id}_content.txt`;

  /* ---------- banner + imports ------------------------------- */
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
import os, json, sys
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
${meta.sdkImport}
from pydantic import BaseModel, ValidationError
from typing    import Any
from ${id}_model import ${modelCls}
`;

  /* ---------- output-path block ------------------------------ */
  const outPaths = `
# -------- output paths -----------------------------------------
out_dir  = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "output"))
os.makedirs(out_dir, exist_ok=True)
_base    = os.path.basename(__file__)[:-8]   # strip "_main.py"
out_json = os.path.join(out_dir, _base + ".json")
out_txt  = os.path.join(out_dir,  _base + ".out")
`;

  /* ---------- read prompt + schema --------------------------- */
  const io = `
with open("./${schemaFile}", encoding="utf-8") as f:
    schema = json.load(f)

with open("../input/${promptFile}", encoding="utf-8") as f:
    content = f.read()
`;

  /* ---------- provider call ---------------------------------- */
  const rawCall = meta
    .renderCall({
      modelId,
      schemaVar: "schema",
      contentVar: "content",
      toolNameVar: needsTool ? JSON.stringify(id) : undefined,
    })
    .replace(/client\\s*=.*\\n/, `client = ${clientCtor}\n`);

  const apiCall = wrapWithStats(rawCall);

  /* ---------- validation + run-header ------------------------ */
  const validate = `
# -------- strict validation with graceful error report ---------
try:
    result: ${modelCls} = ${modelCls}.model_validate(payload)
except ValidationError as err:
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    with open(out_txt, "w", encoding="utf-8") as f:
        json.dump({"errors": err.errors(), "payload": payload},
                  f, indent=2, ensure_ascii=False)
    print("\\n❌ Validation failed – see output folder.")
    raise SystemExit(0)

# -------- run header -------------------------------------------
generated_at = datetime.now().isoformat(timespec="seconds")
header = (
    "\\n-----------------------------------------------\\n"
    f" Provider     : ${provider}\\n"
    f" Model        : ${modelId}\\n"
    f" Generated at : {generated_at}\\n"
    f" Input tokens : {input_tokens}\\n"
    f" Output tokens: {output_tokens}\\n"
    f" Exec-time ms : {int(elapsed_ms)}\\n"
    "-----------------------------------------------\\n"
)
print(header)

# -------- pretty-print validated result + save -----------------
pretty = json.dumps(result.model_dump(), indent=2, ensure_ascii=False)
print("✅ Pretty JSON\\n", pretty)

with open(out_json, "w", encoding="utf-8") as f:
    f.write(pretty)

with open(out_txt, "w", encoding="utf-8") as f:
    f.write(generated_at + "\\n")
    f.write(header + "\\n")
    f.write(pretty)
`;

  /* ---------- optional list-sampler -------------------------- */
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

  /* ---------- stitch & return ------------------------------- */
  return (
    banner +
    renderSecureKeyBlock(meta.apiKeyEnv) +
    `client = ${clientCtor}\n` +
    outPaths +
    io +
    apiCall +
    validate +
    sampler
  );
}
