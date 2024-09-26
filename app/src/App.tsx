// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WebDAVProvider } from "./contexts/WebDAVContext";
import ConnectionScreen from "./components/Connection/ConnectionForm";
import FileExplorerScreen from "./components/FileExplorer/FileExplorer";

const App: React.FC = () => {
	return (
		<WebDAVProvider>
			<Router>
				<Routes>
					<Route path="/" element={<ConnectionScreen />} />
					<Route path="/explorer/*" element={<FileExplorerScreen />} />
				</Routes>
			</Router>
		</WebDAVProvider>
	);
};

export default App;
