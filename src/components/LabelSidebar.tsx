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
 * File   : LabelSidebar.module.css
 * Author : Sesh Ragavachari
 * Date   : 2025-06-09
 * Version: 1.0
 *  Collapsible tree of labels/examples shown in the left‑hand
 *  Explorer column.  Users can drag labels onto the designer or
 *  click to auto‑insert.
 *
 *  Implementation notes
 *    • Built on MUI‑X TreeView — avoids heavy virtual DOM libs.
 *    • `EXAMPLE_ENABLED` toggle gates the display of saved drafts.
 *    • Styling lives in `LabelSidebarLayout.tsx` and the co‑located
 *      CSS module for minimal runtime logic here.
 * -------------------------------------------------------------- */

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { TreeItem, TreeItemProps } from "@mui/x-tree-view/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FolderIcon from "@mui/icons-material/Folder";
import { styled, useTheme } from "@mui/material/styles";

import { SidebarContainer, TreeWrapper } from "../style/LabelSidebarLayout";
import { EXAMPLE_ENABLED } from "../lib/constants";
import { EXAMPLES } from "../lib/exampleLoader";

/* ------------------------------------------------------------------ */
/* Styled components                                                  */
/* ------------------------------------------------------------------ */

const SpacedTreeItem = styled((props: TreeItemProps) => (
  <TreeItem {...props} />
))(() => ({ "& .MuiTreeItem-content": { marginBottom: 6 } }));

/* ------------------------------------------------------------------ */
/* Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface LabelSidebarProps {
  onSelectTemplate: (templateId: string) => void; // "foo" or "example:foo"
}

const PREFIX = "schema_metadata_";

/** list user-saved templates (ignore built-ins and corrupt items) */
const listTemplates = (): string[] =>
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .map((k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      try {
        const obj = JSON.parse(raw);
        return obj.folderCategory === "example" ? null : k.slice(PREFIX.length);
      } catch {
        console.error("Corrupt schema JSON:", k);
        return null;
      }
    })
    .filter(Boolean)
    .sort() as string[];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const LabelSidebar: React.FC<LabelSidebarProps> = ({ onSelectTemplate }) => {
  /* colour the folder icon with the primary colour */
  const theme = useTheme();
  const FolderI = (
    <FolderIcon htmlColor={theme.palette.primary.main} sx={{ mr: 0.5 }} />
  );

  /* ---------- Saved-schema list (debounced) --------------------- */
  const [templates, setTemplates] = useState<string[]>(listTemplates);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setTemplates(listTemplates());
        debounceRef.current = null;
      }, 200);
    };
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  /* ---------- Example IDs (static) ------------------------------ */
  const exampleIds = useMemo(
    () => (EXAMPLE_ENABLED ? Object.keys(EXAMPLES).sort() : []),
    [],
  );

  /* ---------- Stable click handlers ----------------------------- */
  const handleTplClick = useCallback(
    (tpl: string) => () => onSelectTemplate(tpl),
    [onSelectTemplate],
  );

  const handleExClick = useCallback(
    (ex: string) => () => onSelectTemplate(`example:${ex}`),
    [onSelectTemplate],
  );

  /* ---------- Render tree --------------------------------------- */
  return (
    <SidebarContainer>
      <TreeWrapper
        defaultExpandedItems={[]}
        slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}
      >
        {/* ───────── Saved Schemas ───────── */}
        <SpacedTreeItem itemId="schemas" label={<>{FolderI}Saved Schemas</>}>
          {templates.length === 0 ? (
            <SpacedTreeItem itemId="schemas-empty" label="(none)" disabled />
          ) : (
            templates.map((tpl) => (
              <SpacedTreeItem
                key={tpl}
                itemId={`tpl-${tpl}`}
                label={tpl}
                onClick={handleTplClick(tpl)}
              />
            ))
          )}
        </SpacedTreeItem>

        {/* ───────── Examples (optional) ───────── */}
        {EXAMPLE_ENABLED && (
          <SpacedTreeItem
            itemId="examples"
            label={<>{FolderI}Examples</>}
            data-tour="sidebar-examples"
          >
            {exampleIds.length === 0 ? (
              <SpacedTreeItem itemId="examples-empty" label="(none)" disabled />
            ) : (
              exampleIds.map((ex) => (
                <SpacedTreeItem
                  key={ex}
                  itemId={`ex-${ex}`}
                  label={ex}
                  data-tour={
                    ex.toLowerCase() === "chocolatebrownies"
                      ? "sidebar-ex-chocolatebrownies" /* ← Joyride clicks here */
                      : undefined
                  }
                  onClick={handleExClick(ex)}
                />
              ))
            )}
          </SpacedTreeItem>
        )}
      </TreeWrapper>
    </SidebarContainer>
  );
};

export default LabelSidebar;
