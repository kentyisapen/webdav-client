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
	Box,
	Typography,
} from "@mui/material";
import { WebDAVContext } from "../../contexts/WebDAVContext";

interface UploadModalProps {
	open: boolean;
	handleClose: () => void;
	currentPath: string;
}

const UploadModal: React.FC<UploadModalProps> = ({
	open,
	handleClose,
	currentPath,
}) => {
	const { client } = useContext(WebDAVContext);
	const [files, setFiles] = useState<FileList | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [progress, setProgress] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFiles(e.target.files);
		}
	};

	const handleUpload = async () => {
		if (!files || !client) return;
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
				{files && (
					<List>
						{Array.from(files).map((file, index) => (
							<ListItem key={index}>
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
					disabled={!files || uploading}
				>
					アップロード
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default UploadModal;
