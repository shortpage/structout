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
 * File   : FieldEditor.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *
 *  UX details
 *    • Row‑level actions (move, duplicate, delete) live in the
 *      right‑aligned icon column.
 *    • First row trash icon is disabled to prevents accidental loss
 *      of root object.
 *    • Double‑click or '✏️' opens a dialog with deep field options.
 *
 *  Validation
 *    • Utilises **leo‑profanity** to block offensive keys.
 *    • All edits propagate upward via `onChangeFields()`; this file
 *      holds no persistent state.
 * -------------------------------------------------------------- */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import {
  Box,
  Tooltip,
  IconButton,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  FaArrowUp,
  FaArrowDown,
  FaPlus,
  FaTrashAlt,
  FaLock,
  FaLockOpen,
} from "react-icons/fa";
import EditIcon from "@mui/icons-material/Edit";
import { v4 as uuidv4 } from "uuid";
import rawProfanity from "leo-profanity";

import styles from "../style/FieldEditor.module.css";
import { selectOptions, typeToIcon } from "../lib/constants";
import { SchemaField } from "../SchemaDesigner";
import { toCamel } from "../utils/toCamel";
import { isLegalId } from "../utils/idValidator";

/* ---------- profanity dictionary ---------------------------------- */
const leoProfanity: typeof rawProfanity = rawProfanity.default ?? rawProfanity;

leoProfanity.clearList();
leoProfanity.loadDictionary("en");
["metadata", "schema", "llm"].forEach((w) => leoProfanity.removeWord(w));

/* ---------- constants --------------------------------------------- */
const ICON_SIZE = 14;
const LEFT_COL = 60;
const RIGHT_COL = 80;
const INDENT_PER_LEVEL = 6;

/* Wide-net XSS regex */
const xssRegex =
  /<\s*script|javascript:|data:\s*text\/html|data:\s*text\/javascript/i;

const unsafe = (txt: string) =>
  (leoProfanity.isProfane?.(txt) ?? leoProfanity.check(txt)) ||
  xssRegex.test(txt);

/* ---------- props -------------------------------------------------- */
interface Props {
  fields: SchemaField[];
  onChangeFields: (updated: SchemaField[]) => void;
  rootRowAllowed: boolean;
  actualViewMode: string;
  metadataName: string;
  metadataDesc?: string;
  isReadOnlyMetadata?: boolean;
  readOnly?: boolean;
}

