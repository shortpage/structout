/* ------------------------------------------------------------------
 * MIT License  (header unchanged)
 * ------------------------------------------------------------------ */

import React, { useCallback, useEffect, useState } from "react";
import { Link, Snackbar, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
import { PROVIDER_META, ProviderId, ModelKey } from "./utils/providerRegistry";
import { buildZipBundle } from "./utils/bundleHelpers";
import { LegalDownloadDialog } from "./components/LegalDownloadDialog";
import { LEGAL_POPUP_EVERY_DOWNLOAD } from "./lib/constants";
import { useResponsive, copyToClipboard } from "./utils/mobileUtils";
import SchemaControls from "./components/SchemaControls";
import { Box } from "@mui/material";

/* ---------- view modes ---------- */
type ViewMode = "schema" | "helper:model" | "helper:main";

interface Props {
  jsonSchema: string;
  llmProvider: ProviderId;
  onProviderChange: (p: ProviderId) => void;
  modelKey: ModelKey;
  onModelChange: (m: ModelKey) => void;
  schemaId?: string;
}

/* ================  Component  ================ */
const GeneratedSchemaPanel: React.FC<Props> = ({
  jsonSchema,
  llmProvider,
  onProviderChange,
  modelKey, // Use this directly from props
  onModelChange,
  schemaId,
}) => {
  /* ---------- state ---------- */
  // REMOVED: const [modelKey, setModelKey] = useState<ModelKey>(...) - This was causing the issue
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>("schema");
  const [blob, setBlob] = useState("");
  const [, setHelpers] = useState<HelperFiles | null>(null);
  const [toast, setToast] = useState<string>();
  const [dlgOpen, setDlgOpen] = useState(false);

  const { isMobile } = useResponsive();
  const [darkMode, setDarkMode] = useState<boolean>(
    () =>
      (localStorage.getItem("schema_dark") ??
        (window.matchMedia?.("(prefers-color-scheme: dark)").matches
          ? "1"
          : "0")) === "1",
  );

  /* ---------- effects ---------- */
  useEffect(
    () => localStorage.setItem("schema_dark", darkMode ? "1" : "0"),
    [darkMode],
  );

  useEffect(() => {
    // REMOVED: setModelKey(PROVIDER_META[llmProvider].defaultModel);
    setView("schema");
    setBlob("");
  }, [llmProvider]);

  useEffect(() => {
    setHelpers(null);
    setView("schema");
    setBlob("");
  }, [jsonSchema]);

  useEffect(() => {
    if (!jsonSchema || !view.startsWith("helper")) return;
    const f = generateHelperFiles(jsonSchema, llmProvider, modelKey);
    setHelpers(f);
    setBlob(view === "helper:model" ? f.modelCode : f.mainCode);
  }, [modelKey, jsonSchema, llmProvider, view]);

  /* ---------- helper view toggles ---------- */
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

  /* ---------- misc helpers ---------- */
  const inHelperView = view.startsWith("helper");
  const safeModelKey: ModelKey =
    modelKey in PROVIDER_META[llmProvider].models
      ? modelKey
      : PROVIDER_META[llmProvider].defaultModel;

  /* ---------- copy / download ---------- */
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
    if (LEGAL_POPUP_EVERY_DOWNLOAD) return setDlgOpen(true);
    if (localStorage.getItem("structout.legalSkip") === "yes")
      void doDownload();
    else setDlgOpen(true);
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

  /* filename helper */
  const canonicalId = (): string => {
    if (schemaId?.trim()) return safe(schemaId.trim());
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

  /* ---------- render ---------- */
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

  return (
    <PanelRoot>
      <SectionHeader title="Generated Schema" />

      {/* desktop‑only control row */}
      {!isMobile && (
        <ProviderRow>
          <SchemaControls
            isMobile={false}
            inHelperView={inHelperView}
            view={view}
            llmProvider={llmProvider}
            modelKey={safeModelKey}
            onProviderChange={onProviderChange}
            onModelChange={onModelChange} // Use the prop handler directly
            onCopy={copy}
            onDownload={startDownload}
            onToggleDark={() => setDarkMode((d) => !d)}
            canCopy={isSchemaView ? !!jsonSchema : !!blob}
            canDownload={!!jsonSchema}
          />

          {copied && (
            <Box sx={{ ml: 1 }}>
              <StatusIndicator type="success">
                <CheckCircleIcon fontSize="small" />
                <ResponsiveText size="small">Copied</ResponsiveText>
              </StatusIndicator>
            </Box>
          )}
        </ProviderRow>
      )}

      {/* Navigation links */}
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
              onClick={() => showHelpers("main")}
            >
              main
            </Link>
          </>
        )}
      </LinkBar>

      {/* Code viewer */}
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

      {/* snackbars & dialogs */}
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

      <LegalDownloadDialog
        open={dlgOpen}
        showCheckbox={!LEGAL_POPUP_EVERY_DOWNLOAD}
        onAccept={handleAccept}
        onCancel={() => setDlgOpen(false)}
      />
    </PanelRoot>
  );
};

export default GeneratedSchemaPanel;
