import { createAuthHandler } from '@bloom/adapters/nextjs';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';

const handler = createAuthHandler({ auth, connectDB });

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
export const OPTIONS = handler.OPTIONS;
