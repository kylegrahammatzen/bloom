'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@bloom/react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toastManager } from '@/hooks/use-toast';

export const DeleteAccountDialog = () => {
  const router = useRouter();
  const { deleteAccount, refetch } = useAuth();

  const handleDelete = async () => {
    const res = await deleteAccount();
    await refetch();
    router.refresh();
    toastManager.add({
      title: res.error ? res.error.message : 'Account deleted successfully',
      type: res.error ? 'error' : 'success',
    });
  };

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
          <AlertDialogClose variant="outline">
            Cancel
          </AlertDialogClose>
          <AlertDialogClose variant="destructive" onClick={handleDelete}>
            Delete Account
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
