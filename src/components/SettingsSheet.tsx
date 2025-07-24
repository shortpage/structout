// ─── components/SettingsSheet.tsx ──────────────────────────────
import React from "react";
import { SwipeableDrawer, Box, Divider, Typography } from "@mui/material";
import SchemaControls, { SchemaControlsProps } from "./SchemaControls";

type SheetProps = SchemaControlsProps & {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  jsonSchema?: string; // Add this to enable copy/download functionality
};

const SettingsSheet: React.FC<SheetProps> = ({
  open,
  onClose,
  onOpen,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jsonSchema,
  ...controlProps
}) => {
  // Enhanced handlers that close the sheet after action
  const handleCopy = () => {
    controlProps.onCopy();
    // Optionally close sheet after copy
    // setTimeout(() => onClose(), 500);
  };

  const handleDownload = () => {
    controlProps.onDownload();
    onClose(); // Close sheet after initiating download
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      PaperProps={{
        sx: {
          p: 2,
          borderRadius: "16px 16px 0 0",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        },
      }}
    >
      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography variant="subtitle2">Provider &amp; Model</Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <SchemaControls
          {...controlProps}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      </Box>
    </SwipeableDrawer>
  );
};

export default SettingsSheet;
