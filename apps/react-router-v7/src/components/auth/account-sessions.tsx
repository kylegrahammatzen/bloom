import { useAuth } from '@bloom/react';
import { useEffect, useState } from 'react';
import type { Session } from '@bloom/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type AccountSessionsProps = {
  onRevokeSuccess?: () => void;
};

export const AccountSessions = (props: AccountSessionsProps) => {
  const { getSessions, revokeSession } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    const response = await getSessions();
    if (response.data?.sessions) {
      setSessions(response.data.sessions);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    const response = await revokeSession(sessionId);
    if (response.data) {
      setSessions(sessions.filter(s => s.id !== sessionId));
      props.onRevokeSuccess?.();
    }
    setRevokingId(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getDeviceDisplay = (session: Session) => {
    if (session.browser || session.os) {
      return `${session.browser || 'Unknown'} on ${session.os || 'Unknown'}`;
    }
    return 'Unknown Device';
  };

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return <div>No active sessions found.</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Active Sessions</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{getDeviceDisplay(session)}</div>
                  <div className="text-sm text-gray-500">{session.deviceType}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{session.ipAddress || 'Unknown'}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{formatDate(session.lastAccessedAt)}</div>
              </TableCell>
              <TableCell>
                {session.isCurrent ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Current
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Active
                  </span>
                )}
              </TableCell>
              <TableCell>
                {!session.isCurrent && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                  >
                    {revokingId === session.id ? 'Revoking...' : 'Revoke'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
