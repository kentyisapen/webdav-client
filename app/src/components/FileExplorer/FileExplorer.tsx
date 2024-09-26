// src/components/FileExplorer/FileExplorer.tsx

import React, { useCallback, useContext, useEffect, useState } from "react";
import { WebDAVContext } from "../../contexts/WebDAVContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
	AppBar,
	Toolbar,
	Typography,
	IconButton,
	Box,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Button,
	CircularProgress,
	Snackbar,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	Dialog,
	DialogContent,
	DialogTitle,
	DialogActions,
	DialogContentText,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadIcon from "@mui/icons-material/Upload";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import GridViewIcon from "@mui/icons-material/GridView";
import TableViewIcon from "@mui/icons-material/TableView";
import UploadModal from "../Upload/UploadModal";
import { getPathSegments } from "../../utils/helpers";
import { FileStat } from "webdav";
import Grid from "@mui/material/Grid2";
import NewFolderModal from "./NewFolderModal";

interface FileItem {
	basename: string;
	filename: string;
	type: string; // 'directory' or 'file'
	href: string;
}

const FileExplorerScreen: React.FC = () => {
	const { client, disconnect, baseUrl, loading } = useContext(WebDAVContext); // loading を取得
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loadingFiles, setLoadingFiles] = useState<boolean>(false); // ファイル読み込みのローカルloading
	const [error, setError] = useState<string | null>(null);
	const [uploadOpen, setUploadOpen] = useState<boolean>(false);
	const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false); // 新規フォルダモーダルの状態
	const [viewMode, setViewMode] = useState<"table" | "grid">("grid"); // 表示モードの状態
	const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null); // 追加
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false); // 追加
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath =
		decodeURI(location.pathname.replace("/explorer", "")) || "/";

	const fetchFiles = useCallback(async () => {
		if (!client || !baseUrl) return;
		setLoadingFiles(true);
		try {
			const contents = (await client.getDirectoryContents(
				currentPath
			)) as FileStat[];
			const mappedFiles: FileItem[] = contents.map((file: FileStat) => ({
				basename: file.basename,
				filename: file.filename,
				type: file.type,
				href: `${baseUrl}${file.filename}`,
			}));
			setFiles(mappedFiles);
		} catch (err) {
			console.error(err);
			setError("ディレクトリの取得に失敗しました。");
		} finally {
			setLoadingFiles(false);
		}
	}, [client, baseUrl, currentPath]);

	useEffect(() => {
		if (loading) {
			return;
		}

		if (!client || !baseUrl) {
			navigate("/");
			return;
		}

		fetchFiles();
	}, [client, baseUrl, currentPath, navigate]);

	const handleNavigate = (path: string) => {
		navigate(`/explorer${path}`);
	};

	const handleGoBack = () => {
		const segments = getPathSegments(currentPath);
		if (segments.length > 1) {
			const parentPath = "/" + segments.slice(0, -1).join("/");
			navigate(`/explorer${parentPath}`);
		} else {
			navigate("/");
		}
	};

	const handleDelete = async (file: FileItem) => {
		setFileToDelete(file); // 追加
		setConfirmDeleteOpen(true); // 追加
	};

	const handleCancelDelete = () => {
		setConfirmDeleteOpen(false);
		setFileToDelete(null);
	};

	const handleConfirmDelete = async () => {
		if (!fileToDelete) return;
		try {
			if (fileToDelete.type === "directory") {
				await client?.deleteFile(fileToDelete.filename); // recursive オプションの追加
			} else {
				await client?.deleteFile(fileToDelete.filename);
			}
			// ファイルリストを更新
			fetchFiles();
			setConfirmDeleteOpen(false);
			setFileToDelete(null);
		} catch (err) {
			console.error(err);
			setError("削除に失敗しました。");
			setConfirmDeleteOpen(false);
			setFileToDelete(null);
		}
	};

	const handleDownload = (file: FileItem) => {
		window.open(file.href, "_blank");
	};

	const handleViewModeChange = (
		event: React.MouseEvent<HTMLElement>,
		newViewMode: "table" | "grid" | null
	) => {
		if (newViewMode !== null) {
			setViewMode(newViewMode);
		}
	};

	const handleFolderCreated = () => {
		// フォルダ作成後にファイルリストを更新
		fetchFiles();
	};

	const handleUploadSuccess = () => {
		fetchFiles();
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			{/* Header */}
			<AppBar position="static">
				<Toolbar>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>
						WebDAVクライアント
					</Typography>
					<Typography variant="body1" sx={{ mr: 2 }}>
						{currentPath}
					</Typography>
					<Button
						color="inherit"
						onClick={() => {
							disconnect();
							navigate("/");
						}}
					>
						切断
					</Button>
				</Toolbar>
			</AppBar>

			{/* Toolbar with View Mode Toggle */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					p: 2,
				}}
			>
				<Box>
					<IconButton
						onClick={handleGoBack}
						disabled={currentPath === "/"}
						color="primary"
					>
						<ArrowBackIcon />
					</IconButton>
				</Box>
				<Box>
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={handleViewModeChange}
						aria-label="view mode"
						size="small"
					>
						<ToggleButton value="table" aria-label="table view">
							<TableViewIcon />
						</ToggleButton>
						<ToggleButton value="grid" aria-label="grid view">
							<GridViewIcon />
						</ToggleButton>
					</ToggleButtonGroup>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						sx={{ ml: 2 }}
						onClick={() => setNewFolderOpen(true)}
					>
						新規フォルダ作成
					</Button>
					<Button
						variant="contained"
						startIcon={<UploadIcon />}
						sx={{ ml: 2 }}
						onClick={() => setUploadOpen(true)}
					>
						アップロード
					</Button>
				</Box>
			</Box>

			{/* Main Content */}
			<Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
				{loadingFiles || loading ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%",
						}}
					>
						<CircularProgress />
					</Box>
				) : viewMode === "table" ? (
					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>名前</TableCell>
									<TableCell align="right">操作</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{files.map((file) => (
									<TableRow key={file.href}>
										<TableCell component="th" scope="row">
											<Button
												startIcon={
													file.type === "directory" ? (
														<FolderIcon />
													) : (
														<InsertDriveFileIcon />
													)
												}
												onClick={() =>
													file.type === "directory"
														? handleNavigate(file.filename)
														: null
												}
												sx={{ textTransform: "none" }}
											>
												{file.basename}
											</Button>
										</TableCell>
										<TableCell align="right">
											{file.type !== "directory" && (
												<IconButton
													aria-label="download"
													onClick={() => handleDownload(file)}
													size="small"
												>
													<DownloadIcon />
												</IconButton>
											)}
											<IconButton
												aria-label="delete"
												onClick={() => handleDelete(file)}
												size="small"
											>
												<DeleteIcon />
											</IconButton>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				) : (
					<Grid container rowSpacing={6} columnSpacing={2}>
						{files.slice(0, 99).map((file) => (
							<Grid key={file.href} size={{ xs: 6, sm: 4, md: 2 }}>
								<Box
									sx={{
										border: "1px solid #ccc",
										borderRadius: "8px",
										p: 2,
										textAlign: "center",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										justifyContent: "space-between",
									}}
								>
									<Box>
										<IconButton
											size="large"
											onClick={() =>
												file.type === "directory"
													? handleNavigate(file.filename)
													: null
											}
										>
											{file.type === "directory" ? (
												<FolderIcon fontSize="large" />
											) : (
												<InsertDriveFileIcon fontSize="large" />
											)}
										</IconButton>
										<Typography variant="body1" noWrap>
											{file.basename}
										</Typography>
									</Box>
									<Box>
										{file.type !== "directory" && (
											<IconButton
												aria-label="download"
												onClick={() => handleDownload(file)}
												size="small"
											>
												<DownloadIcon />
											</IconButton>
										)}
										<IconButton
											aria-label="delete"
											onClick={() => handleDelete(file)}
											size="small"
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								</Box>
							</Grid>
						))}
					</Grid>
				)}
			</Box>

			{/* Upload Modal */}
			<UploadModal
				open={uploadOpen}
				handleClose={() => setUploadOpen(false)}
				currentPath={currentPath}
				onUploadSuccess={handleUploadSuccess}
			/>

			{/* New Folder Modal */}
			<NewFolderModal
				open={newFolderOpen}
				handleClose={() => setNewFolderOpen(false)}
				currentPath={currentPath}
				onFolderCreated={handleFolderCreated} // フォルダ作成後に呼び出す
			/>

			{/* 確認ダイアログの追加 */}
			<Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
				<DialogTitle>ファイルの削除確認</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{fileToDelete
							? `${fileToDelete.basename} を削除してもよろしいですか？`
							: ""}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelDelete} color="primary">
						キャンセル
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
					>
						削除
					</Button>
				</DialogActions>
			</Dialog>

			{/* Error Snackbar */}
			<Snackbar
				open={!!error}
				autoHideDuration={6000}
				onClose={() => setError(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setError(null)}
					severity="error"
					sx={{ width: "100%" }}
				>
					{error}
				</Alert>
			</Snackbar>
		</Box>
	);
};
export default FileExplorerScreen;
