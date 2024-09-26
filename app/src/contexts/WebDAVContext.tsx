// src/contexts/WebDAVContext.tsx

import React, { createContext, useState, ReactNode, useEffect } from "react";
import { createClient, WebDAVClient } from "webdav";

interface WebDAVContextProps {
	client: WebDAVClient | null;
	connect: (url: string) => Promise<void>;
	disconnect: () => void;
	baseUrl: string | null;
}

export const WebDAVContext = createContext<WebDAVContextProps>({
	client: null,
	connect: async () => {},
	disconnect: () => {},
	baseUrl: null,
});

export const WebDAVProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [client, setClient] = useState<WebDAVClient | null>(null);
	const [baseUrl, setBaseUrl] = useState<string | null>(null);

	// 永続化: ローカルストレージからベースURLを読み込む
	useEffect(() => {
		const savedUrl = localStorage.getItem("webdav_url");
		if (savedUrl) {
			connect(savedUrl).catch(() => {
				// 接続失敗時は何もしない
				console.error("自動接続に失敗しました。");
			});
		}
	}, []);

	const connect = async (url: string) => {
		const newClient = createClient(url);
		// 接続確認のため、ルートディレクトリの一覧を取得
		await newClient.getDirectoryContents("/");
		setClient(newClient);
		setBaseUrl(url);
		localStorage.setItem("webdav_url", url); // ローカルストレージに保存
	};

	const disconnect = () => {
		setClient(null);
		setBaseUrl(null);
		localStorage.removeItem("webdav_url"); // ローカルストレージから削除
	};

	return (
		<WebDAVContext.Provider value={{ client, connect, disconnect, baseUrl }}>
			{children}
		</WebDAVContext.Provider>
	);
};
