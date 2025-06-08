/* ------------------------------------------------------------------
 * MIT License © 2025 Sesh Ragavachari
 * ------------------------------------------------------------------
 * File   : loadProviderConfig.ts
 * Version: 1.0.1  (eslint-clean: no-explicit-any)
 * ------------------------------------------------------------------
 * Purpose
 *   Dynamically load `/src/api/<provider>.json` template files.
 * ------------------------------------------------------------------ */

interface ProviderConfig {
  /** Human-readable identifier (“openai”, “anthropic”, …)            */
  provider: string;
  /** JSON-stringified rule array consumed by `jsonSchemaGenerator`  */
  llmSchemaHeader: string;
  /** Example upload path used by demo `*_main.py` stubs              */
  genAIURLPathParameter: string;
  /* Extend with more fields (rateLimit, models[], …) as needed. */
}

/* ---------- helper types ---------------------------------------- */
type JsonModule = ProviderConfig | { default: ProviderConfig };
type ModuleImporter = () => Promise<JsonModule>;
type ImporterRegistry = Record<string, ModuleImporter>;

/**
 * Load and parse `../api/<providerId>.json`.
 * Throws if the file is missing or the glob fails to return a match.
 */
export async function loadProviderConfig(
  providerId: string,
): Promise<ProviderConfig> {
  /* Vite’s glob import --------------------------------------------- */
  const modules = import.meta.glob("../api/*.json") as ImporterRegistry;

  const key = `../api/${providerId}.json`;
  const importer = modules[key];

  if (!importer) {
    throw new Error(`No JSON file found for provider “${providerId}”`);
  }

  /* dev build → raw object | prod build → { default: obj } --------- */
  const mod = await importer();
  return "default" in mod ? mod.default : mod;
}
