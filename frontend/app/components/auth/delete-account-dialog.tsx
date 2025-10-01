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

type DeleteAccountDialogProps = {
	onConfirm: () => void;
};

export function DeleteAccountDialog({ onConfirm }: DeleteAccountDialogProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger variant="destructive">
				Delete Account
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Account</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove all your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose variant="outline">Cancel</AlertDialogClose>
					<AlertDialogClose variant="destructive" onClick={onConfirm}>
						Delete Account
					</AlertDialogClose>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
