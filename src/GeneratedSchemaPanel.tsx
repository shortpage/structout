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
 * File   : GeneratedSchemaPanel.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 * ------------------------------------------------------------------
 *  Renders the read‑only artefacts generated from <SchemaDesigner/>.
 *  This includes:
 *    • Syntax‑highlighted JSON Schema preview
 *    • Provider/model client snippet (OpenAI, Anthropic, …)
 *    • Copy & Download actions (bundled ZIP with .json and .d.ts)
 *
 *  The component is pure‑view: all heavy lifting (schema generation,
 *  snippet templating, zip creation) is delegated to helpers in the
 *  `utils/` folder so this file stays lean and testable.
 * -------------------------------------------------------------- */

import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import SectionHeader from "./components/SectionHeader";
import {
  PanelRoot,
  ProviderRow,
  PanelBody,
  JsonArea,
} from "./style/GeneratedSchemaPanelLayout";

import { generateHelperFiles, HelperFiles } from "./utils/ideHelperGenerator";
import {
  PROVIDER_META,
  ProviderId,
  PROVIDERS,
  ModelKey,
} from "./utils/providerRegistry";
import { buildZipBundle } from "./utils/bundleHelpers";

/* ---------- view modes (examples removed) ---------------------- */
type ViewMode = "schema" | "helper:model" | "helper:main";

interface Props {
  jsonSchema: string;
  llmProvider: ProviderId;
  onProviderChange: (p: ProviderId) => void;
  schemaId?: string;
}

/* ---------- shared code style ---------------------------------- */
const codeStyle = {
  background: "#f5f5f5",
  borderRadius: 4,
  padding: 16,
  fontSize: 13,
  lineHeight: 1.4,
} as const;

