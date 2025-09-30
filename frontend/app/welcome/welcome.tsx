import { useEffect, useState } from "react";
import { healthCheck } from "../lib/api";

export function Welcome() {
	const [status, setStatus] = useState<string>("Checking...");
	const [data, setData] = useState<any>(null);

	useEffect(() => {
		const checkBackend = async () => {
			const response = await healthCheck();
			if (response.data) {
				setStatus("Connected");
				setData(response.data);
			} else {
				setStatus("Disconnected");
				setData(response.error);
			}
		};
		checkBackend();
	}, []);

	return (
		<div className="p-4">
			<h1>Bloom</h1>
			<p>An open-source project to show how authentication really works</p>
			<span>API Status: {status}</span>
			{data && <pre>{JSON.stringify(data, null, 2)}</pre>}
		</div>
	);
}
