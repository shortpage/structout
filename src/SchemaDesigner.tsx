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
 * Date   : 2025-06-10
 * Version: 1.1  (🔄 rename-in-place logic)
 *
 * Interactive middle pane of the StructOut workbench. Users edit
 * a nested field structure, set metadata, and save / delete schemas
 * stored in browser LocalStorage. A live JSON-Schema string is
 * regenerated on every change and sent upward via
 * onJsonSchemaGenerated().
 *
 *  ➟ v1.1 adds in-place ID renaming: when the user alters the schema ID
 *   and clicks Save, the old localStorage entry is removed and replaced
 *   by the new one instead of creating a duplicate.
 * -------------------------------------------------------------- */

import React, {
  forwardRef,
  useState,
  useEffect,
  useImperativeHandle,
  useDeferredValue,
  startTransition,
  useRef, // 🔄 rename-in-place
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
import LocalSaveConfirmDialog from "./components/LocalSaveConfirmDialog";

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
import { toCamel } from "./utils/toCamel";
import { isLegalId } from "./utils/idValidator";

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
  readOnly?: boolean;
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
  readOnly: boolean;
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
  readOnly,
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
      id="meta-id"
      value={metaName}
      onChange={(e) => onMetaName(e.target.value)}
      disabled={readOnly}
    />
    <TextField
      variant="standard"
      label="Description"
      sx={{ flex: 1, minWidth: 240, "& input": { fontSize: 13 } }}
      id="meta-desc"
      value={metaDesc}
      onChange={(e) => onMetaDesc(e.target.value)}
      disabled={readOnly}
      slotProps={{
        // <-- new home for “inner-element” props
        htmlInput: {
          maxLength: 250, // 250-char clamp
        },
      }}
    />

    <Tooltip title="New blank schema">
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddCircleOutlineIcon fontSize="small" />}
        sx={{ textTransform: "none", fontSize: 13 }}
        onClick={onNew}
        disabled={readOnly}
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
  readOnly: boolean;
}> = ({ fields, onChangeFields, metaName, metaDesc,  readOnly }) => (
  <Box sx={{ flex: 1, overflow: "auto" }}>
    <FieldEditor
      fields={fields}
      onChangeFields={onChangeFields}
      rootRowAllowed
      actualViewMode="Structure"
      metadataName={metaName}
      metadataDesc={metaDesc}
      readOnly={readOnly}
    />
  </Box>
);

/* ============================================================== */
// eslint-disable-next-line react/display-name
const SchemaDesigner = forwardRef<SchemaDesignerHandle, Props>(
  ({ headerRule, onJsonSchemaGenerated, readOnly = false }, ref) => {
    /* ---------------- state ----------------------------------- */
    const [fields, setFields] = useState<SchemaField[]>([]);
    const [metaName, setMetaName] = useState("");
    const [metaDesc, setMetaDesc] = useState("");
    const [saved, setSaved] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [showLocalDlg, setShowLocalDlg] = useState(false);

    /* 🔄 remember last stored key for rename-in-place ------------ */
    const prevKeyRef = useRef<string | null>(null);

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

        /* 1️⃣ load the field array */
        const {
          fields: fld,
          metadataName,
          metadataDescription,
          header,
        } = input;
        setFields(fld);

        /* 2️⃣ populate ID + Description from whichever keys exist */
        const loadedName = metadataName ?? header?.schemaId ?? "";
        setMetaName(loadedName);
        setMetaDesc(metadataDescription ?? header?.description ?? "");

        /* 3️⃣ remember the corresponding storage key */
        prevKeyRef.current = `schema_metadata_${loadedName.trim()}`; // 🔄
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
      if (readOnly || !canSave) return;

      const newKey = `schema_metadata_${metaName.trim()}`; // 🔄
      const payload = JSON.stringify({
        metadataName: metaName.trim(),
        metadataDescription: metaDesc.trim(),
        fields,
        folderCategory: "saved",
      });

      try {
        /* 1️⃣ remove old key if ID changed --------------------- */
        if (prevKeyRef.current && prevKeyRef.current !== newKey) {
          localStorage.removeItem(prevKeyRef.current);
          fireStorageEvent(prevKeyRef.current, null, null);
        }

        /* 2️⃣ write new key ----------------------------------- */
        localStorage.setItem(newKey, payload);
        fireStorageEvent(newKey, null, payload);
        prevKeyRef.current = newKey; // 🔄

        /* 3️⃣ UX feedback ------------------------------------- */
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
      prevKeyRef.current = null; // 🔄
      onJsonSchemaGenerated("");
    };

    const confirmDelete = () => {
      if (readOnly) return;
      try {
        localStorage.removeItem(keyLocal);
      } catch (e) {
        console.error("localStorage error", e);
      }
      fireStorageEvent(keyLocal, null, null);
      newSchema();
      setConfirm(false);
    };

    const handleLocalConfirmed = () => {
      setShowLocalDlg(false);
      doSave();
    };

    const handleLocalCancelled = () => {
      setShowLocalDlg(false);
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
                  onMetaName={(v) => setMetaName(isLegalId(v) ? v : toCamel(v))}
                  onMetaDesc={setMetaDesc}
                  canSave={!readOnly && !!canSave}
                  saved={saved}
                  onSave={() => !readOnly && setShowLocalDlg(true)}
                  hasSaved={!readOnly && hasSaved}
                  onDelete={() => setConfirm(true)}
                  onNew={() => !readOnly && newSchema()}
                  readOnly={readOnly}
                />

                <FieldTable
                  fields={fields}
                  onChangeFields={setFields}
                  metaName={metaName}
                  metaDesc={metaDesc}
                  readOnly={readOnly}
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
          {/* local-storage warning dialog */}
          <LocalSaveConfirmDialog
            open={showLocalDlg}
            schemaName={metaName}
            onConfirm={handleLocalConfirmed}
            onCancel={handleLocalCancelled}
          />
        </Root>
      </ThemeProvider>
    );
  },
);

export default SchemaDesigner;
