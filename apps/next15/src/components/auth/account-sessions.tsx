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

  if (!sessions || sessions.length === 0) {
    return "No active sessions found.";
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead>Status</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
