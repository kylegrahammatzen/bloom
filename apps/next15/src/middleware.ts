import { bloomMiddleware, config as bloomConfig } from '@bloom/adapters/nextjs';

export default bloomMiddleware({
  publicRoutes: ['/'],
  protectedRoutes: ['/dashboard'],
  apiRoutePrefix: '/api/auth',
});

export const config = bloomConfig;
