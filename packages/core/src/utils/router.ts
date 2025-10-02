/**
 * Simple router implementation to replace rou3 for CommonJS compatibility
 */

type Route = {
  method: string;
  path: string;
  handler: any;
};

type Router = {
  routes: Route[];
};

export function createRouter(): Router {
  return {
    routes: []
  };
}

export function addRoute(router: Router, method: string, path: string, handler: any): void {
  router.routes.push({ method, path, handler });
}

export function findRoute(router: Router, method: string, path: string): { data: any } | null {
  // Normalize path - remove trailing slash
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

  const route = router.routes.find(r => {
    const routePath = r.path.endsWith('/') && r.path.length > 1 ? r.path.slice(0, -1) : r.path;
    return r.method === method && routePath === normalizedPath;
  });

  if (!route) {
    return null;
  }

  return {
    data: route.handler
  };
}
