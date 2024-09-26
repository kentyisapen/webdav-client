// src/components/FileExplorer/FileExplorer.tsx

import React, { useContext, useEffect, useState } from "react";
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

interface FileItem {
	basename: string;
	filename: string;
	type: string; // 'directory' or 'file'
	href: string;
}

const FileExplorerScreen: React.FC = () => {
	const { client, disconnect, baseUrl } = useContext(WebDAVContext);
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadOpen, setUploadOpen] = useState<boolean>(false);
	const [viewMode, setViewMode] = useState<"table" | "grid">("grid"); // 表示モードの状態
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath =
		decodeURI(location.pathname.replace("/explorer", "")) || "/";

	useEffect(() => {
		if (!client || !baseUrl) {
			navigate("/");
			return;
		}

		const fetchFiles = async () => {
			setLoading(true);
			try {
				const contents = (await client.getDirectoryContents(
					currentPath
				)) as FileStat[];
				const mappedFiles: FileItem[] = contents.map((file: FileStat) => ({
					basename: file.basename,
					filename: file.filename,
					type: file.type,
					href: `${baseUrl}${file.filename}`, // ベースURLとファイルパスを組み合わせてhrefを生成
				}));
				setFiles(mappedFiles);
				setLoading(false);
			} catch (err) {
				console.error(err);
				setError("ディレクトリの取得に失敗しました。");
				setLoading(false);
			}
		};

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
		try {
			if (file.type === "directory") {
				await client?.deleteFile(file.filename); // ディレクトリの場合はrecursiveオプション
			} else {
				await client?.deleteFile(file.filename); // ファイルの場合
			}
			// ファイルリストを更新
			const contents = (await client?.getDirectoryContents(currentPath)) as
				| FileStat[]
				| undefined;
			if (contents) {
				const mappedFiles: FileItem[] = contents.map((file: FileStat) => ({
					basename: file.basename,
					filename: file.filename,
					type: file.type,
					href: `${baseUrl}${file.filename}`,
				}));
				setFiles(mappedFiles);
			} else {
				setFiles([]); // contents が undefined の場合
			}
		} catch (err) {
			console.error(err);
			setError("削除に失敗しました。");
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
						onClick={() => navigate("/")}
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
				{loading ? (
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
						{files.map((file) => (
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
			/>

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
