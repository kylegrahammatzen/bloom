import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { EventEmitter } from '@/events/emitter'
import { getCookie } from '@/utils/headers'
import { parseSessionCookie, clearSessionCookie } from '@/utils/cookies'

/**
 * Handle user logout (session termination)
 */
export async function handleLogout(
  ctx: Context,
  adapter: DatabaseAdapter,
  emitter: EventEmitter,
  cookieName: string = 'bloom.sid'
): Promise<Response> {
  // Get session cookie
  const cookieHeader = ctx.headers.get('cookie')
  const cookieValue = cookieHeader
    ? getCookie({ cookie: cookieHeader }, cookieName)
    : null

  if (!cookieValue) {
    return new Response(
      JSON.stringify({ error: 'No active session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Parse session cookie
  const sessionData = parseSessionCookie(cookieValue)
  if (!sessionData) {
    return new Response(
      JSON.stringify({ error: 'Invalid session cookie' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Emit: logout starting
  await emitter.emit('user:logout:before', { sessionId: sessionData.sessionId })

  // Delete session from database
  const deleted = await adapter.session.delete(sessionData.sessionId)

  if (deleted) {
    // Emit: session deleted
    await emitter.emit('session:deleted', { sessionId: sessionData.sessionId })
  }

  // Emit: logout complete
  await emitter.emit('user:logout', { sessionId: sessionData.sessionId })

  // Clear session cookie
  const clearCookie = clearSessionCookie(cookieName)

  return new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie,
      },
    }
  )
}
