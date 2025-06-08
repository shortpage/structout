/* ------------------------------------------------------------------
 * MIT License © 2025 Sesh Ragavachari
 * ------------------------------------------------------------------
 * File   : Workbench.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-04
 * Version: 1.7.3 (example references pruned)
 * ------------------------------------------------------------------ */

import React, { useRef, useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import SchemaDesigner, {
  SchemaDesignerHandle,
  ProviderId,
} from "./SchemaDesigner";
import GeneratedSchemaPanel from "./GeneratedSchemaPanel";
import LabelSidebar from "./components/LabelSidebar";
import SectionHeader from "./components/SectionHeader";
import LegalLinks from "./components/LegalLinks";
import { loadProviderConfig } from "./utils/loadProviderConfig";
import { EXAMPLES } from "./lib/exampleLoader";

import {
  Root,
  BrandWrap,
  BrandName,
  TagLine,
  Frame,
  ExplorerCol,
  DesignerCol,
  SchemaCol,
  ScrollArea,
} from "./style/AppLayout";

/* ─────────────────────────────────────────────────────────────── */
const theme = createTheme({
  palette: { mode: "light" },
  typography: { fontFamily: "Roboto, Helvetica, Arial, sans-serif" },
});

const SHOW_HEADER_LINKS = true;
const SHOW_FOOTER_LINKS = false;

/* =============================================================== */
const Workbench: React.FC = () => {
  /* state */
  const [providerId, setProviderId] = useState<ProviderId>("openai");
  const [headerRule, setHeaderRule] = useState("[]");
  const [jsonSchema, setJsonSchema] = useState("");
  const [schemaId, setSchemaId] = useState<string>(""); // ← NEW
  const [errToast, setErrToast] = useState<string>();

  const designerRef = useRef<SchemaDesignerHandle>(null);

  /* ------------------------------------------------------------------ */
  /* Load a template chosen in the sidebar                              */
  /*  –  "example:foo"  ➜ built-in example stored in EXAMPLES           */
  /*  –  "foo"          ➜ user-saved template in localStorage           */
  /* ------------------------------------------------------------------ */
  const handleSelectTemplate = (tplId: string) => {
    /* ─────── Examples ─────────────────────────────────────────── */
    if (tplId.startsWith("example:")) {
      const exId = tplId.slice("example:".length);
      const payload = EXAMPLES[exId];

      if (!payload) {
        console.error("Missing example:", exId);
        setErrToast("Example schema not found.");
        return;
      }

      designerRef.current?.setSchemaState(payload);
      setSchemaId(exId); // store bare ID, not the "example:" prefix
      return;
    }

    /* ─────── User-saved templates ─────────────────────────────── */
    const raw = localStorage.getItem(`schema_metadata_${tplId}`);
    if (!raw) {
      console.error("Saved schema not found:", tplId);
      setErrToast("Saved schema not found.");
      return;
    }

    try {
      designerRef.current?.setSchemaState(JSON.parse(raw));
      setSchemaId(tplId);
    } catch (e) {
      console.error("Corrupt schema JSON:", e);
      setErrToast("Failed to load saved schema.");
    }
  };

  /* provider change (async) ------------------------------------- */
  const loadProvider = async (id: ProviderId) => {
    try {
      const cfg = await loadProviderConfig(id);
      setProviderId(id);
      setHeaderRule(cfg.llmSchemaHeader ?? "[]");
    } catch {
      console.error("Provider JSON failed to load");
      setHeaderRule("[]");
      setErrToast("Provider configuration failed to load.");
    }
  };
  const handleProviderChange = (id: ProviderId) => {
    void loadProvider(id);
  };
  useEffect(() => {
    void loadProvider(providerId);
  }, []); // eslint-disable-line

  /* render ------------------------------------------------------- */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root>
        {/* header -------------------------------------------------- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <BrandWrap>
            <BrandName>
              Struct<span>Out</span>
            </BrandName>
            <TagLine>Structured Output Designer for LLM APIs</TagLine>
          </BrandWrap>
          {SHOW_HEADER_LINKS && <LegalLinks />}
        </div>

        {/* workspace ---------------------------------------------- */}
        <Frame>
          {/* Explorer */}
          <ExplorerCol>
            <SectionHeader title="Explorer" />
            <ScrollArea>
              <LabelSidebar onSelectTemplate={handleSelectTemplate} />
            </ScrollArea>
          </ExplorerCol>

          {/* Designer */}
          <DesignerCol>
            <ScrollArea style={{ padding: "0 16px 16px" }}>
              <SchemaDesigner
                ref={designerRef}
                headerRule={headerRule}
                onJsonSchemaGenerated={setJsonSchema}
              />
            </ScrollArea>
          </DesignerCol>

          {/* Generated Schema */}
          <SchemaCol>
            <GeneratedSchemaPanel
              jsonSchema={jsonSchema}
              llmProvider={providerId}
              onProviderChange={handleProviderChange}
              schemaId={schemaId}
            />
          </SchemaCol>
        </Frame>

        {/* footer & snackbar remain unchanged … */}
        {SHOW_FOOTER_LINKS && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "8px 24px",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <LegalLinks />
          </div>
        )}

        <Snackbar
          open={!!errToast}
          autoHideDuration={4000}
          onClose={() => setErrToast(undefined)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setErrToast(undefined)}
            sx={{ width: "100%" }}
          >
            {errToast}
          </Alert>
        </Snackbar>
      </Root>
    </ThemeProvider>
  );
};

export default Workbench;