/* ================================================================ */
const FieldEditor: React.FC<Props> = ({
  fields,
  onChangeFields,
  rootRowAllowed,
  actualViewMode,
  metadataName,
  metadataDesc = "",
  readOnly = false,
}) => {
  /* validation flags for metadata ----------------------------------- */
  const [metaErr, setMetaErr] = useState(false);
  const [descErr, setDescErr] = useState(false);
  const [editErr, setEditErr] = useState("");

  /* edit-dialog state ---------------------------------------------- */
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState<number | null>(null);
  const [eKey, setEKey] = useState("");
  const [eType, setEType] = useState("string");
  const [ePrompt, setPrompt] = useState("");

  /* re-validate metadata whenever it changes ------------------------ */
  useEffect(() => {
    setMetaErr(unsafe(metadataName));
    setDescErr(unsafe(metadataDesc));
  }, [metadataName, metadataDesc]);

  /* -------- helper actions (add/move/del/lock) -------------------- */
  const canAddRoot =
    !!metadataName.trim() && !!metadataDesc.trim() && !metaErr && !descErr;

  const addRoot = useCallback(() => {
    if (readOnly || !rootRowAllowed || !canAddRoot) return;
    onChangeFields([
      ...fields,
      {
        id: uuidv4(),
        parentId: null,
        parentKey: null,
        level: 0,
        key: "",
        type: "object",
        aiPrompt: "",
        required: false,
        locked: true,
        dropdownType: "none",
        editPermission: "fullPermission",
        isSearchable: false,
        isFilterable: false,
        isRetrievable: true,
        isSortable: false,
        isFacetable: false,
        isKey: false,
        excludefromRagDefinition: false,
      },
    ]);
  }, [readOnly, canAddRoot, fields, onChangeFields, rootRowAllowed]);

  const addChild = useCallback(
    (i: number) => {
      if (readOnly) return;
      const p = fields[i];
      if (!p || p.locked) return;
      if (p.type !== "object" && p.type !== "array-object") return;

      const child: SchemaField = {
        id: uuidv4(),
        parentId: p.id,
        parentKey: p.key,
        level: p.level + 1,
        key: "",
        type: "string",
        aiPrompt: "",
        required: false,
        locked: false,
        dropdownType: "none",
        editPermission: "fullPermission",
        isSearchable: false,
        isFilterable: false,
        isRetrievable: true,
        isSortable: false,
        isFacetable: false,
        isKey: false,
        excludefromRagDefinition: false,
      };

      let at = fields.length;
      for (let j = i + 1; j < fields.length; j++) {
        if (fields[j].level <= p.level) {
          at = j;
          break;
        }
      }
      const arr = [...fields];
      arr.splice(at, 0, child);
      onChangeFields(arr);
    },
    [readOnly, fields, onChangeFields],
  );

  const delRow = useCallback(
    (i: number) => {
      // 🔒 demo-mode guard
      if (readOnly) return;
      // keep at least one row alive
      if (fields.length <= 1) return;
      onChangeFields(fields.filter((_, x) => x !== i));
    },
    [readOnly, fields, onChangeFields],
  );

  const moveUp = useCallback(
    (i: number) => {
      if (readOnly) return;
      if (i === 0) return;
      if (fields[i - 1].level !== fields[i].level) return;
      const a = [...fields];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      onChangeFields(a);
    },
    [readOnly, fields, onChangeFields],
  );

  const moveDn = useCallback(
    (i: number) => {
      if (readOnly) return;
      if (i >= fields.length - 1) return;
      if (fields[i + 1].level !== fields[i].level) return;
      const a = [...fields];
      [a[i], a[i + 1]] = [a[i + 1], a[i]];
      onChangeFields(a);
    },
    [readOnly, fields, onChangeFields],
  );

  const togLock = useCallback(
    (i: number) => {
      if (readOnly) return;
      const a = [...fields];
      a[i].locked = !a[i].locked;
      onChangeFields(a);
    },
    [readOnly, fields, onChangeFields],
  );

  /* ---------- column definitions (memoised) ----------------------- */
  const cols = useMemo<MRT_ColumnDef<SchemaField>[]>(
    () => [
      /* control column: move up/down ---------------------------------- */
      {
        id: "ctl",
        header: "",
        size: LEFT_COL,
        enableColumnActions: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const i = row.index;
          const isFirstUp = i === 0 || fields[i - 1].level !== fields[i].level;
          const isLastDown =
            i === fields.length - 1 || fields[i + 1].level !== fields[i].level;

          return (
            <Box className={styles.leftCell}>
              <Tooltip title="Up">
                <span>
                  <IconButton
                    size="small"
                    disabled={readOnly || isFirstUp}
                    onClick={() => !readOnly && moveUp(i)}
                  >
                    <FaArrowUp style={{ fontSize: ICON_SIZE }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Down">
                <span>
                  <IconButton
                    size="small"
                    disabled={readOnly || isLastDown}
                    onClick={() => !readOnly && moveDn(i)}
                  >
                    <FaArrowDown style={{ fontSize: ICON_SIZE }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
      /* field name column --------------------------------------------- */
      {
        accessorKey: "key",
        header: "Field",
        size: 160,
        Cell: ({ row }) => {
          const f = row.original;
          const bad = unsafe(f.key);
          return (
            <Box
              className={styles.keyCell}
              sx={{
                pl: `${Math.min(f.level, 3) * INDENT_PER_LEVEL}px`,
                color: bad ? "error.main" : undefined,
              }}
            >
              {typeToIcon[f.type]}{" "}
              <Typography variant="body2" sx={{ ml: 0.5 }}>
                {f.key || <em>unnamed</em>}
              </Typography>
            </Box>
          );
        },
      },
      /* right-hand action column -------------------------------------- */
      {
        id: "ops",
        header: "",
        size: RIGHT_COL,
        enableColumnActions: false,
        enableSorting: false,
        Cell: ({ row }) => {
          const i = row.index;
          const f = fields[i];
          const isObj = f.type === "object" || f.type === "array-object";

          return (
            <Box className={styles.rightCell}>
              {isObj && (
                <Tooltip title={f.locked ? "Unlock" : "Lock"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => !readOnly && togLock(i)}
                      disabled={readOnly}
                    >
                      {f.locked ? (
                        <FaLock style={{ fontSize: ICON_SIZE }} />
                      ) : (
                        <FaLockOpen style={{ fontSize: ICON_SIZE }} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {isObj && (
                <Tooltip title={f.locked ? "Unlock to add child" : "Add child"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => !readOnly && !f.locked && addChild(i)}
                      disabled={readOnly || f.locked}
                    >
                      <FaPlus style={{ fontSize: ICON_SIZE }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Edit">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setIdx(i);
                      setEKey(f.key);
                      setEType(f.type);
                      setPrompt(f.aiPrompt);
                      setOpen(true);
                    }}
                    data-tour={i === 0 ? "field-edit" : undefined}
                  >
                    <EditIcon sx={{ fontSize: ICON_SIZE }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete">
                <span>
                  <IconButton
                    size="small"
                    disabled={readOnly || fields.length <= 1}
                    onClick={() => !readOnly && delRow(i)}
                  >
                    <FaTrashAlt style={{ fontSize: ICON_SIZE }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [readOnly, fields, moveUp, moveDn, togLock, addChild, delRow],
  );

  /* --------------------------- render ------------------------------- */
  return (
    <>
      {(metaErr || descErr) && (
        <Box sx={{ color: "error.main", fontSize: 12, mb: 1 }}>
          {metaErr && "⚠️ ID contains disallowed text. "}
          {descErr && "⚠️ Description contains disallowed text."}
        </Box>
      )}

      {(actualViewMode === "Structure" || actualViewMode === "Split") && (
        <MaterialReactTable
          columns={cols}
          data={fields}
          enableSorting={false}
          enableColumnActions={false}
          enablePagination={false}
          muiTableProps={{
            className: styles.tableBody,
            sx: { maxHeight: "48vh", overflowY: "auto" },
          }}
          renderTopToolbar={() => (
            <Box className={styles.topBar}>
              <Tooltip
                title={
                  canAddRoot
                    ? "Add top-level object"
                    : "Enter valid ID & Description first"
                }
              >
                <span>
                  <IconButton
                    onClick={() => !readOnly && addRoot()}
                    disabled={readOnly || !canAddRoot}
                    sx={{ transform: "translateY(6px)" }}
                  >
                    <FaPlus />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
          enableTableHead={false}
          enableBottomToolbar={false}
        />
      )}

      {/* edit-field dialog ------------------------------------------- */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Field</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            variant="standard"
            label="Field name"
            error={!!editErr}
            helperText={editErr}
            value={eKey}
            onChange={(e) => {
              const raw = e.target.value;
              const v = isLegalId(raw) ? raw : toCamel(raw);
              setEKey(v);
              setEditErr(unsafe(v) ? "Disallowed text" : "");
            }}
            disabled={readOnly}
          />
          <TextField
            variant="standard"
            select
            label="Type"
            value={eType}
            onChange={(e) => setEType(e.target.value)}
            disabled={readOnly}
          >
            {selectOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            variant="standard"
            label="AI prompt"
            multiline
            rows={2}
            value={ePrompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={readOnly}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} data-tour="dialog-cancel">
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={readOnly || !!editErr}
            onClick={() => {
              if (readOnly) return;
              if (idx == null) return;
              const arr = [...fields];
              arr[idx].key = toCamel(eKey.trim());
              arr[idx].type = eType;
              arr[idx].aiPrompt = ePrompt;
              onChangeFields(arr);
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FieldEditor;
