// src/components/Upload/UploadModal.tsx

import React, { useState, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close"; // 削除ボタン用アイコン
import { WebDAVContext } from "../../../lib/contexts/WebDAVContext";

interface UploadModalProps {
  open: boolean;
  handleClose: () => void;
  currentPath: string;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  open,
  handleClose,
  currentPath,
  onUploadSuccess,
}) => {
  const { client } = useContext(WebDAVContext);
  const [files, setFiles] = useState<File[]>([]); // FileList から File[] に変更
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...Array.from(e.target.files || []),
      ]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prevFiles) => [
        ...prevFiles,
        ...Array.from(e.dataTransfer.files),
      ]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !client) return;
    setUploading(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer(); // File を ArrayBuffer に変換
        await client.putFileContents(
          `${currentPath}/${file.name}`,
          arrayBuffer,
          {
            overwrite: true,
          }
        );
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setUploading(false);
      handleClose();
      onUploadSuccess();
      setFiles([]); // アップロード後にファイルリストをクリア
    } catch (err) {
      setError("アップロードに失敗しました。");
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>ファイルをアップロード</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: "2px dashed #ccc",
            borderRadius: "4px",
            p: 2,
            textAlign: "center",
            cursor: "pointer",
            mb: 2,
          }}
          onClick={() => document.getElementById("file-input")?.click()}
          onDrop={handleDrop} // ドロップ時のハンドラーを追加
          onDragOver={handleDragOver} // ドラッグオーバー時のハンドラーを追加
        >
          <Typography>ここにファイルをドラッグ＆ドロップ</Typography>
        </Box>
        <input
          id="file-input"
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <CloseIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        )}
        {uploading && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography
              variant="body2"
              color="textSecondary"
            >{`${progress}% 完了`}</Typography>
          </Box>
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          キャンセル
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          color="primary"
          disabled={files.length === 0 || uploading}
        >
          アップロード
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadModal;
