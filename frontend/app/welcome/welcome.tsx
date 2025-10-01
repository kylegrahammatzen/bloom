import { useEffect, useState } from "react";
import { healthCheck } from "~/lib/api";
import { authClient } from "~/lib/bloom";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { toastManager } from "~/hooks/use-toast";
import { SignUpForm } from "~/components/auth/SignUpForm";
import { LoginForm } from "~/components/auth/LoginForm";
import { DeleteAccountDialog } from "~/components/auth/delete-account-dialog";

export function Welcome() {
	const [status, setStatus] = useState<string>("Checking...");
	const [data, setData] = useState<any>(null);
	const { session, isLoading: isPending, refetch } = useAuth();

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

	const handleSignUp = async (body: { email: string; password: string }) => {
		const { data, error } = await authClient.signUp.email(body);
		if (data) {
			await refetch();
			toastManager.add({
				title: "Account created successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Sign up failed",
				description: error?.message || "Please try again",
				type: "error",
			});
		}
	};

	const handleLogin = async (body: { email: string; password: string }) => {
		const { data, error } = await authClient.signIn.email(body);
		if (data) {
			await refetch();
			toastManager.add({
				title: "Logged in successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Login failed",
				description: error?.message || "Please try again",
				type: "error",
			});
		}
	};

	const handleLogout = async () => {
		await authClient.signOut();
		await refetch();
		toastManager.add({
			title: "Logged out successfully",
			type: "success",
		});
	};

	const handleDeleteAccount = async () => {
		const { data, error } = await authClient.deleteAccount();
		if (data) {
			await refetch();
			toastManager.add({
				title: "Account deleted successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Failed to delete account",
				description: error?.message || "Please try again",
				type: "error",
			});
		}
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
				<span>Auth Status: {isPending ? "Checking..." : session ? "Signed In" : "Signed Out"}</span>
				{session?.user && <pre>{JSON.stringify(session.user, null, 2)}</pre>}
			</div>

			<div>
				{session ? (
					<Card>
						<CardHeader>
							<CardTitle>Logged In</CardTitle>
						</CardHeader>
						<CardContent>
							<p>Logged in as: {session.user.email}</p>
							<div className="flex gap-2">
								<Button onClick={handleLogout}>Logout</Button>
								<DeleteAccountDialog onConfirm={handleDeleteAccount} />
							</div>
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
