// src/components/Connection/ConnectionForm.tsx

import React, { useState, useContext, useEffect } from "react";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";
import { WebDAVContext } from "../../contexts/WebDAVContext";
import { useNavigate } from "react-router-dom";

const ConnectionForm: React.FC = () => {
	const [url, setUrl] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { connect, client } = useContext(WebDAVContext);
	const navigate = useNavigate();

	const handleConnect = async () => {
		try {
			await connect(url);
			setError(null);
			navigate("/explorer");
		} catch (err) {
			setError("サーバーに接続できません。URLを確認してください。");
		}
	};

	useEffect(() => {
		if (client) {
			navigate("/explorer");
		}
	}, [client]);

	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent="center"
			height="100vh"
		>
			<Typography variant="h4" gutterBottom>
				WebDAVクライアントに接続
			</Typography>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			<TextField
				label="サーバーURL"
				variant="outlined"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				fullWidth
				sx={{ mb: 2, maxWidth: 400 }}
			/>
			<Button variant="contained" color="primary" onClick={handleConnect}>
				接続
			</Button>
		</Box>
	);
};

export default ConnectionForm;
