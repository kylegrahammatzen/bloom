'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@bloom/react';
import { Button } from '@/components/ui/button';

type SessionRevokeButtonProps = {
  sessionId: string;
  isCurrent: boolean;
};

export const SessionRevokeButton = (props: SessionRevokeButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signOut, revokeSession } = useAuth();

  const handleRevoke = async () => {
    setLoading(true);
    try {
      if (props.isCurrent) {
        await signOut();
        router.push('/');
      } else {
        await revokeSession(props.sessionId);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to revoke session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleRevoke}
      disabled={loading}
    >
      Sign out
    </Button>
  );
};
