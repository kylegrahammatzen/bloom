'use client';

import { useState } from 'react';
import { useAuth } from '@bloom/react';
import { Button } from '@/components/ui/button';
import { toastManager } from '@/hooks/use-toast';

type VerifyEmailButtonProps = {
  email: string;
}

export const VerifyEmailButton = (props: VerifyEmailButtonProps) => {
  const { requestEmailVerification } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestVerification = async () => {
    setIsLoading(true);
    const start = Date.now();

    const res = await requestEmailVerification({ email: props.email });

    // Ensure loading state shows for at least 500ms
    const elapsed = Date.now() - start;
    if (elapsed < 500) {
      await new Promise(resolve => setTimeout(resolve, 500 - elapsed));
    }

    setIsLoading(false);

    toastManager.add({
      title: res.error ? res.error.message : 'Verification email sent! Check your inbox.',
      type: res.error ? 'error' : 'success',
    });
  };

  return (
    <Button
      onClick={handleRequestVerification}
      disabled={isLoading}
      variant="destructive"
    >
      {isLoading ? 'Sending...' : 'Send Verification Email'}
    </Button>
  );
};
