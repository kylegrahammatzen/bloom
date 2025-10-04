import { toNextJsHandler } from '@bloom/adapters/nextjs';
import { auth } from '@/lib/auth';

export const { GET, POST, DELETE, OPTIONS } = toNextJsHandler({ auth });