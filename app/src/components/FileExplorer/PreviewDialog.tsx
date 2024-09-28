// src/components/FileExplorer/PreviewDialog.tsx

import React from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	Typography,
	Box,
	Button,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FileItem } from "../../types/FileItem";

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
	const isImage = (filename: string) =>
		/\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(filename);
	const isVideo = (filename: string) =>
		/\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(filename);

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
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
			<DialogContent dividers>
				{file && isImage(file.basename) && (
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
					/>
				)}
				{file && isVideo(file.basename) && (
					<video controls loop style={{ width: "100%" }}>
						<source
							src={file.href}
							type={`video/${file.basename.split(".").pop()}`}
						/>
						Your browser does not support the video tag.
					</video>
				)}
				{file && !isImage(file.basename) && !isVideo(file.basename) && (
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
	);
};

export default PreviewDialog;
