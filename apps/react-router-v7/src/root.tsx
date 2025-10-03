import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { BloomProvider } from '@bloom/react'
import { config } from './config'
import { ToastProvider } from '@/components/ui/toast'
import './styles/index.css'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Meta />
        <Links />
      </head>
      <body>
        <ToastProvider>
          <div className="root">{children}</div>
        </ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <BloomProvider baseURL={config.apiUrl}>
      <Outlet />
    </BloomProvider>
  )
}
