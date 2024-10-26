// src/components/FileExplorer/FileExplorerToolbar.tsx

import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { CreateNewFolder, InsertDriveFile } from "@mui/icons-material";

interface FileExplorerToolbarProps {
  sortField: "name" | "lastModified" | "random";
  sortOrder: "asc" | "desc";
  currentPath: string;
  onSortFieldChange: (field: "name" | "lastModified" | "random") => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
  onCreateFolder: () => void;
  onUpload: () => void;
  onGoBack: () => void;
}

const FileExplorerToolbar: React.FC<FileExplorerToolbarProps> = ({
  sortField,
  sortOrder,
  currentPath,
  onSortFieldChange,
  onSortOrderChange,
  onCreateFolder,
  onUpload,
  onGoBack,
}) => {
  // State for SortField Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleSortFieldClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortFieldClose = () => {
    setAnchorEl(null);
  };

  const handleSortFieldSelect = (field: "name" | "lastModified" | "random") => {
    onSortFieldChange(field);
    handleSortFieldClose();
  };

  // Toggle SortOrder between 'asc' and 'desc'
  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    onSortOrderChange(newOrder);
  };

  const [anchorElNewMenu, setAnchorElNewMenu] = useState<null | HTMLElement>(
    null
  );
  const openNewMenu = Boolean(anchorElNewMenu);

  const handleNewMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElNewMenu(event.currentTarget);
  };

  const handleNewMenuClose = () => {
    setAnchorElNewMenu(null);
  };

  const handleCreateFolder = () => {
    onCreateFolder();
    handleNewMenuClose();
  };

  const handleUpload = () => {
    onUpload();
    handleNewMenuClose();
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      p={2}
    >
      <IconButton
        onClick={onGoBack}
        disabled={currentPath === "/"}
        color="primary"
      >
        <ArrowBackIcon />
      </IconButton>
      <Box display="flex" alignItems="center">
        {/* SortField Button */}
        <Button
          variant="outlined"
          onClick={handleSortFieldClick}
          sx={{ mr: 2 }}
        >
          {sortField === "name"
            ? "名前順"
            : sortField === "lastModified"
            ? "最終更新順"
            : "ランダム順"}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleSortFieldClose}
        >
          <MenuItem
            selected={sortField === "name"}
            onClick={() => handleSortFieldSelect("name")}
          >
            名前順
          </MenuItem>
          <MenuItem
            selected={sortField === "lastModified"}
            onClick={() => handleSortFieldSelect("lastModified")}
          >
            最終更新順
          </MenuItem>
          <MenuItem
            selected={sortField === "random"}
            onClick={() => handleSortFieldSelect("random")}
          >
            ランダム順
          </MenuItem>
        </Menu>

        {/* SortOrder IconButton */}
        <IconButton
          onClick={handleSortOrderToggle}
          disabled={sortField === "random"}
          color="primary"
        >
          {sortOrder === "asc" ? <ArrowUpward /> : <ArrowDownward />}
        </IconButton>

        {/* New Button with Menu */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ ml: 4 }}
          onClick={handleNewMenuClick}
        >
          新規
        </Button>
        <Menu
          anchorEl={anchorElNewMenu}
          open={openNewMenu}
          onClose={handleNewMenuClose}
        >
          <MenuItem onClick={handleCreateFolder}>
            <ListItemIcon>
              <CreateNewFolder fontSize="small" />
            </ListItemIcon>
            <ListItemText>フォルダの新規作成</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleUpload}>
            <ListItemIcon>
              <InsertDriveFile fontSize="small" />
            </ListItemIcon>
            <ListItemText>ファイルのアップロード</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default FileExplorerToolbar;
