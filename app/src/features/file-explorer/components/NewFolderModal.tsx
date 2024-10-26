// src/components/FileExplorer/NewFolderModal.tsx

import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { WebDAVContext } from "../../../lib/contexts/WebDAVContext";

interface NewFolderModalProps {
  open: boolean;
  handleClose: () => void;
  currentPath: string;
  onFolderCreated: () => void;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({
  open,
  handleClose,
  currentPath,
  onFolderCreated,
}) => {
  const { client, disconnect, baseUrl, loading } = useContext(WebDAVContext); // loading を取得
  const [folderName, setFolderName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<boolean>(false);

  const handleCreate = async () => {
    if (!client) {
      setError("WebDAVクライアントが接続されていません。");
      return;
    }

    if (!folderName.trim()) {
      setError("フォルダ名を入力してください。");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const newFolderPath = `${currentPath}/${folderName}`;
      await client.createDirectory(newFolderPath);
      setCreating(false);
      setFolderName("");
      handleClose();
      onFolderCreated();
    } catch (err) {
      console.error(err);
      setError("フォルダの作成に失敗しました。");
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setFolderName("");
    setError(null);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>新規フォルダ作成</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          新しいフォルダの名前を入力してください。
        </Typography>
        <TextField
          autoFocus
          margin="dense"
          label="フォルダ名"
          type="text"
          fullWidth
          variant="outlined"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          disabled={creating}
        />
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={creating}>
          キャンセル
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          color="primary"
          disabled={creating}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewFolderModal;
