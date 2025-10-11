import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import { getCookie } from '@/utils/headers'
import { parseSessionCookie, clearSessionCookie } from '@/utils/cookies'

export type LogoutParams = {
  ctx: Context
  adapter: DatabaseAdapter
  cookieName: string
}

export async function logout(params: LogoutParams): Promise<Response> {
  const cookieHeader = params.ctx.headers.get('cookie')
  const cookieValue = cookieHeader
    ? getCookie({ cookie: cookieHeader }, params.cookieName)
    : null

  if (!cookieValue) {
    return Response.json(
      { error: 'No active session' },
      { status: 401 }
    )
  }

  const sessionData = parseSessionCookie(cookieValue)
  if (!sessionData) {
    return Response.json(
      { error: 'Invalid session cookie' },
      { status: 401 }
    )
  }

  await params.ctx.hooks.before?.()

  await params.adapter.session.delete(sessionData.sessionId)

  const clearCookie = clearSessionCookie(params.cookieName)

  await params.ctx.hooks.after?.()

  return Response.json(
    { success: true, message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Set-Cookie': clearCookie,
      },
    }
  )
}
