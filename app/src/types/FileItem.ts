export interface FileItem {
	basename: string;
	filename: string;
	type: string; // 'directory' or 'file'
	href: string;
	lastModified: string;
}
