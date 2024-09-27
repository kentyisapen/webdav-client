// src/components/FileExplorer/FileExplorerToolbar.tsx

import React from "react";
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface FileExplorerToolbarProps {
	sortField: "name" | "lastModified";
	sortOrder: "asc" | "desc" | "random";
	onSortFieldChange: (field: "name" | "lastModified") => void;
	onSortOrderChange: (order: "asc" | "desc" | "random") => void;
	onCreateFolder: () => void;
	onUpload: () => void;
	onGoBack: () => void;
}

const FileExplorerToolbar: React.FC<FileExplorerToolbarProps> = ({
	sortField,
	sortOrder,
	onSortFieldChange,
	onSortOrderChange,
	onCreateFolder,
	onUpload,
	onGoBack,
}) => {
	return (
		<Box
			display="flex"
			justifyContent="space-between"
			alignItems="center"
			p={2}
		>
			<IconButton onClick={onGoBack} disabled={false} color="primary">
				<ArrowBackIcon />
			</IconButton>
			<Box>
				<FormControl sx={{ minWidth: 150, ml: 2 }}>
					<InputLabel id="sort-field-label">ソート基準</InputLabel>
					<Select
						labelId="sort-field-label"
						value={sortField}
						label="ソート基準"
						onChange={(e) =>
							onSortFieldChange(e.target.value as "name" | "lastModified")
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
							onSortOrderChange(e.target.value as "asc" | "desc" | "random")
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
					onClick={onCreateFolder}
				>
					新規フォルダ作成
				</Button>
				<Button
					variant="contained"
					startIcon={<UploadIcon />}
					sx={{ ml: 2 }}
					onClick={onUpload}
				>
					アップロード
				</Button>
			</Box>
		</Box>
	);
};

export default FileExplorerToolbar;
