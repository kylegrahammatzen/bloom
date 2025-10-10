import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { EventEmitter } from '@/events/emitter'
import { LoginRequestSchema } from '@/schemas/api'
import { verifyPassword, generateSessionId, normalizeEmail } from '@/utils/crypto'
import { createSessionCookie } from '@/utils/cookies'
import type { EmailPasswordConfig, SessionConfig } from './register'

/**
 * Handle user login via email/password
 */
export async function handleLogin(
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
      JSON.stringify({ error: 'Email/password login is disabled' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Parse and validate request body
  const validation = LoginRequestSchema.safeParse(ctx.body)
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

  const { email, password } = validation.data

  // Normalize email
  const normalizedEmail = normalizeEmail(email)

  // Emit: login attempt starting
  await emitter.emit('user:login:before', { email: normalizedEmail })

  // Find user by email
  const user = await adapter.user.findByEmail(normalizedEmail)
  if (!user) {
    await emitter.emit('user:login:failed', { email: normalizedEmail, reason: 'user_not_found' })
    return new Response(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Verify password (assuming password_hash and password_salt exist on user)
  const userWithPassword = user as typeof user & { password_hash: string; password_salt: string }

  if (!userWithPassword.password_hash || !userWithPassword.password_salt) {
    await emitter.emit('user:login:failed', { email: normalizedEmail, reason: 'no_password' })
    return new Response(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const isValid = await verifyPassword(
    password,
    userWithPassword.password_hash,
    userWithPassword.password_salt
  )

  if (!isValid) {
    await emitter.emit('user:login:failed', { email: normalizedEmail, reason: 'invalid_password' })
    return new Response(
      JSON.stringify({ error: 'Invalid email or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Emit: login successful
  await emitter.emit('user:login:success', { user })

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

  // Emit: login complete
  await emitter.emit('user:login:complete', { user, session })

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
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie,
      },
    }
  )
}
