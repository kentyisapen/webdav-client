// src/contexts/WebDAVContext.tsx

import React, { createContext, useState, ReactNode, useEffect } from "react";
import { createClient, WebDAVClient } from "webdav";

interface WebDAVContextProps {
  client: WebDAVClient | null;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  baseUrl: string | null;
  loading: boolean; // 追加
}

export const WebDAVContext = createContext<WebDAVContextProps>({
  client: null,
  connect: async () => {},
  disconnect: () => {},
  baseUrl: null,
  loading: false, // 追加
});

export const WebDAVProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [client, setClient] = useState<WebDAVClient | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // 追加

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
    setLoading(true); // 追加
    const newClient = createClient(url);
    try {
      // 接続確認のため、ルートディレクトリの一覧を取得
      await newClient.getDirectoryContents("/");
      setClient(newClient);
      setBaseUrl(url);
      localStorage.setItem("webdav_url", url); // ローカルストレージに保存
    } catch (error) {
      console.error("接続エラー:", error);
      throw error;
    } finally {
      setLoading(false); // 追加
    }
  };

  const disconnect = () => {
    setClient(null);
    setBaseUrl(null);
    localStorage.removeItem("webdav_url"); // ローカルストレージから削除
  };

  return (
    <WebDAVContext.Provider
      value={{ client, connect, disconnect, baseUrl, loading }}
    >
      {children}
    </WebDAVContext.Provider>
  );
};
