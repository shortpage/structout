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
 *
 * File   : SchemaDesigner.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 * Interactive middle pane of the StructOut workbench. Users edit
 * a nested field structure, set metadata, and save / delete schemas
 * stored in browser LocalStorage. A live JSON-Schema string is
 * regenerated on every change and sent upward via
 * onJsonSchemaGenerated().
 *
 *   Central authoring surface for field definitions. Converts the
 *  user's table edits into a valid draft‑07 JSON Schema and streams
 *  the string upward via `onJsonSchemaGenerated()`.
 *
 *  Data model
 *    • `fields`        – Flat array of `SchemaField` objects.
 *      A flat list avoids deep tree diffing; nesting is derived
 *      from the `parentId` property when needed.
 *    • `historyRef`    – Simple bounded stack to support undo/redo.
 *
 *  Persistence
 *    • Drafts are written to LocalStorage under
 *      `structout:schema:{providerId}:{schemaName}`.
 *    • A `storage` event is fired so other tabs update reactively.
 * -------------------------------------------------------------- */

import React, {
  forwardRef,
  useState,
  useEffect,
  useImperativeHandle,
  useDeferredValue,
  startTransition,
} from "react";
import Box from "@mui/material/Box";
import {
  TextField,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import FieldEditor from "./components/FieldEditor";
import jsonSchemaGenerator from "./components/jsonSchemaGenerator";
import SectionHeader from "./components/SectionHeader";
import {
  Root,
  HeaderRow,
  WorkRow,
  EditorCol,
  GAP,
} from "./style/SchemaDesignerLayout";

/* ---------- theme local to the designer pane ------------------- */
const muiTheme = createTheme({
  palette: { mode: "light" },
  typography: { fontSize: 14 },
});

/* ---------- shared types --------------------------------------- */
export type ProviderId =
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "llama"
  | "grok"
  | "perplexity";

export interface SchemaField {
  id: string;
  parentId: string | null;
  parentKey: string | null;
  key: string;
  type: string;
  level: number;
  aiPrompt: string;
  required: boolean;
  locked: boolean;
  dropdownType: "none" | "static" | "dynamic";
  editPermission: "fullPermission" | "readOnly";
  excludefromRagDefinition: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isRetrievable: boolean;
  isSortable: boolean;
  isFacetable: boolean;
  isKey: boolean;
}

/* ---------- imperative handle exposed to Workbench ------------- */
export interface SchemaDesignerHandle {
  setSchemaState: (o: unknown) => void;
}

interface Props {
  /** Provider-specific header snippet supplied by Workbench. */
  headerRule: string;
  /** Emits freshly generated JSON Schema. */
  onJsonSchemaGenerated: (s: string) => void;
}

/* ============================================================== */
/* header bar component (unchanged) ------------------------------ */
interface HeaderBarProps {
  metaName: string;
  metaDesc: string;
  onMetaName: (v: string) => void;
  onMetaDesc: (v: string) => void;
  canSave: boolean;
  saved: boolean;
  onSave: () => void;
  hasSaved: boolean;
  onDelete: () => void;
  onNew: () => void;
}
const HeaderBar: React.FC<HeaderBarProps> = ({
  metaName,
  metaDesc,
  onMetaName,
  onMetaDesc,
  canSave,
  saved,
  onSave,
  hasSaved,
  onDelete,
  onNew,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-end",
      gap: 1.5,
      mb: 2,
      flexWrap: "wrap",
    }}
  >
    <TextField
      variant="standard"
      label="ID"
      sx={{ minWidth: 180 }}
      value={metaName}
      onChange={(e) => onMetaName(e.target.value)}
    />
    <TextField
      variant="standard"
      label="Description"
      sx={{ flex: 1, minWidth: 240, "& input": { fontSize: 13 } }}
      value={metaDesc}
      onChange={(e) => onMetaDesc(e.target.value)}
    />

    <Tooltip title="New blank schema">
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddCircleOutlineIcon fontSize="small" />}
        sx={{ textTransform: "none", fontSize: 13 }}
        onClick={onNew}
      >
        New
      </Button>
    </Tooltip>

    <Tooltip title={canSave ? "Save" : "Nothing to save"}>
      <span>
        <Button
          size="small"
          startIcon={<SaveIcon fontSize="small" />}
          endIcon={
            saved ? (
              <CheckCircleIcon color="success" sx={{ fontSize: 16 }} />
            ) : null
          }
          sx={{ textTransform: "none", fontSize: 13, minWidth: 84 }}
          disabled={!canSave}
          onClick={onSave}
        >
          {saved ? "Saved" : "Save"}
        </Button>
      </span>
    </Tooltip>

    <Tooltip title={hasSaved ? "Delete saved schema" : "Nothing to delete"}>
      <span>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon fontSize="small" />}
          sx={{ textTransform: "none", fontSize: 13, minWidth: 84 }}
          disabled={!hasSaved}
          onClick={onDelete}
        >
          Delete
        </Button>
      </span>
    </Tooltip>
  </Box>
);

/* field table wrapper (unchanged) ------------------------------- */
const FieldTable: React.FC<{
  fields: SchemaField[];
  onChangeFields: (f: SchemaField[]) => void;
  metaName: string;
  metaDesc: string;
}> = ({ fields, onChangeFields, metaName, metaDesc }) => (
  <Box sx={{ flex: 1, overflow: "auto" }}>
    <FieldEditor
      fields={fields}
      onChangeFields={onChangeFields}
      rootRowAllowed
      actualViewMode="Structure"
      metadataName={metaName}
      metadataDesc={metaDesc}
    />
  </Box>
);

