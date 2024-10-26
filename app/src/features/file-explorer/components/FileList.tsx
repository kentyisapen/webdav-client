// src/components/FileExplorer/FileList.tsx

import React, { useContext } from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Grid from "@mui/material/Grid2";
import { WebDAVContext } from "../../../lib/contexts/WebDAVContext";

interface FileItem {
  basename: string;
  filename: string;
  type: string; // 'directory' or 'file'
  href: string;
  lastModified: string;
}

interface FileListProps {
  files: FileItem[];
  onFileClick: (file: FileItem) => void;
  onNavigate: (path: string) => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, file: FileItem) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  onFileClick,
  onNavigate,
  onMenuOpen,
}) => {
  const { baseUrl } = useContext(WebDAVContext);
  const makeThumbnailslHref = (file: FileItem): string => {
    return `${baseUrl}/.thumbnails/${file.filename}.thumb.jpg`;
  };

  const isVideo = (filename: string) =>
    /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(filename);
  const isPDF = (filename: string) => /\.(pdf)$/i.test(filename);
  const isImage = (filename: string) =>
    /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(filename);
  const isHidden = (filename: string) => /^\/\..*/i.test(filename);

  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      {files
        .filter((file) => !isHidden(file.filename))
        .map((file) => (
          <Grid key={file.href} size={{ xs: 6, sm: 4, md: 2 }}>
            <Box
              sx={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                p: 2,
                textAlign: "center",
                height: "200px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: file.type === "directory" ? "pointer" : "default",
                backgroundColor: "transparent",
              }}
              onClick={() => {
                if (file.type === "directory") {
                  onNavigate(file.filename);
                } else {
                  onFileClick(file);
                }
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle1" noWrap>
                  {file.basename}
                </Typography>
                <IconButton
                  aria-label="more"
                  onClick={(e) => {
                    e.stopPropagation(); // クリックイベントの伝播を防止
                    onMenuOpen(e, file);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Stack>
              <Box>
                {file.type === "directory" ? (
                  <FolderIcon fontSize="large" />
                ) : isVideo(file.filename) ||
                  isPDF(file.filename) ||
                  isImage(file.filename) ? (
                  <Box
                    sx={{
                      objectFit: "contain",
                      width: "100%",
                      height: "160px",
                    }}
                    component="img"
                    loading="lazy"
                    src={makeThumbnailslHref(file)}
                  />
                ) : (
                  // <InsertDriveFileIcon fontSize="large" />
                  <InsertDriveFileIcon fontSize="large" />
                )}
              </Box>
            </Box>
          </Grid>
        ))}
    </Grid>
  );
};

export default FileList;
