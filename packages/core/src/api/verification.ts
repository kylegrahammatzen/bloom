import type { Context } from '@/handler/context'
import type { DatabaseAdapter } from '@/storage/adapter'
import { SendVerificationEmailRequestSchema, VerifyEmailRequestSchema } from '@/schemas/api'
import { generateSessionId, normalizeEmail } from '@/utils/crypto'

const TOKEN_EXPIRY_HOURS = 24

export type SendVerificationEmailParams = {
  ctx: Context
  adapter: DatabaseAdapter
}

export async function sendVerificationEmail(params: SendVerificationEmailParams): Promise<Response> {
  const validation = SendVerificationEmailRequestSchema.safeParse(params.ctx.body)
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
      { error: 'User not found' },
      { status: 404 }
    )
  }

  if (user.email_verified) {
    return Response.json(
      { error: 'Email already verified' },
      { status: 400 }
    )
  }

  await params.ctx.hooks.before?.()

  const token = generateSessionId()
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await params.adapter.user.update(user.id, {
    email_verification_token: token,
    email_verification_expires: expires,
  })

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      success: true,
      message: 'Verification email sent',
    },
    { status: 200 }
  )
}

export type VerifyEmailParams = {
  ctx: Context
  adapter: DatabaseAdapter
}

export async function verifyEmail(params: VerifyEmailParams): Promise<Response> {
  const validation = VerifyEmailRequestSchema.safeParse(params.ctx.body)
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

  const { token } = validation.data

  const user = await params.adapter.user.findByEmailVerificationToken(token)
  if (!user) {
    return Response.json(
      { error: 'Invalid or expired verification token' },
      { status: 400 }
    )
  }

  if (user.email_verification_expires && user.email_verification_expires < new Date()) {
    return Response.json(
      { error: 'Verification token has expired' },
      { status: 400 }
    )
  }

  if (user.email_verified) {
    return Response.json(
      { error: 'Email already verified' },
      { status: 400 }
    )
  }

  await params.ctx.hooks.before?.()

  await params.adapter.user.update(user.id, {
    email_verified: true,
    email_verification_token: undefined,
    email_verification_expires: undefined,
  })

  await params.ctx.hooks.after?.()

  return Response.json(
    {
      success: true,
      message: 'Email verified successfully',
    },
    { status: 200 }
  )
}
