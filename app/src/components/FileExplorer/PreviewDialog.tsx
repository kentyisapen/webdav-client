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
import { FileItem } from "../../types/FileItem";
import { WebDAVContext } from "../../contexts/WebDAVContext";
import SuccessSnackbar from "../FileExplorer/SuccessSnackbar";

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
	const { client } = useContext(WebDAVContext);
	const [textContent, setTextContent] = useState<string>("");
	const [showSuccess, setShowSuccess] = useState<boolean>(false);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);
	const [isPutting, setIsPutting] = useState<boolean>(false);

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

	return (
		<>
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
