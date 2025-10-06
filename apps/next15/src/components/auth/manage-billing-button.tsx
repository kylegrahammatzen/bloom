'use client';

import { Button } from '@/components/ui/button';
import { getBillingPortalUrl } from '@/app/actions/autumn';
import { useTransition } from 'react';

type ManageBillingButtonProps = {
  returnUrl: string;
}

export const ManageBillingButton = (props: ManageBillingButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const url = await getBillingPortalUrl(props.returnUrl);
        window.location.href = url;
      } catch (error) {
        console.error('Failed to open billing portal:', error);
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Loading...' : 'Manage Billing'}
    </Button>
  );
};
