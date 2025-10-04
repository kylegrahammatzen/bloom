import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Session } from '@bloom/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionRevokeButton } from './session-revoke-button';

export const AccountSessions = async () => {
  const headersList = await headers();

  const sessions = await auth.api.sessions.getAll({
    headers: Object.fromEntries(headersList.entries())
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getDeviceDisplay = (session: Session) => {
    if (session.browser || session.os) {
      return `${session.browser || 'Unknown'} on ${session.os || 'Unknown'}`;
    }
    return 'Unknown Device';
  };

  const formatLocation = (ipAddress?: string) => {
    if (!ipAddress) return 'Unknown';
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') return 'localhost';
    return ipAddress;
  };

  if (!sessions || sessions.length === 0) {
    return "No active sessions found.";
  }

  return (
    <div className="max-w-3xl">
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session: Session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{getDeviceDisplay(session)}</div>
                    <div className="text-sm text-gray-500">{session.deviceType}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatLocation(session.ipAddress)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(session.lastAccessedAt)}</div>
                </TableCell>
                <TableCell>
                  {session.isCurrent ? (
                    <Badge variant="secondary">Current</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <SessionRevokeButton sessionId={session.id} isCurrent={session.isCurrent || false} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
