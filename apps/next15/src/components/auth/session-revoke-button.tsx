'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type SessionRevokeButtonProps = {
  sessionId: string;
  isCurrent: boolean;
};

export const SessionRevokeButton = (props: SessionRevokeButtonProps) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRevoke = async () => {
    setLoading(true);
    try {
      if (props.isCurrent) {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
        });
        if (response.ok) {
          router.refresh();
        }
      } else {
        const response = await fetch('/api/auth/sessions/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: props.sessionId }),
        });
        if (response.ok) {
          router.refresh();
        }
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
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
};
