'use client';

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

type DowngradeDialogProps = {
  planName: string;
  onConfirm: () => void;
  isPending: boolean;
}

export const DowngradeDialog = (props: DowngradeDialogProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger variant="destructive" size="sm" className="w-full" disabled={props.isPending}>
        {props.isPending ? 'Loading...' : 'Downgrade'}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Downgrade to {props.planName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll lose access to features from your current plan. This change will take effect at the end of your billing period.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose variant="outline">
            Cancel
          </AlertDialogClose>
          <AlertDialogClose variant="destructive" onClick={props.onConfirm}>
            Confirm Downgrade
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
