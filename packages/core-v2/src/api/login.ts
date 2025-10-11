import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import { LoginRequestSchema } from '@/schemas/api'
import { verifyPassword, generateSessionId, normalizeEmail } from '@/utils/crypto'
import { createSessionCookie } from '@/utils/cookies'
import { DEFAULT_SESSION_EXPIRY } from '@/constants'
import type { SessionConfig } from './register'

export type LoginParams = {
  ctx: Context
  adapter: DatabaseAdapter
  sessionConfig: SessionConfig
  cookieName: string
}

export async function login(params: LoginParams): Promise<Response> {
  const validation = LoginRequestSchema.safeParse(params.ctx.body)
  if (!validation.success) {
    return Response.json(
      {
        error: 'Invalid request',
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    )
  }

  const { email, password } = validation.data

  await params.ctx.hooks.before?.()

  const normalizedEmail = normalizeEmail(email)

  const user = await params.adapter.user.findByEmail(normalizedEmail)
  if (!user) {
    return Response.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const userWithPassword = user as typeof user & { password_hash: string; password_salt: string }

  if (!userWithPassword.password_hash || !userWithPassword.password_salt) {
    return Response.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const isValid = await verifyPassword(
    password,
    userWithPassword.password_hash,
    userWithPassword.password_salt
  )

  if (!isValid) {
    return Response.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }

  const sessionId = generateSessionId()
  const expiresIn = params.sessionConfig.expiresIn ?? DEFAULT_SESSION_EXPIRY
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  const session = await params.adapter.session.create({
    id: sessionId,
    userId: user.id,
    expiresAt,
  })

  const setCookie = createSessionCookie(
    { userId: user.id, sessionId: session.id },
    { cookieName: params.cookieName, maxAge: expiresIn }
  )

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    },
    {
      status: 200,
      headers: {
        'Set-Cookie': setCookie,
      },
    }
  )
}
