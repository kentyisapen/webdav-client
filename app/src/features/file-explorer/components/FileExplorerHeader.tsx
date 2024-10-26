// src/components/FileExplorer/FileExplorerHeader.tsx

import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";

interface FileExplorerHeaderProps {
  currentPath: string;
  onDisconnect: () => void;
}

const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
  currentPath,
  onDisconnect,
}) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          WebDAVクライアント
        </Typography>
        <Typography variant="body1" sx={{ mr: 2 }}>
          {currentPath}
        </Typography>
        <Button color="inherit" onClick={onDisconnect}>
          切断
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default FileExplorerHeader;
