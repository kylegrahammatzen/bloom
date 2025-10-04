import { toNextJsHandler } from '@bloom/adapters/nextjs';
import { auth, connectDB } from '@/lib/auth';

export const { GET, POST, DELETE, OPTIONS } = toNextJsHandler({ auth, connectDB });
