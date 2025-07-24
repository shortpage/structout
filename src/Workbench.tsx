/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * File   : Workbench.tsx
 * Author : Sesh Ragavachari
 * Version: 2.4.3 – Seamless provider switching
 * ------------------------------------------------------------------ */

import React, { useRef, useState, useEffect } from "react";
import { DEMO_READ_ONLY, SHOW_TOUR } from "./lib/constants";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import Fab from "@mui/material/Fab";
import { styled } from "@mui/material";

import BadgeLinks from "./components/BadgeLinks";
import SchemaDesigner, {
  SchemaDesignerHandle,
  ProviderId,
} from "./SchemaDesigner";
import GeneratedSchemaPanel from "./GeneratedSchemaPanel";
import SettingsSheet from "./components/SettingsSheet";
import LabelSidebar from "./components/LabelSidebar";
import SectionHeader from "./components/SectionHeader";
import LegalLinks from "./components/LegalLinks";
import { loadProviderConfig } from "./utils/loadProviderConfig";
import { EXAMPLES } from "./lib/exampleLoader";
import DemoTour from "./components/DemoTour";
import DemoBanner from "./components/DemoBanner";
import { copyToClipboard } from "./utils/mobileUtils";
import { buildZipBundle } from "./utils/bundleHelpers";
import { ModelKey, PROVIDER_META } from "./utils/providerRegistry";

/* --- styled layout helpers ------------------------------------- */
import {
  Root,
  Header,
  HeaderLeft,
  HeaderCenter,
  HeaderRight,
  BrandWrap,
  BrandName,
  TagLine,
  Frame,
  DesktopColumns,
  ExplorerCol,
  DesignerCol,
  SchemaCol,
  ScrollArea,
  DrawerOverlay,
  DrawerContent,
  MobileMenuButton,
  BottomTabBar,
  TabButton,
} from "./style/AppLayout";

const WorkbenchBody = styled("div")({
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  paddingBottom: "72px", // tab bar height
});

const FabWrap = styled("div")({
  position: "fixed",
  bottom: "calc(env(safe-area-inset-bottom) + 72px)",
  right: 16,
  zIndex: 1200,
});

/* --- simple viewport hook -------------------------------------- */
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return { isMobile };
};

/* --- MUI theme tweaks (bigger touch targets on mobile) ---------- */
const theme = createTheme({
  palette: { mode: "light" },
  typography: {
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontSize: 14,
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 44 } } },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
  },
});

type MobileTab = "explorer" | "designer" | "schema";

