/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
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
 *
 * File   : Workbench.tsx (Mobile-Responsive Version)
 * Author : Sesh Ragavachari
 * Date   : 2025-07-24
 * Version: 2.0 - Mobile Support Added
 *
 * Mobile-first responsive layout:
 * • Mobile: Tab-based navigation with drawer
 * • Desktop: Original 3-column layout
 * -------------------------------------------------------------- */

import React, { useRef, useState, useEffect } from "react";
import { DEMO_READ_ONLY, SHOW_TOUR } from "./lib/constants";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import BadgeLinks from "./components/BadgeLinks";
import MenuIcon from "@mui/icons-material/Menu";

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
  Header,
  HeaderLeft,
  HeaderCenter,
  HeaderRight,
  BrandWrap,
  BrandName,
  TagLine,
  Frame,
  TabNavigation,
  TabButton,
  MobileContent,
  DesktopColumns,
  ExplorerCol,
  DesignerCol,
  SchemaCol,
  ScrollArea,
  DrawerOverlay,
  DrawerContent,
  MobileMenuButton,
} from "./style/AppLayout";

/* ------------------------------------------------------------------ */
/* Mobile tab types                                                   */
/* ------------------------------------------------------------------ */
type MobileTab = "explorer" | "designer" | "schema";

/* ------------------------------------------------------------------ */
/* Responsive detection hook                                          */
/* ------------------------------------------------------------------ */
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile };
};

/* ------------------------------------------------------------------ */
/* Mobile-optimized theme                                            */
/* ------------------------------------------------------------------ */
const theme = createTheme({
  palette: { mode: "light" },
  typography: {
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    fontSize: 14,
  },
  components: {
    // Prevent iOS zoom on input focus
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            fontSize: "16px",
          },
        },
      },
    },
    // Touch-friendly buttons
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: "44px",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: "44px",
          minHeight: "44px",
        },
      },
    },
  },
});

const SHOW_HEADER_LINKS = true;
const SHOW_FOOTER_LINKS = false;

/* =============================================================== */
const Workbench: React.FC = () => {
  /* Original state */
  const [providerId, setProviderId] = useState<ProviderId>("openai");
  const [headerRule, setHeaderRule] = useState("[]");
  const [jsonSchema, setJsonSchema] = useState("");
  const [schemaId, setSchemaId] = useState<string>("");
  const [errToast, setErrToast] = useState<string>();

  /* Mobile-specific state */
  const [activeTab, setActiveTab] = useState<MobileTab>("designer");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isMobile } = useResponsive();
  const designerRef = useRef<SchemaDesignerHandle>(null);

  /* ------------------------------------------------------------------ */
  /* Template loading with mobile navigation                            */
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

      // Auto-navigate to designer on mobile
      if (isMobile) {
        setActiveTab("designer");
        setDrawerOpen(false);
      }
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

      // Auto-navigate to designer on mobile
      if (isMobile) {
        setActiveTab("designer");
        setDrawerOpen(false);
      }
    } catch (e) {
      console.error("Corrupt schema JSON:", e);
      setErrToast("Failed to load saved schema.");
    }
  };

  /* Provider loading (unchanged) */
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

  /* ------------------------------------------------------------------ */
  /* Mobile tab content rendering                                       */
  /* ------------------------------------------------------------------ */
  const renderMobileContent = () => {
    switch (activeTab) {
      case "explorer":
        return (
          <ScrollArea>
            <div style={{ padding: "16px 0" }}>
              <SectionHeader title="Explorer" />
              <LabelSidebar onSelectTemplate={handleSelectTemplate} />
            </div>
          </ScrollArea>
        );

      case "designer":
        return (
          <ScrollArea style={{ padding: "0 8px 8px" }}>
            <SchemaDesigner
              ref={designerRef}
              headerRule={headerRule}
              onJsonSchemaGenerated={setJsonSchema}
              readOnly={DEMO_READ_ONLY}
            />
          </ScrollArea>
        );

      case "schema":
        return (
          <GeneratedSchemaPanel
            jsonSchema={jsonSchema}
            llmProvider={providerId}
            onProviderChange={handleProviderChange}
            schemaId={schemaId}
          />
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Tab labels with status indicators                                  */
  /* ------------------------------------------------------------------ */
  const getTabLabel = (tab: MobileTab): string => {
    switch (tab) {
      case "explorer":
        return "Explorer";
      case "designer":
        return "Designer";
      case "schema":
        return jsonSchema ? "Schema ✓" : "Schema";
      default:
        return "";
    }
  };

  /* ------------------------------------------------------------------ */
  /* Handle drawer close on overlay click                              */
  /* ------------------------------------------------------------------ */
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Root>
        {/* ─────── Responsive Header ───────────────────────────────── */}
        <Header>
          <HeaderLeft>
            {isMobile && (
              <MobileMenuButton
                onClick={() => setDrawerOpen(true)}
                aria-label="Open explorer menu"
              >
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
            {SHOW_HEADER_LINKS && <LegalLinks />}
            <BadgeLinks />
          </HeaderRight>
        </Header>

        {/* ─────── Mobile vs Desktop Layout ──────────────────────── */}
        <Frame>
          {isMobile ? (
            <>
              {/* Mobile Tab Navigation */}
              <TabNavigation>
                {(["explorer", "designer", "schema"] as MobileTab[]).map(
                  (tab) => (
                    <TabButton
                      key={tab}
                      active={activeTab === tab}
                      onClick={() => setActiveTab(tab)}
                    >
                      {getTabLabel(tab)}
                    </TabButton>
                  ),
                )}
              </TabNavigation>

              {/* Mobile Content */}
              <MobileContent>{renderMobileContent()}</MobileContent>

              {/* Mobile Drawer for Explorer */}
              <DrawerOverlay open={drawerOpen} onClick={handleDrawerClose} />
              <DrawerContent open={drawerOpen}>
                <div style={{ padding: "16px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0 16px 16px",
                      borderBottom: "1px solid #e0e0e0",
                      marginBottom: "16px",
                    }}
                  >
                    <SectionHeader title="Explorer" />
                    <button
                      onClick={handleDrawerClose}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        padding: "4px",
                        lineHeight: 1,
                      }}
                      aria-label="Close menu"
                    >
                      ×
                    </button>
                  </div>
                  <LabelSidebar onSelectTemplate={handleSelectTemplate} />
                </div>
              </DrawerContent>
            </>
          ) : (
            /* Desktop Three-Column Layout */
            <DesktopColumns>
              <ExplorerCol>
                <SectionHeader title="Explorer" />
                <ScrollArea>
                  <LabelSidebar onSelectTemplate={handleSelectTemplate} />
                </ScrollArea>
              </ExplorerCol>

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

              <SchemaCol>
                <GeneratedSchemaPanel
                  jsonSchema={jsonSchema}
                  llmProvider={providerId}
                  onProviderChange={handleProviderChange}
                  schemaId={schemaId}
                />
              </SchemaCol>
            </DesktopColumns>
          )}

          {/* Tour component (desktop only) */}
          {!isMobile && DEMO_READ_ONLY && SHOW_TOUR && <DemoTour />}
        </Frame>

        {/* Footer (unchanged) */}
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

        {/* Error Toast */}
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
