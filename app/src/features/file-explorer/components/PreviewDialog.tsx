// src/components/FileExplorer/PreviewDialog.tsx

import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Button,
  TextField,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FileItem } from "../types/FileItem";
import { WebDAVContext } from "../../../lib/contexts/WebDAVContext";
import SuccessSnackbar from "../../../components/common/SuccessSnackbar";

interface PreviewDialogProps {
  open: boolean;
  file: FileItem | null;
  sortedFiles: FileItem[];
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  imageLoadError: boolean;
  setImageLoadError: (value: boolean) => void;
  getCurrentFileIndex: () => number;
}

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  open,
  file,
  sortedFiles,
  onClose,
  onPrevious,
  onNext,
  imageLoadError,
  setImageLoadError,
  getCurrentFileIndex,
}) => {
  const { client, disconnect, baseUrl, loading } = useContext(WebDAVContext);
  const [textContent, setTextContent] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPutting, setIsPutting] = useState<boolean>(false);
  const [preloadedIndices, setPreloadedIndices] = useState<Set<number>>(
    new Set()
  );

  const makeCompressedHref = (file: FileItem): string => {
    return `${baseUrl}/.compressed/${file.filename}`;
  };

  const isImage = (filename: string) =>
    /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(filename);
  const isVideo = (filename: string) =>
    /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(filename);
  const isText = (filename: string) => /\.(txt)$/i.test(filename);

  // テキストファイルの内容をフェッチ
  useEffect(() => {
    const fetchTextContent = async () => {
      if (file && isText(file.basename) && client) {
        try {
          const content = await client.getFileContents(file.filename, {
            format: "text",
          });
          setTextContent(content as string);
        } catch (error) {
          console.error("テキストファイルの取得に失敗しました:", error);
          setTextContent("");
        }
      } else {
        setTextContent("");
      }
    };

    fetchTextContent();
  }, [file, client]);

  // テキスト編集時のハンドラー
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextContent(e.target.value);

    // デバウンスロジック
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      handlePut(e.target.value);
    }, 500);
  };

  // PUTリクエストを実行
  const handlePut = async (text: string) => {
    if (!file || !client) return;
    setIsPutting(true);
    try {
      await client.putFileContents(file.filename, text, {
        overwrite: true,
      });
      setShowSuccess(true);
    } catch (error) {
      console.error("ファイルの更新に失敗しました:", error);
    } finally {
      setIsPutting(false);
    }
  };

  // 前後3つのファイルをプリロードする関数
  const preloadAdjacentFiles = (indices: number[]) => {
    const newPreloaded = new Set(preloadedIndices);

    indices.forEach((index) => {
      if (
        index >= 0 &&
        index < sortedFiles.length &&
        !newPreloaded.has(index)
      ) {
        const file = sortedFiles[index];
        if (isImage(file.basename) || isVideo(file.basename)) {
          // 画像のプリロード
          if (isImage(file.basename)) {
            const img = new Image();
            img.src = file.href;
          }

          // 動画のプリロード
          if (isVideo(file.basename)) {
            const video = document.createElement("video");
            video.src = file.href;
            video.preload = "auto";
          }

          // プリロード済みとしてマーク
          newPreloaded.add(index);
        }
      }
    });

    setPreloadedIndices(newPreloaded);
  };

  useEffect(() => {
    if (file) {
      const currentIndex = getCurrentFileIndex();
      const initialPreloadIndices: number[] = [];

      for (let i = 1; i <= 3; i++) {
        const prevIndex = currentIndex - i;
        const nextIndex = currentIndex + i;

        if (prevIndex >= 0) initialPreloadIndices.push(prevIndex);
        if (nextIndex < sortedFiles.length)
          initialPreloadIndices.push(nextIndex);
      }

      preloadAdjacentFiles(initialPreloadIndices);
    }
  }, [file, sortedFiles]);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullScreen maxWidth="md">
        <DialogTitle>
          {file?.basename}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers key={file?.filename}>
          {file && isImage(file.basename) && (
            <Box
              component="img"
              src={file.href}
              alt={file.basename}
              sx={{
                width: "100%",
                height: "80vh",
                objectFit: "contain",
              }}
            />
          )}
          {file && isVideo(file.basename) && (
            <video controls loop style={{ width: "100%", maxHeight: "60vh" }}>
              <source
                src={makeCompressedHref(file)}
                type={`video/${file.basename.split(".").pop()}`}
              />
              Your browser does not support the video tag.
            </video>
          )}
          {file && isText(file.basename) && (
            <TextField
              label="テキストファイル編集"
              multiline
              minRows={10}
              maxRows={25}
              fullWidth
              variant="outlined"
              value={textContent}
              onChange={handleTextChange}
            />
          )}
          {file &&
            !isImage(file.basename) &&
            !isVideo(file.basename) &&
            !isText(file.basename) && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "300px",
                }}
              >
                {!imageLoadError ? (
                  <Box
                    component="img"
                    src={file.href}
                    alt={file.basename}
                    sx={{
                      width: "100%",
                      height: "auto",
                      maxHeight: "80vh",
                      objectFit: "contain",
                    }}
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <>
                    <Typography variant="h6" gutterBottom>
                      プレビューできません
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => window.open(file.href, "_blank")}
                    >
                      別タブで開く
                    </Button>
                  </>
                )}
              </Box>
            )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onPrevious}
            disabled={getCurrentFileIndex() <= 0}
            startIcon={<ArrowBackIcon />}
          >
            前へ
          </Button>
          <Button
            onClick={onNext}
            disabled={
              getCurrentFileIndex() === sortedFiles.length - 1 ||
              getCurrentFileIndex() === -1
            }
            endIcon={<ArrowForwardIcon />}
          >
            次へ
          </Button>
        </DialogActions>
      </Dialog>
      <SuccessSnackbar
        open={showSuccess}
        message="ファイルが正常に更新されました。"
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
};

export default PreviewDialog;
