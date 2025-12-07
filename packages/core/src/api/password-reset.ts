import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import type { EmailPasswordConfig } from './register'
import { RequestPasswordResetSchema, ResetPasswordSchema } from '@/schemas/api'
import { generateSessionId, normalizeEmail, hashPassword } from '@/utils/crypto'
import { DEFAULT_MIN_PASSWORD_LENGTH, DEFAULT_MAX_PASSWORD_LENGTH } from '@/constants'

const TOKEN_EXPIRY_HOURS = 1

export type RequestPasswordResetParams = {
  ctx: Context
  adapter: DatabaseAdapter
}

export async function requestPasswordReset(params: RequestPasswordResetParams): Promise<Response> {
  const validation = RequestPasswordResetSchema.safeParse(params.ctx.body)
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

  const { email } = validation.data
  const normalizedEmail = normalizeEmail(email)

  const user = await params.adapter.user.findByEmail(normalizedEmail)
  if (!user) {
    return Response.json(
      { success: true, message: 'If the email exists, a password reset link will be sent' },
      { status: 200 }
    )
  }

  await params.ctx.hooks.before?.()

  const token = generateSessionId()
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await params.adapter.user.update(user.id, {
    password_reset_token: token,
    password_reset_expires: expires,
  })

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      success: true,
      message: 'If the email exists, a password reset link will be sent',
    },
    { status: 200 }
  )
}

export type ResetPasswordParams = {
  ctx: Context
  adapter: DatabaseAdapter
  emailPasswordConfig: EmailPasswordConfig
}

export async function resetPassword(params: ResetPasswordParams): Promise<Response> {
  const validation = ResetPasswordSchema.safeParse(params.ctx.body)
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

  const { token, password } = validation.data

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

  const user = await params.adapter.user.findByPasswordResetToken(token)
  if (!user) {
    return Response.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    )
  }

  if (user.password_reset_expires && user.password_reset_expires < new Date()) {
    return Response.json(
      { error: 'Reset token has expired' },
      { status: 400 }
    )
  }

  await params.ctx.hooks.before?.()

  const { hash, salt } = await hashPassword(password)

  await params.adapter.user.update(user.id, {
    password_hash: hash,
    password_salt: salt,
    password_reset_token: undefined,
    password_reset_expires: undefined,
  })

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      success: true,
      message: 'Password reset successfully',
    },
    { status: 200 }
  )
}