/* =============================================================== */
const Workbench: React.FC = () => {
  /* ---------- state ---------- */
  const [providerId, setProviderId] = useState<ProviderId>("openai");
  const [modelKey, setModelKey] = useState<ModelKey>(
    PROVIDER_META.openai.defaultModel,
  );
  const [headerRule, setHeaderRule] = useState("[]");
  const [jsonSchema, setJsonSchema] = useState("{}");
  const [schemaId, setSchemaId] = useState("");
  const [errToast, setErrToast] = useState<string>();
  const [successToast, setSuccessToast] = useState<string>();

  const [activeTab, setActiveTab] = useState<MobileTab>("designer");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { isMobile } = useResponsive();
  const designerRef = useRef<SchemaDesignerHandle>(null);

  /* ---------- provider / model loaders ---------- */
  const applyProvider = async (id: ProviderId) => {
    try {
      const cfg = await loadProviderConfig(id);
      setProviderId(id);
      setModelKey(PROVIDER_META[id].defaultModel);
      setHeaderRule(cfg.llmSchemaHeader ?? "[]");
    } catch {
      setHeaderRule("[]");
      setErrToast("Provider configuration failed to load.");
    }
  };

  /* run once on mount so we have initial headerRule */
  useEffect(() => {
    void applyProvider(providerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- template loader ---------- */
  const loadTemplate = (id: string) => {
    const forward = () => {
      if (isMobile) {
        setActiveTab("designer");
        setDrawerOpen(false);
      }
    };

    if (id.startsWith("example:")) {
      const ex = EXAMPLES[id.slice("example:".length)];
      if (!ex) return setErrToast("Example schema not found.");
      designerRef.current?.setSchemaState(ex);
      setSchemaId(id);
      forward();
      return;
    }

    try {
      const raw = localStorage.getItem(`schema_metadata_${id}`);
      if (!raw) throw new Error("not found");
      designerRef.current?.setSchemaState(JSON.parse(raw));
      setSchemaId(id);
      forward();
    } catch {
      setErrToast("Failed to load saved schema.");
    }
  };

  /* ---------- copy / download helpers ---------- */
  const handleCopy = async () => {
    if (!jsonSchema || jsonSchema === "{}") return setErrToast("No schema");
    const ok = await copyToClipboard(jsonSchema);
    if (ok) {
      setSuccessToast("Copied!");
    } else {
      setErrToast("Copy blocked by browser");
    }
  };

  const handleDownload = async () => {
    if (!jsonSchema || jsonSchema === "{}") return setErrToast("No schema");
    try {
      const { blob } = await buildZipBundle(jsonSchema, providerId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${schemaId || "schema"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setSheetOpen(false);
    } catch (e) {
      console.error(e);
      setErrToast("ZIP generation failed");
    }
  };

  /* ---------- helpers ---------- */
  const getTabLabel = (t: MobileTab) => {
    if (t === "schema") {
      return jsonSchema && jsonSchema !== "{}" ? "Schema ✓" : "Schema";
    }
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  /* ---------- mobile renderer (always mounted designer) ---------- */
  const renderMobile = () => {
    return (
      <>
        {/* Always render SchemaDesigner but hide it when not active */}
        <div
          style={{
            display: activeTab === "designer" ? "block" : "none",
            height: "100%",
          }}
        >
          <ScrollArea style={{ padding: "0 8px 8px" }}>
            <SchemaDesigner
              ref={designerRef}
              headerRule={headerRule}
              onJsonSchemaGenerated={setJsonSchema}
              readOnly={DEMO_READ_ONLY}
              providerId={providerId}
              modelKey={modelKey}
            />
          </ScrollArea>
        </div>

        {/* Explorer */}
        {activeTab === "explorer" && (
          <ScrollArea>
            <div style={{ padding: 16 }}>
              <SectionHeader title="Explorer" />
              <LabelSidebar onSelectTemplate={loadTemplate} />
            </div>
          </ScrollArea>
        )}

        {/* Schema */}
        {activeTab === "schema" && (
          <GeneratedSchemaPanel
            key={`schema-${providerId}-${modelKey}`}
            jsonSchema={jsonSchema}
            llmProvider={providerId}
            modelKey={modelKey}
            onProviderChange={applyProvider}
            onModelChange={setModelKey}
            schemaId={schemaId}
          />
        )}
      </>
    );
  };

  /* ---------- render ---------- */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root>
        {/* ------- header ------------------------------------------------ */}
        <Header>
          <HeaderLeft>
            {isMobile && (
              <MobileMenuButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </MobileMenuButton>
            )}
            <BrandWrap>
              <BrandName>
                Struct<span>Out</span>
              </BrandName>
              <TagLine>
                {isMobile
                  ? "LLM Output Designer"
                  : "Structured Output Designer for LLM APIs"}
              </TagLine>
            </BrandWrap>
          </HeaderLeft>
          <HeaderCenter>{DEMO_READ_ONLY && <DemoBanner />}</HeaderCenter>
          <HeaderRight>
            <LegalLinks />
            <BadgeLinks />
          </HeaderRight>
        </Header>

        {/* ------- main frame ------------------------------------------- */}
        <Frame>
          {isMobile ? (
            /* ===== Mobile layout ===== */
            <>
              <WorkbenchBody>{renderMobile()}</WorkbenchBody>

              {/* FAB */}
              <FabWrap>
                <Fab color="primary" onClick={() => setSheetOpen(true)}>
                  <SettingsIcon />
                </Fab>
              </FabWrap>

              {/* Tab bar */}
              <BottomTabBar>
                {(["explorer", "designer", "schema"] as MobileTab[]).map(
                  (t) => (
                    <TabButton
                      key={t}
                      active={activeTab === t}
                      onClick={() => setActiveTab(t)}
                    >
                      {getTabLabel(t)}
                    </TabButton>
                  ),
                )}
              </BottomTabBar>

              {/* Explorer drawer */}
              <DrawerOverlay
                open={drawerOpen}
                onClick={() => setDrawerOpen(false)}
              />
              <DrawerContent open={drawerOpen}>
                <div style={{ padding: 16 }}>
                  <SectionHeader title="Explorer" />
                  <LabelSidebar onSelectTemplate={loadTemplate} />
                </div>
              </DrawerContent>

              {/* Settings sheet */}
              <SettingsSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                onOpen={() => {}}
                isMobile
                llmProvider={providerId}
                modelKey={modelKey}
                onProviderChange={applyProvider}
                onModelChange={setModelKey}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onToggleDark={() => {}}
                canCopy={!!jsonSchema && jsonSchema !== "{}"}
                canDownload={!!jsonSchema && jsonSchema !== "{}"}
                jsonSchema={jsonSchema}
              />
            </>
          ) : (
            /* ===== Desktop layout ===== */
            <DesktopColumns>
              <ExplorerCol>
                <SectionHeader title="Explorer" />
                <ScrollArea>
                  <LabelSidebar onSelectTemplate={loadTemplate} />
                </ScrollArea>
              </ExplorerCol>

              <DesignerCol>
                <ScrollArea style={{ padding: "0 16px 16px" }}>
                  <SchemaDesigner
                    ref={designerRef}
                    headerRule={headerRule}
                    onJsonSchemaGenerated={setJsonSchema}
                    readOnly={DEMO_READ_ONLY}
                    providerId={providerId}
                    modelKey={modelKey}
                  />
                </ScrollArea>
              </DesignerCol>

              <SchemaCol>
                <GeneratedSchemaPanel
                  key={`schema-${providerId}-${modelKey}`}
                  jsonSchema={jsonSchema}
                  llmProvider={providerId}
                  modelKey={modelKey}
                  onProviderChange={applyProvider}
                  onModelChange={setModelKey}
                  schemaId={schemaId}
                />
              </SchemaCol>
            </DesktopColumns>
          )}

          {!isMobile && DEMO_READ_ONLY && SHOW_TOUR && <DemoTour />}
        </Frame>

        {/* ------- snackbars ------------------------------------------- */}
        <Snackbar
          open={!!errToast}
          autoHideDuration={4000}
          onClose={() => setErrToast(undefined)}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setErrToast(undefined)}
          >
            {errToast}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!successToast}
          autoHideDuration={2000}
          onClose={() => setSuccessToast(undefined)}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSuccessToast(undefined)}
          >
            {successToast}
          </Alert>
        </Snackbar>
      </Root>
    </ThemeProvider>
  );
};

export default Workbench;
