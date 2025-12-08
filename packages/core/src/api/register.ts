import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import { RegisterRequestSchema } from '@/schemas/api'
import { hashPassword, generateSessionId, normalizeEmail } from '@/utils/crypto'
import { createSessionCookie } from '@/utils/cookies'
import { DEFAULT_SESSION_EXPIRY, DEFAULT_MIN_PASSWORD_LENGTH, DEFAULT_MAX_PASSWORD_LENGTH } from '@/constants'

export type EmailPasswordConfig = {
  minPasswordLength?: number
  maxPasswordLength?: number
  requireEmailVerification?: boolean
}

export type SessionConfig = {
  expiresIn?: number
}

export type RegisterParams = {
  ctx: Context
  adapter: DatabaseAdapter
  emailPasswordConfig: EmailPasswordConfig
  sessionConfig: SessionConfig
  cookieName: string
}

export async function register(params: RegisterParams): Promise<Response> {
  const validation = RegisterRequestSchema.safeParse(params.ctx.body)
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

  const { email, password, name } = validation.data

  const minLength = params.emailPasswordConfig.minPasswordLength ?? DEFAULT_MIN_PASSWORD_LENGTH
  const maxLength = params.emailPasswordConfig.maxPasswordLength ?? DEFAULT_MAX_PASSWORD_LENGTH

  if (password.length < minLength || password.length > maxLength) {
    return Response.json(
      {
        error: 'Invalid password',
        message: `Password must be ${minLength}-${maxLength} characters`,
      },
      { status: 400 }
    )
  }

  await params.ctx.hooks.before?.()

  const normalizedEmail = normalizeEmail(email)

  const existingUser = await params.adapter.user.findByEmail(normalizedEmail)
  if (existingUser) {
    return Response.json(
      { error: 'User already exists' },
      { status: 409 }
    )
  }

  const { hash, salt } = await hashPassword(password)

  const user = await params.adapter.user.create({
    email: normalizedEmail,
    password_hash: hash,
    password_salt: salt,
    email_verified: !params.emailPasswordConfig.requireEmailVerification,
    name: name,
  })

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
      status: 201,
      headers: {
        'Set-Cookie': setCookie,
      },
    }
  )
}
