import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { EventEmitter } from '@/events/emitter'
import { RegisterRequestSchema } from '@/schemas/api'
import { hashPassword, generateSessionId, normalizeEmail } from '@/utils/crypto'
import { createSessionCookie } from '@/utils/cookies'

export type EmailPasswordConfig = {
  enabled?: boolean
  minPasswordLength?: number
  maxPasswordLength?: number
  requireEmailVerification?: boolean
}

export type SessionConfig = {
  expiresIn?: number
}

/**
 * Handle user registration via email/password
 */
export async function handleRegister(
  ctx: Context,
  adapter: DatabaseAdapter,
  emitter: EventEmitter,
  emailPasswordConfig: EmailPasswordConfig = {},
  sessionConfig: SessionConfig = {},
  cookieName: string = 'bloom.sid'
): Promise<Response> {
  // Check if email/password auth is disabled
  if (emailPasswordConfig.enabled === false) {
    return new Response(
      JSON.stringify({ error: 'Email/password registration is disabled' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Parse and validate request body
  const validation = RegisterRequestSchema.safeParse(ctx.body)
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request',
        issues: validation.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { email, password, name } = validation.data

  // Validate password length
  const minLength = emailPasswordConfig.minPasswordLength ?? 8
  const maxLength = emailPasswordConfig.maxPasswordLength ?? 128

  if (password.length < minLength || password.length > maxLength) {
    return new Response(
      JSON.stringify({
        error: 'Invalid password',
        message: `Password must be ${minLength}-${maxLength} characters`,
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Normalize email
  const normalizedEmail = normalizeEmail(email)

  // Emit: registration starting
  await emitter.emit('user:register:before', { email: normalizedEmail })

  // Check if user already exists
  const existingUser = await adapter.user.findByEmail(normalizedEmail)
  if (existingUser) {
    await emitter.emit('user:register:failed', { email: normalizedEmail, reason: 'exists' })
    return new Response(
      JSON.stringify({ error: 'User already exists' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Hash password with Argon2id
  const { hash, salt } = await hashPassword(password)

  // Create user
  const user = await adapter.user.create({
    email: normalizedEmail,
    password_hash: hash,
    password_salt: salt,
    email_verified: !emailPasswordConfig.requireEmailVerification,
    name: name,
  })

  // Emit: user created
  await emitter.emit('user:created', { user })

  // Create session
  const sessionId = generateSessionId()
  const expiresIn = sessionConfig.expiresIn ?? 7 * 24 * 60 * 60 // 7 days default
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  const session = await adapter.session.create({
    id: sessionId,
    userId: user.id,
    expiresAt,
  })

  // Emit: session created
  await emitter.emit('session:created', { session, user })

  // Create session cookie
  const setCookie = createSessionCookie(
    { userId: user.id, sessionId: session.id },
    { cookieName, maxAge: expiresIn }
  )

  // Emit: registration complete
  await emitter.emit('user:register:complete', { user, session })

  return new Response(
    JSON.stringify({
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
    }),
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie,
      },
    }
  )
}
