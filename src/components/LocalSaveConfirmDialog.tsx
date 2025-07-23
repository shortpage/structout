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
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 *
 * File   : LocalSaveConfirmDialog.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025-06-23
 * Version: 1.0
 *
 * A modal confirmation dialog that appears whenever the user clicks
 * “Save” in SchemaDesigner.  It explains that schemas are stored only
 * in the browser’s localStorage and can be lost if site data is
 * cleared.  The dialog requires the user to check “I understand” before
 * enabling the final “Save to Local Storage” button.
 * -------------------------------------------------------------- */
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

/** Props expected by the confirmation dialog */
export interface LocalSaveConfirmDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Called after the user checks the box and clicks “Save to Local Storage” */
  onConfirm: () => void;
  /** Called when the user cancels or closes the dialog */
  onCancel: () => void;
  /** Display-friendly name of the schema (may be empty) */
  schemaName: string;
}

const LocalSaveConfirmDialog: React.FC<LocalSaveConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  schemaName,
}) => {
  const [ack, setAck] = useState(false);

  /* Reset checkbox every time the dialog is re-opened */
  useEffect(() => setAck(false), [open]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Save to local storage?</DialogTitle>

      <DialogContent dividers>
        <Typography sx={{ mb: 2 }}>
          <strong>{schemaName || "This schema"}</strong> will be saved{" "}
          <em>only</em> in your browser’s local storage. Clearing site data,
          using a private/incognito window, or switching devices will
          permanently delete it. Export a copy if you need a backup.
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              sx={{ p: 0.5 }}
            />
          }
          label="I understand this save is local only and may be lost"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" disabled={!ack} onClick={onConfirm}>
          Save&nbsp;to&nbsp;Local&nbsp;Storage
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocalSaveConfirmDialog;
