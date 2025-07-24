/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : GeneratedSchemaPanel.tsx (Mobile-Responsive Version)
 * Author : Sesh Ragavachari
 * Date   : 2025-07-24
 * Version: 2.0 - Mobile Support Added
 * ------------------------------------------------------------------ */

import React, { useCallback, useEffect, useState } from "react";
import {
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import SectionHeader from "./components/SectionHeader";
import {
  PanelRoot,
  ProviderRow,
  LinkBar,
  PanelBody,
  JsonArea,
  StatusIndicator,
  ResponsiveText,
} from "./style/GeneratedSchemaPanelLayout";

import { generateHelperFiles, HelperFiles } from "./utils/ideHelperGenerator";
import {
  PROVIDER_META,
  ProviderId,
  PROVIDERS,
  ModelKey,
} from "./utils/providerRegistry";
import { buildZipBundle } from "./utils/bundleHelpers";
import { LegalDownloadDialog } from "./components/LegalDownloadDialog";
import { LEGAL_POPUP_EVERY_DOWNLOAD } from "./lib/constants";
import { useResponsive, copyToClipboard } from "./utils/mobileUtils";

/* ---------- view modes ------------------------------------------ */
type ViewMode = "schema" | "helper:model" | "helper:main";

interface Props {
  jsonSchema: string;
  llmProvider: ProviderId;
  onProviderChange: (p: ProviderId) => void;
  schemaId?: string;
}

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
  const [, setHelpers] = useState<HelperFiles | null>(null);
  const [toast, setToast] = useState<string | undefined>();
  const [dlgOpen, setDlgOpen] = useState(false);

  // Mobile responsiveness
  const { isMobile } = useResponsive();

  // Dark mode (honor system preference once; persist thereafter)
  const [darkMode, setDarkMode] = useState<boolean>(
    () =>
      (localStorage.getItem("schema_dark") ??
        (window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "1"
          : "0")) === "1",
  );

  const showCheckbox = !LEGAL_POPUP_EVERY_DOWNLOAD;

  const codeBase = {
    borderRadius: 4,
    fontSize: isMobile ? 12 : 13,
    lineHeight: 1.4,
    padding: isMobile ? "12px 0" : "16px 0",
  } as const;

  const gutter = (dark: boolean) => ({
    minWidth: isMobile ? 32 : 38,
    paddingRight: isMobile ? 8 : 12,
    textAlign: "right" as const,
    userSelect: "none" as const,
    color: dark ? "#889" : "#667",
    background: dark ? "#1b1d21" : "#ececec",
  });

  useEffect(() => {
    localStorage.setItem("schema_dark", darkMode ? "1" : "0");
  }, [darkMode]);

  /* provider change → reset modelKey + view ---------------------- */
  useEffect(() => {
    setModelKey(PROVIDER_META[llmProvider].defaultModel);
    setView("schema");
    setBlob("");
  }, [llmProvider]);

  /* schema regeneration reset ------------------------------------ */
  useEffect(() => {
    setHelpers(null);
    setView("schema");
    setBlob("");
  }, [jsonSchema]);

  /* live-refresh helper code when modelKey changes ---------------- */
  useEffect(() => {
    if (!jsonSchema || !view.startsWith("helper")) return;
    const f = generateHelperFiles(jsonSchema, llmProvider, modelKey);
    setHelpers(f);
    setBlob(view === "helper:model" ? f.modelCode : f.mainCode);
  }, [modelKey, jsonSchema, llmProvider, view]);

  /* ---------- helpers (IDE code) ------------------------------- */
  const showHelpers = useCallback(
    (which: "model" | "main") => {
      if (!jsonSchema) return;
      const f = generateHelperFiles(jsonSchema, llmProvider, modelKey);
      setHelpers(f);
      setBlob(which === "model" ? f.modelCode : f.mainCode);
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

    const success = await copyToClipboard(txt);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      setToast("Copy failed. Your browser blocked clipboard access.");
    }
  };

  const startDownload = () => {
    if (LEGAL_POPUP_EVERY_DOWNLOAD) {
      setDlgOpen(true);
      return;
    }
    const userOptedOut = localStorage.getItem("structout.legalSkip") === "yes";
    if (userOptedOut) {
      void doDownload();
    } else {
      setDlgOpen(true);
    }
  };

  const doDownload = async () => {
    if (!jsonSchema) return;
    try {
      const { blob: zipBlob, id } = await buildZipBundle(
        jsonSchema,
        llmProvider,
        undefined,
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

  const handleAccept = (dontRepeat: boolean) => {
    if (dontRepeat) localStorage.setItem("structout.legalSkip", "yes");
    setDlgOpen(false);
    void doDownload();
  };

  /* --------------------------- render --------------------------- */
  return (
    <PanelRoot>
      <SectionHeader title="Generated Schema" />

      {/* Provider + Model Controls */}
      <ProviderRow>
        <FormControl
          variant="standard"
          size="small"
          sx={{ minWidth: isMobile ? 110 : 130 }}
          disabled={inHelperView}
        >
          <InputLabel>Provider</InputLabel>
          <Select
            value={llmProvider}
            label="Provider"
            onChange={(e) => onProviderChange(e.target.value as ProviderId)}
            id="provider-select"
          >
            {PROVIDERS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          variant="standard"
          size="small"
          sx={{ minWidth: isMobile ? 120 : 150 }}
          disabled={view !== "helper:main"}
        >
          <InputLabel>Model</InputLabel>
          <Select
            value={safeModelKey}
            label="Model"
            onChange={(e) => setModelKey(e.target.value as ModelKey)}
            id="model-select"
          >
            {Object.keys(PROVIDER_META[llmProvider].models).map((k) => (
              <MenuItem key={k} value={k}>
                {k}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Tooltip title="Copy">
          <span>
            <IconButton
              size="small"
              disabled={isSchemaView ? !jsonSchema : !blob}
              onClick={copy}
              sx={{ ml: isMobile ? 0.5 : 1 }}
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
              onClick={startDownload}
              sx={{ ml: 0.5 }}
              id="btn-download"
            >
              <DownloadIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={darkMode ? "Light mode" : "Dark mode"}>
          <IconButton
            size="small"
            onClick={() => setDarkMode((p) => !p)}
            sx={{ ml: 0.5 }}
          >
            <Brightness4Icon fontSize="inherit" />
          </IconButton>
        </Tooltip>

        {copied && (
          <StatusIndicator type="success">
            <CheckCircleIcon fontSize="small" />
            <ResponsiveText size="small">Copied</ResponsiveText>
          </StatusIndicator>
        )}
      </ProviderRow>

      {/* Navigation Links */}
      <LinkBar>
        <Link
          component="button"
          fontSize={isMobile ? 12 : 13}
          underline={view === "schema" ? "always" : "hover"}
          onClick={() => setView("schema")}
        >
          JSON Schema
        </Link>

        <Link
          component="button"
          fontSize={isMobile ? 12 : 13}
          id="link-helpers"
          underline={view.startsWith("helper") ? "always" : "hover"}
          onClick={() => showHelpers("model")}
        >
          IDE Helpers
        </Link>

        {view.startsWith("helper") && (
          <>
            <Link
              component="button"
              fontSize={11}
              sx={{ ml: 0.5 }}
              color="text.secondary"
              underline={view === "helper:model" ? "always" : "hover"}
              onClick={() => showHelpers("model")}
            >
              model
            </Link>
            <Link
              component="button"
              fontSize={11}
              sx={{ ml: 0.5 }}
              color="text.secondary"
              underline={view === "helper:main" ? "always" : "hover"}
              id="link-helper-main"
              onClick={() => showHelpers("main")}
            >
              main
            </Link>
          </>
        )}
      </LinkBar>

      {/* Code Viewer */}
      <PanelBody>
        <JsonArea>
          {view === "schema" && jsonSchema && (
            <SyntaxHighlighter
              language="json"
              style={darkMode ? oneDark : oneLight}
              customStyle={{
                ...codeBase,
                background: darkMode ? "#1e1e1e" : "#f5f5f5",
              }}
              wrapLongLines
              showLineNumbers
              lineNumberStyle={gutter(darkMode) as React.CSSProperties}
            >
              {jsonSchema}
            </SyntaxHighlighter>
          )}

          {view.startsWith("helper") && (
            <SyntaxHighlighter
              language="python"
              style={darkMode ? oneDark : oneLight}
              customStyle={{
                ...codeBase,
                background: darkMode ? "#1e1e1e" : "#f5f5f5",
              }}
              wrapLongLines
              showLineNumbers
              lineNumberStyle={gutter(darkMode) as React.CSSProperties}
            >
              {blob}
            </SyntaxHighlighter>
          )}
        </JsonArea>
      </PanelBody>

      {/* Error Toast */}
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

      {/* Legal Dialog */}
      <LegalDownloadDialog
        open={dlgOpen}
        showCheckbox={showCheckbox}
        onAccept={handleAccept}
        onCancel={() => setDlgOpen(false)}
      />
    </PanelRoot>
  );
};

export default GeneratedSchemaPanel;
