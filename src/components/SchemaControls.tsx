// ─── components/SchemaControls.tsx ──────────────────────────────
import React from "react";
import {
  FormControl, InputLabel, MenuItem, Select,
  IconButton, Tooltip,
} from "@mui/material";
import ContentCopyIcon   from "@mui/icons-material/ContentCopy";
import DownloadIcon      from "@mui/icons-material/Download";
import Brightness4Icon   from "@mui/icons-material/Brightness4";

import {
  PROVIDERS, PROVIDER_META, ProviderId, ModelKey,
} from "../utils/providerRegistry";

/* ── SINGLE source of truth ──────────────────────────────────── */
export interface SchemaControlsProps {
  isMobile: boolean;
  llmProvider: ProviderId;
  modelKey: ModelKey;
  onProviderChange: (p: ProviderId) => void;
  onModelChange: (m: ModelKey) => void;
  onCopy: () => void;
  onDownload: () => void;
  onToggleDark: () => void;
  canCopy: boolean;
  canDownload: boolean;

  /* desktop‑only – optional on mobile */
  inHelperView?: boolean;
  view?: string;
}

const SchemaControls: React.FC<SchemaControlsProps> = ({
                                                         isMobile,
                                                         inHelperView = false,        // default for mobile
                                                         llmProvider,
                                                         modelKey,
                                                         onProviderChange,
                                                         onModelChange,
                                                         onCopy,
                                                         onDownload,
                                                         onToggleDark,
                                                         canCopy,
                                                         canDownload,
                                                       }) => (
  <>
    {/* Provider */}
    <FormControl
      variant="standard"
      size="small"
      sx={{ minWidth: isMobile ? 110 : 130 }}
      disabled={inHelperView}
    >
      <InputLabel>Provider</InputLabel>
      <Select
        value={llmProvider}
        onChange={(e) => onProviderChange(e.target.value as ProviderId)}
      >
        {PROVIDERS.map((id) => (
          <MenuItem key={id} value={id}>
            {id}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Model */}
    <FormControl
      variant="standard"
      size="small"
      sx={{ minWidth: isMobile ? 120 : 150 }}
    >
      <InputLabel>Model</InputLabel>
      <Select
        value={modelKey}
        onChange={(e) => onModelChange(e.target.value as ModelKey)}
      >
        {Object.keys(PROVIDER_META[llmProvider].models).map((k) => (
          <MenuItem key={k} value={k}>
            {k}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Actions */}
    <Tooltip title="Copy">
      <span>
        <IconButton size="small" disabled={!canCopy} onClick={onCopy}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </span>
    </Tooltip>

    <Tooltip title="Download ZIP">
      <span>
        <IconButton size="small" disabled={!canDownload} onClick={onDownload}>
          <DownloadIcon fontSize="inherit" />
        </IconButton>
      </span>
    </Tooltip>

    <Tooltip title="Toggle light/dark">
      <IconButton size="small" onClick={onToggleDark}>
        <Brightness4Icon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  </>
);

export default SchemaControls;
