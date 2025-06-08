/* ------------------------------------------------------------------
 * MIT License  © 2025  Sesh Ragavachari
 * File : providerSnippets.ts  – v3.0 (output files + graceful errors)
 * ------------------------------------------------------------------ */

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
