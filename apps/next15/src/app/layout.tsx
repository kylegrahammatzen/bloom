import type { Metadata } from 'next';
import { BloomProvider } from '@bloom/react';
import { ToastProvider } from '@/components/ui/toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bloom - Next.js 15',
  description: 'Authentication with Bloom in Next.js 15',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="root">
            <BloomProvider baseURL="">
              {props.children}
            </BloomProvider>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
