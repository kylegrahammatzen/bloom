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
    const res = await requestEmailVerification({ email: props.email });
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
      variant="outline"
      size="sm"
    >
      {isLoading ? 'Sending...' : 'Send Verification Email'}
    </Button>
  );
};
