import { Outlet } from 'react-router'
import { Suspense } from 'react'

export default function Layout() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <Outlet />
    </Suspense>
  )
}
