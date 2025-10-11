/**
 * Event handler function
 *
 * Can return any value, but the EventEmitter ignores return values.
 * This allows hooks to return Response objects for request short-circuiting
 * while other events can return void.
 */
export type EventHandler<T = any, R = any> = (data: T) => R | Promise<R>

export class EventEmitter {
  private listeners: Map<string, Set<EventHandler>>

  constructor() {
    this.listeners = new Map()
  }

  /**
   * Register an event listener
   * Supports wildcard patterns: 'user:*', '*:created', '*'
   */
  on(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event) ?? new Set()
    handlers.add(handler)
    this.listeners.set(event, handlers)
  }

  /**
   * Remove an event listener
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (!handlers?.delete(handler)) return
    if (handlers.size === 0) this.listeners.delete(event)
  }

  /**
   * Emit an event to all matching listeners
   * Supports wildcard matching
   */
  async emit(event: string, data?: any): Promise<void> {
    const handlers: EventHandler[] = []

    for (const [pattern, patternHandlers] of this.listeners) {
      if (pattern === event || this.matchesPattern(event, pattern)) {
        handlers.push(...patternHandlers)
      }
    }

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(data)
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error)
        }
      })
    )
  }

  /**
   * Get all registered event names
   */
  list(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * Get all listeners for a specific event
   */
  getListeners(event: string): EventHandler[] {
    const handlers = this.listeners.get(event)
    return handlers ? Array.from(handlers) : []
  }

  /**
   * Check if an event matches a wildcard pattern
   * Supports: 'user:*', '*:created', '*'
   */
  private matchesPattern(event: string, pattern: string): boolean {
    if (pattern === '*') return true

    const eventParts = event.split(':')
    const patternParts = pattern.split(':')

    if (eventParts.length !== patternParts.length) return false

    return patternParts.every((part, i) => part === '*' || part === eventParts[i])
  }
}
