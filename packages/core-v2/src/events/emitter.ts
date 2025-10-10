export type EventHandler<T = any> = (data: T) => void | Promise<void>

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
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
  }

  /**
   * Remove an event listener
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event to all matching listeners
   * Supports wildcard matching
   */
  async emit(event: string, data?: any): Promise<void> {
    const handlers: EventHandler[] = []

    // Exact match
    const exactHandlers = this.listeners.get(event)
    if (exactHandlers) {
      handlers.push(...exactHandlers)
    }

    // Wildcard matches
    for (const [pattern, patternHandlers] of this.listeners.entries()) {
      if (pattern === event) continue // Already handled

      if (this.matchesPattern(event, pattern)) {
        handlers.push(...patternHandlers)
      }
    }

    // Execute all handlers
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(data)
        } catch (error) {
          // Log error but don't crash
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

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '*' && patternParts[i] !== eventParts[i]) {
        return false
      }
    }

    return true
  }
}