/* ================  Component  ================================== */
const GeneratedSchemaPanel: React.FC<Props> = ({
  jsonSchema,
  llmProvider,
  onProviderChange,
  schemaId,
}) => {
  /* ----------------------- state -------------------------------- */
  const [modelKey, setModelKey] = useState<ModelKey>(
    PROVIDER_META[llmProvider].defaultModel,
  );
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("schema");
  const [blob, setBlob] = useState("");
  const [, setLang] = useState<"json" | "python">("json");
  const [, setHelpers] = useState<HelperFiles | null>(null);
  const [toast, setToast] = useState<string | undefined>();

  /* provider change → reset modelKey + view ---------------------- */
  useEffect(() => {
    setModelKey(PROVIDER_META[llmProvider].defaultModel);
    setView("schema");
    setBlob("");
    setLang("json");
  }, [llmProvider]);

  /* schema regeneration reset ------------------------------------ */
  useEffect(() => {
    setHelpers(null);
    setView("schema");
    setBlob("");
    setLang("json");
  }, [jsonSchema]);

  /* live-refresh helper code when modelKey changes ---------------- */
  useEffect(() => {
    if (!jsonSchema || !view.startsWith("helper")) return;
    const f = generateHelperFiles(jsonSchema, llmProvider, modelKey);
    setHelpers(f);
    setBlob(view === "helper:model" ? f.modelCode : f.mainCode);
    setLang("python");
  }, [modelKey, jsonSchema, llmProvider, view]);

  /* ---------- helpers (IDE code) ------------------------------- */
  const showHelpers = useCallback(
    (which: "model" | "main") => {
      if (!jsonSchema) return;
      const f = generateHelperFiles(jsonSchema, llmProvider, modelKey);
      setHelpers(f);
      setBlob(which === "model" ? f.modelCode : f.mainCode);
      setLang("python");
      setView(`helper:${which}` as ViewMode);
    },
    [jsonSchema, llmProvider, modelKey],
  );

  /* ---------- dropdowns ----------------------------------------- */
  const inHelperView = view.startsWith("helper");
  const safeModelKey: ModelKey =
    modelKey in PROVIDER_META[llmProvider].models
      ? modelKey
      : PROVIDER_META[llmProvider].defaultModel;

  /* choose a canonical filename id -------------------------------- */
  const canonicalId = (): string => {
    if (schemaId && schemaId.trim()) return safe(schemaId.trim());
    try {
      const obj = JSON.parse(jsonSchema || "{}");
      const raw = obj.metadataName || obj.title || obj.name || "schema";
      return safe(raw);
    } catch {
      return "schema";
    }
  };
  const safe = (raw: string) =>
    (/^[A-Za-z_]/.test(raw) ? raw : `_${raw}`).replace(/[^0-9A-Za-z_]/g, "_");

  /* ---------- copy & download ----------------------------------- */
  const isSchemaView = view === "schema";

  const copy = async () => {
    const txt = isSchemaView ? jsonSchema : blob;
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setToast("Copy failed. Your browser blocked clipboard access.");
    }
  };

  const download = async () => {
    if (!jsonSchema) return;
    try {
      const { blob: zipBlob, id } = await buildZipBundle(
        jsonSchema,
        llmProvider,
        undefined, // no exampleName
        canonicalId(),
      );
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setToast("ZIP generation failed – see console.");
    }
  };

  /* --------------------------- render --------------------------- */
  return (
    <PanelRoot>
      <SectionHeader title="Generated Schema" />

      {/* provider + model row */}
      <ProviderRow>
        <FormControl
          variant="standard"
          size="small"
          sx={{ minWidth: 130 }}
          disabled={inHelperView}
        >
          <InputLabel>Provider</InputLabel>
          <Select
            value={llmProvider}
            label="Provider"
            onChange={(e) => onProviderChange(e.target.value as ProviderId)}
          >
            {PROVIDERS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Model</InputLabel>
          <Select
            value={safeModelKey}
            label="Model"
            onChange={(e) => setModelKey(e.target.value as ModelKey)}
          >
            {Object.keys(PROVIDER_META[llmProvider].models).map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Copy / Download buttons */}
        <Tooltip title="Copy">
          <span>
            <IconButton
              size="small"
              disabled={isSchemaView ? !jsonSchema : !blob}
              onClick={copy}
              sx={{ ml: 1 }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Download bundle (ZIP)">
          <span>
            <IconButton
              size="small"
              disabled={!jsonSchema}
              onClick={download}
              sx={{ ml: 0.5 }}
            >
              <DownloadIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>

        {copied && (
          <Typography
            variant="caption"
            sx={{ ml: 1, display: "flex", alignItems: "center", gap: 0.5 }}
            color="success.main"
          >
            <CheckCircleIcon fontSize="small" /> Copied
          </Typography>
        )}
      </ProviderRow>

      {/* link bar */}
      <Box sx={{ px: 2, py: 0.5, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Link
          component="button"
          fontSize={13}
          underline={view === "schema" ? "always" : "hover"}
          onClick={() => setView("schema")}
        >
          JSON Schema
        </Link>

        <Link
          component="button"
          fontSize={13}
          underline={view.startsWith("helper") ? "always" : "hover"}
          onClick={() => showHelpers("model")}
        >
          IDE Helpers
        </Link>

        {view.startsWith("helper") && (
          <>
            <Link
              component="button"
              fontSize={12}
              sx={{ ml: 0.5 }}
              color="text.secondary"
              underline={view === "helper:model" ? "always" : "hover"}
              onClick={() => showHelpers("model")}
            >
              model
            </Link>
            <Link
              component="button"
              fontSize={12}
              sx={{ ml: 0.5 }}
              color="text.secondary"
              underline={view === "helper:main" ? "always" : "hover"}
              onClick={() => showHelpers("main")}
            >
              main
            </Link>
          </>
        )}
      </Box>

      {/* viewer */}
      <PanelBody>
        <JsonArea>
          {view === "schema" && jsonSchema && (
            <SyntaxHighlighter
              language="json"
              style={oneLight}
              customStyle={codeStyle}
              wrapLongLines
            >
              {jsonSchema}
            </SyntaxHighlighter>
          )}

          {view.startsWith("helper") && (
            <SyntaxHighlighter
              language="python"
              style={oneLight}
              customStyle={codeStyle}
              wrapLongLines
            >
              {blob}
            </SyntaxHighlighter>
          )}
        </JsonArea>
      </PanelBody>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(undefined)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setToast(undefined)}
          sx={{ width: "100%" }}
        >
          {toast}
        </Alert>
      </Snackbar>
    </PanelRoot>
  );
};

export default GeneratedSchemaPanel;
