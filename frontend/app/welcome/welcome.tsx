import { useEffect, useState } from "react";
import { healthCheck, authApi } from "~/lib/api";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { toastManager } from "~/hooks/use-toast";
import { SignUpForm } from "~/components/auth/SignUpForm";
import { LoginForm } from "~/components/auth/LoginForm";

export function Welcome() {
	const [status, setStatus] = useState<string>("Checking...");
	const [data, setData] = useState<any>(null);
	const { isSignedIn, isLoading, user, refetch } = useAuth();

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

	const handleSignUp = async (data: { email: string; password: string }) => {
		const response = await authApi.register(data.email, data.password);
		if (response.data) {
			await refetch();
			toastManager.add({
				title: "Account created successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Sign up failed",
				description: response.error?.message || "Please try again",
				type: "error",
			});
		}
	};

	const handleLogin = async (data: { email: string; password: string }) => {
		const response = await authApi.login(data.email, data.password);
		if (response.data) {
			await refetch();
			toastManager.add({
				title: "Logged in successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Login failed",
				description: response.error?.message || "Please try again",
				type: "error",
			});
		}
	};

	const handleLogout = async () => {
		await authApi.logout();
		await refetch();
		toastManager.add({
			title: "Logged out successfully",
			type: "success",
		});
	};

	return (
		<div className="p-4">
			<h1>Bloom</h1>
			<p>An open-source project to show how authentication really works</p>

			<div>
				<span>API Status: {status}</span>
				{data && <pre>{JSON.stringify(data, null, 2)}</pre>}
			</div>

			<div>
				<span>Auth Status: {isLoading ? "Checking..." : isSignedIn ? "Signed In" : "Signed Out"}</span>
			</div>

			<div>
				{isSignedIn ? (
					<Card>
						<CardHeader>
							<CardTitle>Logged In</CardTitle>
						</CardHeader>
						<CardContent>
							<p>Logged in as: {user?.email}</p>
							<Button onClick={handleLogout}>Logout</Button>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						<SignUpForm onSubmit={handleSignUp} />
						<LoginForm onSubmit={handleLogin} />
					</div>
				)}
			</div>
		</div>
	);
}
