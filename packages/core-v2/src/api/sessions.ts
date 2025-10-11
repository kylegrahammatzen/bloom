import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { ApiMethodParams, User, Session } from '@/schemas'
import { getCookie } from '@/utils/headers'
import { parseSessionCookie } from '@/utils/cookies'
import { ApiMethodParamsSchema } from '@/schemas'

export type GetSessionParams = {
  params: ApiMethodParams
  adapter: DatabaseAdapter
  cookieName: string
}

export async function getSession(config: GetSessionParams): Promise<{ user: User; session: Session } | null> {
  const validatedParams = ApiMethodParamsSchema.safeParse(config.params)
  if (!validatedParams.success) {
    return null
  }

  const cookieValue = validatedParams.data.headers
    ? getCookie(validatedParams.data.headers as any, config.cookieName)
    : null

  if (!cookieValue) {
    return null
  }

  const sessionData = parseSessionCookie(cookieValue)
  if (!sessionData) {
    return null
  }

  const session = await config.adapter.session.findById(sessionData.sessionId)
  if (!session) {
    return null
  }

  if (session.userId !== sessionData.userId) {
    return null
  }

  const user = await config.adapter.user.findById(session.userId)
  if (!user) {
    return null
  }

  await config.adapter.session.updateLastAccessed(session.id)

  return { user, session }
}

export type GetSessionsParams = {
  ctx: Context
  adapter: DatabaseAdapter
  cookieName: string
}

export async function getSessions(params: GetSessionsParams): Promise<Response> {
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

  const currentSession = await params.adapter.session.findById(sessionData.sessionId)
  if (!currentSession || currentSession.userId !== sessionData.userId) {
    return Response.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  await params.ctx.hooks.before?.()

  const sessions = await params.adapter.session.findByUserId(sessionData.userId)

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      sessions: sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessedAt,
      })),
    },
    { status: 200 }
  )
}

export type DeleteSessionParams = {
  ctx: Context
  adapter: DatabaseAdapter
  cookieName: string
}

export async function deleteSession(params: DeleteSessionParams): Promise<Response> {
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

  const currentSession = await params.adapter.session.findById(sessionData.sessionId)
  if (!currentSession || currentSession.userId !== sessionData.userId) {
    return Response.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  const sessionIdToDelete = params.ctx.params?.id
  if (!sessionIdToDelete) {
    return Response.json(
      { error: 'Session ID required' },
      { status: 400 }
    )
  }

  const sessionToDelete = await params.adapter.session.findById(sessionIdToDelete)
  if (!sessionToDelete || sessionToDelete.userId !== sessionData.userId) {
    return Response.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }

  await params.ctx.hooks.before?.()

  await params.adapter.session.delete(sessionIdToDelete)

  await params.ctx.hooks.after?.()

  return Response.json(
    { success: true, message: 'Session revoked successfully' },
    { status: 200 }
  )
}

export type DeleteAllSessionsParams = {
  ctx: Context
  adapter: DatabaseAdapter
  cookieName: string
}

export async function deleteAllSessions(params: DeleteAllSessionsParams): Promise<Response> {
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

  const currentSession = await params.adapter.session.findById(sessionData.sessionId)
  if (!currentSession || currentSession.userId !== sessionData.userId) {
    return Response.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }

  const allSessions = await params.adapter.session.findByUserId(sessionData.userId)
  const sessionsToDelete = allSessions.filter((s) => s.id !== sessionData.sessionId)

  await params.ctx.hooks.before?.()

  let count = 0
  for (const session of sessionsToDelete) {
    const deleted = await params.adapter.session.delete(session.id)
    if (deleted) count++
  }

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      success: true,
      message: `${count} session(s) revoked successfully`,
      count,
    },
    { status: 200 }
  )
}
