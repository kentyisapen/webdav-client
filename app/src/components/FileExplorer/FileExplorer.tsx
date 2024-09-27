// src/components/FileExplorer/FileExplorer.tsx

import React, {
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
} from "react";
import { WebDAVContext } from "../../contexts/WebDAVContext";
import { useNavigate, useLocation } from "react-router-dom";
import FileExplorerHeader from "./FileExplorerHeader";
import FileExplorerToolbar from "./FileExplorerToolbar";
import FileList from "./FileList";
import PreviewDialog from "./PreviewDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import ErrorSnackbar from "./ErrorSnackbar";
import UploadModal from "../Upload/UploadModal";
import NewFolderModal from "./NewFolderModal";
import { FileItem } from "../../types/FileItem";
import { FileStat } from "webdav";
import { getPathSegments } from "../../utils/helpers";
import { Box, CircularProgress, Menu, MenuItem } from "@mui/material";

const FileExplorerScreen: React.FC = () => {
	// コンテキストから必要な値を取得
	const { client, disconnect, baseUrl, loading } = useContext(WebDAVContext);

	// 状態管理
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadOpen, setUploadOpen] = useState<boolean>(false);
	const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false);
	const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
	const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
	const [previewOpen, setPreviewOpen] = useState<boolean>(false);
	const [sortField, setSortField] = useState<"name" | "lastModified">(
		"lastModified"
	);
	const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "random">("desc");
	const [sortedFiles, setSortedFiles] = useState<FileItem[]>([]);
	const [imageLoadError, setImageLoadError] = useState<boolean>(false);

	const navigate = useNavigate();
	const location = useLocation();
	const currentPath =
		decodeURI(location.pathname.replace("/explorer", "")) || "/";
	const [itemsToShow, setItemsToShow] = useState<number>(50);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

	// ファイル一覧を取得する関数
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

	// コンポーネントのマウント時および依存関係が変化した際にファイル一覧を取得
	useEffect(() => {
		if (loading) {
			return;
		}

		if (!client || !baseUrl) {
			navigate("/");
			return;
		}

		fetchFiles();
	}, [client, baseUrl, currentPath, navigate, loading, fetchFiles]);

	// スクロールイベントハンドラー
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

	// ファイルリストをソートする関数
	const sortFiles = (files: FileItem[]): FileItem[] => {
		if (sortOrder === "random") {
			return [...files].sort(() => Math.random() - 0.5);
		}

		return [...files].sort((a, b) => {
			let compare = 0;
			if (sortField === "name") {
				compare = a.basename.localeCompare(b.basename);
			} else if (sortField === "lastModified") {
				const aDate = new Date(a.lastModified);
				const bDate = new Date(b.lastModified);
				compare = aDate.getTime() - bDate.getTime();
			}

			return sortOrder === "asc" ? compare : -compare;
		});
	};

	// ソート後のファイルリストを設定
	useEffect(() => {
		setSortedFiles(sortFiles(files));
	}, [files, sortField, sortOrder]);

	// プレビュー対象ファイルが変更された際にエラーフラグをリセット
	useEffect(() => {
		setImageLoadError(false);
	}, [previewFile]);

	// プレビュー中のファイルのインデックスを取得
	const getCurrentFileIndex = (): number => {
		if (!previewFile) return -1;
		return sortedFiles.findIndex((file) => file.href === previewFile.href);
	};

	// 次のファイルをプレビュー
	const handleNextFile = () => {
		const currentIndex = getCurrentFileIndex();
		if (currentIndex !== -1 && currentIndex < sortedFiles.length - 1) {
			setPreviewFile(sortedFiles[currentIndex + 1]);
		}
	};

	// 前のファイルをプレビュー
	const handlePreviousFile = () => {
		const currentIndex = getCurrentFileIndex();
		if (currentIndex > 0) {
			setPreviewFile(sortedFiles[currentIndex - 1]);
		}
	};

	// ナビゲーション関数
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

	// 削除操作
	const handleDelete = async (file: FileItem) => {
		setFileToDelete(file);
		setConfirmDeleteOpen(true);
	};

	const handleCancelDelete = () => {
		setConfirmDeleteOpen(false);
		setFileToDelete(null);
	};

	const handleConfirmDelete = async () => {
		if (!fileToDelete) return;
		try {
			if (fileToDelete.type === "directory") {
				await client?.deleteFile(fileToDelete.filename); // ディレクトリの削除
			} else {
				await client?.deleteFile(fileToDelete.filename); // ファイルの削除
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

	// ダウンロード操作
	const handleDownload = (file: FileItem) => {
		window.open(file.href, "_blank");
	};

	// フォルダ作成後の処理
	const handleFolderCreated = () => {
		fetchFiles();
	};

	// アップロード成功後の処理
	const handleUploadSuccess = () => {
		fetchFiles();
	};

	// メニュー操作
	const handleMenuOpen = (
		event: React.MouseEvent<HTMLElement>,
		file: FileItem
	) => {
		setAnchorEl(event.currentTarget);
		setSelectedFile(file);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		setSelectedFile(null);
	};

	const handleDeleteAction = () => {
		if (selectedFile) {
			handleDelete(selectedFile);
		}
		handleMenuClose();
	};

	const handleDownloadAction = () => {
		if (selectedFile) {
			handleDownload(selectedFile);
		}
		handleMenuClose();
	};

	// ファイルクリック時の処理
	const handleFileClick = (file: FileItem) => {
		setPreviewFile(file);
		setPreviewOpen(true);
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			{/* Header */}
			<FileExplorerHeader
				currentPath={currentPath}
				onDisconnect={() => {
					disconnect();
					navigate("/");
				}}
			/>

			{/* Toolbar */}
			<FileExplorerToolbar
				sortField={sortField}
				sortOrder={sortOrder}
				currentPath={currentPath}
				onSortFieldChange={setSortField}
				onSortOrderChange={setSortOrder}
				onCreateFolder={() => setNewFolderOpen(true)}
				onUpload={() => setUploadOpen(true)}
				onGoBack={handleGoBack}
			/>

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
					<FileList
						files={sortedFiles.slice(0, itemsToShow)}
						onFileClick={handleFileClick}
						onNavigate={handleNavigate}
						onMenuOpen={handleMenuOpen}
					/>
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
				onFolderCreated={handleFolderCreated}
			/>

			{/* Delete Confirmation Dialog */}
			<DeleteConfirmationDialog
				open={confirmDeleteOpen}
				file={fileToDelete}
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>

			{/* Preview Dialog */}
			<PreviewDialog
				open={previewOpen}
				file={previewFile}
				sortedFiles={sortedFiles}
				onClose={() => setPreviewOpen(false)}
				onPrevious={handlePreviousFile}
				onNext={handleNextFile}
				imageLoadError={imageLoadError}
				setImageLoadError={setImageLoadError}
				getCurrentFileIndex={getCurrentFileIndex}
			/>

			{/* Menu Component */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
			>
				<MenuItem onClick={handleDownloadAction}>ダウンロード</MenuItem>
				<MenuItem onClick={handleDeleteAction}>削除</MenuItem>
			</Menu>

			{/* Error Snackbar */}
			<ErrorSnackbar
				open={!!error}
				message={error || ""}
				onClose={() => setError(null)}
			/>
		</Box>
	);
};

export default FileExplorerScreen;
