import { useEffect, useState } from "react";
import { healthCheck } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export function Welcome() {
	const [status, setStatus] = useState<string>("Checking...");
	const [data, setData] = useState<any>(null);
	const { isSignedIn, isLoading } = useAuth();

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
			<span>Auth Status: {isLoading ? "Checking..." : isSignedIn ? "Signed In" : "Signed Out"}</span>
		</div>
	);
}
