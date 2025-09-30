import { useEffect } from "react";
import { healthCheck } from "../lib/api";

export function Welcome() {
	useEffect(() => {
		const checkBackend = async () => {
			const response = await healthCheck();
			if (response.data) {
				console.log("✅ Backend server is up:", response.data);
			} else {
				console.error("❌ Backend server is down:", response.error);
			}
		};
		checkBackend();
	}, []);

	return (
		<main className="flex items-center justify-center pt-16 pb-4">
			<div className="flex-1 flex flex-col items-center gap-16 min-h-0">
				<header className="flex flex-col items-center gap-9">
					<h1 className="text-6xl font-bold text-center">
						Bloom
					</h1>
					<p className="text-xl text-center max-w-2xl px-4">
						An open-source project to show how authentication really works
					</p>
				</header>
			</div>
		</main>
	);
}
