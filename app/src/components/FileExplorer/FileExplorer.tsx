// src/components/FileExplorer/FileExplorer.tsx

import React, {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
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
	Menu,
	MenuItem,
	Stack,
	Icon,
	FormControl,
	InputLabel,
	Select,
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
import MoreVertIcon from "@mui/icons-material/MoreVert"; // 追加
import Close from "@mui/icons-material/Close";

interface FileItem {
	basename: string;
	filename: string;
	type: string; // 'directory' or 'file'
	href: string;
	lastModified: string;
}

const isImage = (filename: string) => {
	return /\.(jpeg|jpg|png|gif|bmp|webp)$/i.test(filename);
};

const isVideo = (filename: string) => {
	return /\.(mp4|mov|avi|wmv|flv|mkv)$/i.test(filename);
};

const FileExplorerScreen: React.FC = () => {
	const { client, disconnect, baseUrl, loading } = useContext(WebDAVContext); // loading を取得
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loadingFiles, setLoadingFiles] = useState<boolean>(false); // ファイル読み込みのローカルloading
	const [error, setError] = useState<string | null>(null);
	const [uploadOpen, setUploadOpen] = useState<boolean>(false);
	const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false); // 新規フォルダモーダルの状態
	const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null); // 追加
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false); // 追加
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath =
		decodeURI(location.pathname.replace("/explorer", "")) || "/";
	const [itemsToShow, setItemsToShow] = useState<number>(50);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const [previewOpen, setPreviewOpen] = useState<boolean>(false);
	const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
	const [sortField, setSortField] = useState<"name" | "lastModified">(
		"lastModified"
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "random">("desc");
	const [sortedFiles, setSortedFiles] = useState<FileItem[]>([]);

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
				lastModified: file.lastmod,
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

	useEffect(() => {
		const handleScroll = () => {
			if (!containerRef.current) return;

			const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
			if (scrollTop + clientHeight >= scrollHeight - 100) {
				// 最下部から100px以内
				setItemsToShow((prev) => {
					const newItemsToShow = prev + 50;
					return newItemsToShow > files.length ? files.length : newItemsToShow;
				});
			}
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (container) {
				container.removeEventListener("scroll", handleScroll);
			}
		};
	}, [files.length]);

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

	const handleFolderCreated = () => {
		// フォルダ作成後にファイルリストを更新
		fetchFiles();
	};

	const handleUploadSuccess = () => {
		fetchFiles();
	};

	const handleMenuOpen = (
		event: React.MouseEvent<HTMLElement>,
		file: FileItem
	) => {
		// 追加
		setAnchorEl(event.currentTarget);
		setSelectedFile(file);
	};

	const handleMenuClose = () => {
		// 追加
		setAnchorEl(null);
		setSelectedFile(null);
	};

	const handleDeleteAction = () => {
		// 追加
		if (selectedFile) {
			handleDelete(selectedFile);
		}
		handleMenuClose();
	};

	const handleDownloadAction = () => {
		// 追加
		if (selectedFile) {
			handleDownload(selectedFile);
		}
		handleMenuClose();
	};

	const handleFileClick = (file: FileItem) => {
		setPreviewFile(file);
		setPreviewOpen(true);
	};

	// ファイルリストをソートする関数を追加
	const sortFiles = (files: FileItem[]): FileItem[] => {
		if (sortOrder === "random") {
			return [...files].sort(() => Math.random() - 0.5);
		}

		return [...files].sort((a, b) => {
			let compare = 0;
			if (sortField === "name") {
				compare = a.basename.localeCompare(b.basename);
			} else if (sortField === "lastModified") {
				// FileItemにlastModifiedフィールドが必要
				const aDate = new Date(a.lastModified);
				const bDate = new Date(b.lastModified);
				compare = aDate.getTime() - bDate.getTime();
			}

			return sortOrder === "asc" ? compare : -compare;
		});
	};

	useEffect(() => {
		setSortedFiles(sortFiles(files));
	}, [sortField, sortOrder]);

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

			{/* Toolbar  */}
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
					<FormControl sx={{ minWidth: 150, ml: 2 }}>
						<InputLabel id="sort-field-label">ソート基準</InputLabel>
						<Select
							labelId="sort-field-label"
							value={sortField}
							label="ソート基準"
							onChange={(e) =>
								setSortField(e.target.value as "name" | "lastModified")
							}
							disabled={sortOrder === "random"}
						>
							<MenuItem value="name">名前</MenuItem>
							<MenuItem value="lastModified">最終更新</MenuItem>
						</Select>
					</FormControl>

					<FormControl sx={{ minWidth: 150, ml: 2 }}>
						<InputLabel id="sort-order-label">ソート順</InputLabel>
						<Select
							labelId="sort-order-label"
							value={sortOrder}
							label="ソート順"
							onChange={(e) =>
								setSortOrder(e.target.value as "asc" | "desc" | "random")
							}
						>
							<MenuItem value="asc">昇順</MenuItem>
							<MenuItem value="desc">降順</MenuItem>
							<MenuItem value="random">ランダム順</MenuItem>
						</Select>
					</FormControl>
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
			<Box ref={containerRef} sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
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
				) : (
					<Grid container rowSpacing={6} columnSpacing={2}>
						{sortedFiles.slice(0, itemsToShow).map((file) => (
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
										cursor: file.type === "directory" ? "pointer" : "default",
										backgroundColor: "transparent",
									}}
									onClick={() => {
										if (file.type === "directory") {
											handleNavigate(file.filename);
										} else {
											handleFileClick(file);
										}
									}}
								>
									<Stack
										direction="row"
										justifyContent={"space-between"}
										alignItems={"center"}
									>
										<Typography variant="subtitle1" noWrap>
											{file.basename}
										</Typography>
										{/* メニューアイコン */}
										<IconButton
											aria-label="more"
											onClick={(e) => {
												e.stopPropagation(); // クリックイベントの伝播を防止
												handleMenuOpen(e, file);
											}}
										>
											<MoreVertIcon />
										</IconButton>
									</Stack>
									{/* ボディ部分 */}
									<Box>
										<Icon
											fontSize="large"
											onClick={(e) => {
												e.stopPropagation(); // クリックイベントの伝播を防止
												handleFileClick(file);
											}}
										>
											{file.type === "directory" ? (
												<FolderIcon fontSize="large" />
											) : (
												<InsertDriveFileIcon fontSize="large" />
											)}
										</Icon>
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

			<Dialog
				open={previewOpen}
				onClose={() => setPreviewOpen(false)}
				fullWidth
				maxWidth="md"
			>
				<DialogTitle>
					{previewFile?.basename}
					<IconButton
						aria-label="close"
						onClick={() => setPreviewOpen(false)}
						sx={{
							position: "absolute",
							right: 8,
							top: 8,
						}}
					>
						<Close />
					</IconButton>
				</DialogTitle>
				<DialogContent dividers>
					{previewFile && isImage(previewFile.basename) && (
						<Box
							component="img"
							src={previewFile.href}
							alt={previewFile.basename}
							sx={{ width: "100%", height: "auto" }}
						/>
					)}
					{previewFile && isVideo(previewFile.basename) && (
						<video controls style={{ width: "100%" }}>
							<source
								src={previewFile.href}
								type={`video/${previewFile.basename.split(".").pop()}`}
							/>
							Your browser does not support the video tag.
						</video>
					)}
					{previewFile &&
						!isImage(previewFile.basename) &&
						!isVideo(previewFile.basename) && (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									height: "300px",
								}}
							>
								<Typography variant="h6" gutterBottom>
									プレビューできません
								</Typography>
								<Button
									variant="contained"
									color="primary"
									onClick={() => window.open(previewFile.href, "_blank")}
								>
									別タブで開く
								</Button>
							</Box>
						)}
				</DialogContent>
			</Dialog>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
			>
				<MenuItem onClick={handleDownloadAction}>ダウンロード</MenuItem>
				<MenuItem onClick={handleDeleteAction}>削除</MenuItem>
			</Menu>

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
