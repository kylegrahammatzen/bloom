import { useEffect, useState } from "react";
import { healthCheck, authApi } from "~/lib/api";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { toastManager } from "~/hooks/use-toast";
import { SignUpForm } from "~/components/auth/SignUpForm";
import { LoginForm } from "~/components/auth/LoginForm";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

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
			// Automatically log in after successful registration
			const loginResponse = await authApi.login(data.email, data.password);
			if (loginResponse.data) {
				await refetch();
				toastManager.add({
					title: "Account created successfully",
					type: "success",
				});
			} else {
				toastManager.add({
					title: "Account created, but login failed",
					description: "Please try logging in manually",
					type: "warning",
				});
			}
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

	const handleDeleteAccount = async () => {
		const response = await authApi.deleteAccount();
		if (response.data) {
			await refetch();
			toastManager.add({
				title: "Account deleted successfully",
				type: "success",
			});
		} else {
			toastManager.add({
				title: "Failed to delete account",
				description: response.error?.message || "Please try again",
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
				<span>Auth Status: {isLoading ? "Checking..." : isSignedIn ? "Signed In" : "Signed Out"}</span>
				{user && <pre>{JSON.stringify(user, null, 2)}</pre>}
			</div>

			<div>
				{isSignedIn ? (
					<Card>
						<CardHeader>
							<CardTitle>Logged In</CardTitle>
						</CardHeader>
						<CardContent>
							<p>Logged in as: {user?.email}</p>
							<div className="flex gap-2">
								<Button onClick={handleLogout}>Logout</Button>
								<AlertDialog>
									<AlertDialogTrigger
										render={(props) => (
											<Button {...props} variant="destructive">
												Delete Account
											</Button>
										)}
									/>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Delete Account</AlertDialogTitle>
											<AlertDialogDescription>
												This action cannot be undone. This will permanently delete your
												account and remove all your data from our servers.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogClose
												render={(props) => (
													<Button {...props} variant="outline">
														Cancel
													</Button>
												)}
											/>
											<Button variant="destructive" onClick={handleDeleteAccount}>
												Delete Account
											</Button>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
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
