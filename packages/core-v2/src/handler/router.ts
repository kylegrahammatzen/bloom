import type { Context } from '@/handler/context'

export type RouteHandler = (ctx: Context) => Promise<Response>

export type RouteDefinition = {
  path: string
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'OPTIONS'
  handler: RouteHandler
}

export type RouteMatch = {
  handler: RouteHandler
  params: Record<string, string>
}

export class Router {
  private routes: RouteDefinition[] = []

  /**
   * Register a route
   */
  register(route: RouteDefinition): void {
    this.routes.push(route)
  }

  /**
   * Match a path and method to a route
   * Returns handler and extracted params if found
   */
  match(path: string, method: string): RouteMatch | null {
    for (const route of this.routes) {
      if (route.method !== method) continue

      const params = this.matchPath(route.path, path)
      if (params !== null) {
        return {
          handler: route.handler,
          params,
        }
      }
    }

    return null
  }

  /**
   * List all registered routes
   */
  list(): RouteDefinition[] {
    return [...this.routes]
  }

  /**
   * Match a route pattern against a path
   * Returns params object if match, null if no match
   *
   * Examples:
   * - /auth/session matches /auth/session → {}
   * - /auth/sessions/:id matches /auth/sessions/123 → { id: '123' }
   * - /auth/* matches /auth/anything → {}
   */
  private matchPath(pattern: string, path: string): Record<string, string> | null {
    const patternParts = pattern.split('/').filter(Boolean)
    const pathParts = path.split('/').filter(Boolean)

    // Exact length match unless pattern ends with wildcard
    const hasWildcard = patternParts[patternParts.length - 1] === '*'
    if (!hasWildcard && patternParts.length !== pathParts.length) {
      return null
    }

    const params: Record<string, string> = {}

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]
      const pathPart = pathParts[i]

      // Wildcard matches anything
      if (patternPart === '*') {
        return params
      }

      // Dynamic param (:id, :name, etc)
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1)
        params[paramName] = pathPart
        continue
      }

      // Exact match required
      if (patternPart !== pathPart) {
        return null
      }
    }

    return params
  }
}
