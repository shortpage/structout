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
 *
 * File   : Workbench.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *   Layout
 *    ▸ Explorer column          (labels/examples)
 *    ▸ Designer column          (fields table & form)
 *    ▸ Schema column            (generated JSON + client snippet)
 *
 *   State lifetimes
 *    • providerId      – selected LLM provider (OpenAI, etc.)
 *    • headerRule      – provider‑specific header block
 *    • jsonSchema      – draft schema emitted by <SchemaDesigner/>
 *    • schemaId        – currently loaded LocalStorage key
 *
 *   Data flow
 *    User edits ► <SchemaDesigner/> updates ► jsonSchema ►
 *    <GeneratedSchemaPanel/> which formats, previews, bundles, copies.
 *
 *  All heavy logic (history, validation, bundle building) lives in
 *  children; this component stitches them together and handles
 *  theming + snackbars.
 * -------------------------------------------------------------- */

import React, { useRef, useState, useEffect } from "react";
import { DEMO_READ_ONLY, SHOW_TOUR } from "./lib/constants";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import BadgeLinks from "./components/BadgeLinks";

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
import DemoTour from "./components/DemoTour";
import DemoBanner from "./components/DemoBanner";

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
  const [schemaId, setSchemaId] = useState<string>("");
  const [errToast, setErrToast] = useState<string>();

  const designerRef = useRef<SchemaDesignerHandle>(null);

  /* ------------------------------------------------------------------ */
  /* Load a template chosen in the sidebar                              */
  /*  –  "example:foo"  ➜ built-in example stored in EXAMPLES           */
  /*  –  "foo"          ➜ user-saved template in localStorage           */
  /* ------------------------------------------------------------------ */
  const handleSelectTemplate = (tplId: string) => {
    if (tplId.startsWith("example:")) {
      const exId = tplId.slice("example:".length);
      const payload = EXAMPLES[exId];

      if (!payload) {
        console.error("Missing example:", exId);
        setErrToast("Example schema not found.");
        return;
      }

      designerRef.current?.setSchemaState(payload);
      setSchemaId(exId);
      return;
    }

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
        {/* ─────── Header ───────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 24px",
            borderBottom: "1px solid #e5e7eb",
            flexWrap: "wrap",
            rowGap: "8px",
          }}
        >
          {/* 1️⃣  Logo + tagline (left) */}
          <BrandWrap style={{ flex: "0 0 auto" }}>
            <BrandName>
              Struct<span>Out</span>
            </BrandName>
            <TagLine>Structured Output Designer for LLM APIs</TagLine>
          </BrandWrap>

          {/* 2️⃣  Center slot — banner lives here */}
          <div
            style={{
              flex: "1 1 auto", // take all remaining width
              display: "flex",
              justifyContent: "center", // center horizontally
            }}
          >
            {DEMO_READ_ONLY && <DemoBanner />}
          </div>

          {/* 3️⃣  Links + shields (right) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
              flex: "0 0 auto",
            }}
          >
            {SHOW_HEADER_LINKS && <LegalLinks />}
            <BadgeLinks />
          </div>
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
                readOnly={DEMO_READ_ONLY}
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

          {/* Joyride tour appears only in the read‑only demo build */}
          {DEMO_READ_ONLY && SHOW_TOUR && <DemoTour />}
        </Frame>

        {/* footer & snackbar -------------------------------------- */}
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
