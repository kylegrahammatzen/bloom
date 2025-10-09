import { z } from 'zod'

/**
 * User schema with Zod v4 validation and metadata
 */
export const UserSchema = z.object({
  id: z.string().meta({
    id: 'user_id',
    title: 'User ID',
    description: 'Unique identifier for the user',
  }),
  email: z.string().email().meta({
    id: 'user_email',
    title: 'Email Address',
    description: 'User email address (must be valid email format)',
  }),
  email_verified: z.boolean().meta({
    id: 'email_verified',
    title: 'Email Verified',
    description: 'Whether the user has verified their email address',
  }),
  name: z.string().optional().meta({
    id: 'user_name',
    title: 'Display Name',
    description: 'Optional display name for the user',
  }),
  image: z.string().url().optional().meta({
    id: 'user_image',
    title: 'Profile Image',
    description: 'Optional URL to user profile image',
  }),
  created_at: z.date().meta({
    id: 'created_at',
    title: 'Created At',
    description: 'Timestamp when the user account was created',
  }),
  updated_at: z.date().meta({
    id: 'updated_at',
    title: 'Updated At',
    description: 'Timestamp when the user account was last updated',
  }),
  last_login: z.date().optional().meta({
    id: 'last_login',
    title: 'Last Login',
    description: 'Timestamp of the user\'s last login',
  }),
})

/**
 * Inferred TypeScript type from UserSchema
 */
export type User = z.infer<typeof UserSchema>