/* ============================================================== */
// eslint-disable-next-line react/display-name
const SchemaDesigner = forwardRef<SchemaDesignerHandle, Props>(
  ({ headerRule, onJsonSchemaGenerated }, ref) => {
    /* ---------------- state ----------------------------------- */
    const [fields, setFields] = useState<SchemaField[]>([]);
    const [metaName, setMetaName] = useState("");
    const [metaDesc, setMetaDesc] = useState("");
    const [saved, setSaved] = useState(false);
    const [confirm, setConfirm] = useState(false);

    /* ---------- imperative setter (eslint-clean) ------------------- */

    /** legacy import format */
    type LegacyHeader = { schemaId?: string; description?: string };

    /** union of both shapes we accept from localStorage / import */
    interface LocalSchemaState {
      metadataName?: string;
      metadataDescription?: string;
      header?: LegacyHeader;
      fields: SchemaField[];
    }

    /* type-guard: is it a LocalSchemaState with a real `fields` array? */
    const isLocalSchemaState = (o: unknown): o is LocalSchemaState =>
      typeof o === "object" &&
      o !== null &&
      Array.isArray((o as { fields?: unknown }).fields);

    useImperativeHandle(ref, () => ({
      setSchemaState(input: unknown) {
        if (!isLocalSchemaState(input)) return; // bail out early

        /* 1️⃣  load the field array */
        const {
          fields: fld,
          metadataName,
          metadataDescription,
          header,
        } = input;
        setFields(fld);

        /* 2️⃣  populate ID + Description from whichever keys exist */
        setMetaName(metadataName ?? header?.schemaId ?? "");
        setMetaDesc(metadataDescription ?? header?.description ?? "");
      },
    }));

    /* ---------- derived flags & keys -------------------------- */
    const keyLocal = `schema_metadata_${metaName.trim()}`;
    const hasSaved = (() => {
      try {
        return !!localStorage.getItem(keyLocal);
      } catch {
        return false;
      }
    })();
    const canSave = metaName.trim() && fields.length;

    /* ---------- deferred JSON generation ---------------------- */
    const dFields = useDeferredValue(fields);
    const dHeaderRule = useDeferredValue(headerRule);
    const dMetaName = useDeferredValue(metaName);
    const dMetaDesc = useDeferredValue(metaDesc);

    useEffect(() => {
      if (!dMetaName.trim()) {
        onJsonSchemaGenerated("");
        return;
      }
      onJsonSchemaGenerated(
        JSON.stringify(
          jsonSchemaGenerator(
            dFields,
            dMetaName.trim(),
            dMetaDesc.trim(),
            dHeaderRule,
          ),
          null,
          2,
        ),
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dFields, dMetaName, dMetaDesc, dHeaderRule]);

    /* ---------- helpers: save / delete ------------------------ */
    const fireStorageEvent = (
      key: string,
      oldVal: string | null,
      newVal: string | null,
    ) => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          oldValue: oldVal,
          newValue: newVal,
          storageArea: localStorage,
        }),
      );
    };

    const doSave = () => {
      if (!canSave) return;
      try {
        const payload = JSON.stringify({
          metadataName: metaName.trim(),
          metadataDescription: metaDesc.trim(),
          fields,
          folderCategory: "saved",
        });
        localStorage.setItem(keyLocal, payload);
        fireStorageEvent(keyLocal, null, payload);
        startTransition(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        });
      } catch (e) {
        console.error("localStorage error", e);
      }
    };

    const newSchema = () => {
      setFields([]);
      setMetaName("");
      setMetaDesc("");
      setSaved(false);
      onJsonSchemaGenerated("");
    };

    const confirmDelete = () => {
      try {
        localStorage.removeItem(keyLocal);
      } catch (e) {
        console.error("localStorage error", e);
      }
      fireStorageEvent(keyLocal, null, null);
      newSchema();
      setConfirm(false);
    };

    /* --------------------------- render ----------------------- */
    return (
      <ThemeProvider theme={muiTheme}>
        <Root>
          {/* header */}
          <HeaderRow>
            <SectionHeader title="Designer" />
          </HeaderRow>

          {/* body */}
          <WorkRow>
            <Box sx={{ p: `0 ${GAP}px ${GAP}px` }}>
              <EditorCol>
                <HeaderBar
                  metaName={metaName}
                  metaDesc={metaDesc}
                  onMetaName={setMetaName}
                  onMetaDesc={setMetaDesc}
                  canSave={!!canSave}
                  saved={saved}
                  onSave={doSave}
                  hasSaved={hasSaved}
                  onDelete={() => setConfirm(true)}
                  onNew={newSchema}
                />

                <FieldTable
                  fields={fields}
                  onChangeFields={setFields}
                  metaName={metaName}
                  metaDesc={metaDesc}
                />
              </EditorCol>
            </Box>
          </WorkRow>

          {/* delete confirmation dialog */}
          <Dialog open={confirm} onClose={() => setConfirm(false)}>
            <DialogTitle>Delete schema?</DialogTitle>
            <DialogContent dividers>
              <Typography>
                Permanently remove&nbsp;
                <strong>{metaName || "(unnamed)"}</strong> from browser storage?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirm(false)}>Cancel</Button>
              <Button color="error" variant="contained" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Root>
      </ThemeProvider>
    );
  },
);

export default SchemaDesigner;
