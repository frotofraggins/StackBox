interface TelemetryEvent {
  eventName: string
  payload: Record<string, any>
  timestamp: string
  sessionId: string
  userAgent?: string
  path?: string
}

class TelemetryClient {
  private sessionId: string
  private isEnabled: boolean
  private isDebugMode: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = this.checkIfEnabled()
    this.isDebugMode = process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === 'true'
    
    if (this.isDebugMode) {
      console.log('[Telemetry] Initialized:', { enabled: this.isEnabled, sessionId: this.sessionId })
    }
  }

  private checkIfEnabled(): boolean {
    // Only enable in sandbox environment with explicit flag
    const envCheck = typeof window !== 'undefined' && 
                    (process.env.NEXT_PUBLIC_ENV === 'sandbox' || 
                     process.env.NODE_ENV === 'development')
    
    const flagCheck = process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === 'true'
    
    return envCheck && flagCheck
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sanitizePayload(payload: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    // Only allow safe, generic metadata
    const allowedKeys = [
      'action', 'step', 'category', 'label', 'value', 'duration',
      'error_type', 'component', 'feature', 'status', 'count',
      'source', 'target', 'method', 'path', 'referrer'
    ]

    Object.keys(payload).forEach(key => {
      if (allowedKeys.includes(key)) {
        const value = payload[key]
        
        // Sanitize values - no PII, no secrets
        if (typeof value === 'string') {
          // Remove potential PII patterns
          sanitized[key] = value
            .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[email]') // emails
            .replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, '[card]') // credit cards
            .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]') // SSN
            .slice(0, 100) // truncate long strings
        } else if (typeof value === 'number' && value >= 0) {
          sanitized[key] = value
        } else if (typeof value === 'boolean') {
          sanitized[key] = value
        }
      }
    })

    return sanitized
  }

  track(eventName: string, payload: Record<string, any> = {}): void {
    if (!this.isEnabled) {
      return
    }

    try {
      const event: TelemetryEvent = {
        eventName: eventName.slice(0, 50), // limit event name length
        payload: this.sanitizePayload(payload),
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userAgent: typeof window !== 'undefined' ? 
                   window.navigator.userAgent.slice(0, 200) : undefined,
        path: typeof window !== 'undefined' ? 
              window.location.pathname : undefined
      }

      if (this.isDebugMode) {
        console.log('[Telemetry] Event:', event)
      }

      this.sendEvent(event)
    } catch (error) {
      if (this.isDebugMode) {
        console.warn('[Telemetry] Failed to track event:', error)
      }
    }
  }

  private async sendEvent(event: TelemetryEvent): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    try {
      // Try sendBeacon first (fire-and-forget, works on page unload)
      if (navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          '/api/audit',
          JSON.stringify(event)
        )
        
        if (success) {
          return
        }
      }

      // Fallback to fetch with no-cors to avoid blocking
      fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        keepalive: true, // Allow request to complete even if page closes
        mode: 'same-origin'
      }).catch(() => {
        // Silently fail - telemetry should never break the app
        if (this.isDebugMode) {
          console.warn('[Telemetry] Failed to send event via fetch')
        }
      })
    } catch (error) {
      // Silently fail - telemetry should never break the app
      if (this.isDebugMode) {
        console.warn('[Telemetry] Failed to send event:', error)
      }
    }
  }

  // Helper methods for common events
  trackPageView(path?: string): void {
    this.track('page_view', {
      path: path || (typeof window !== 'undefined' ? window.location.pathname : ''),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    })
  }

  trackUserAction(action: string, details: Record<string, any> = {}): void {
    this.track('user_action', {
      action,
      ...details
    })
  }

  trackError(error: Error | string, context: Record<string, any> = {}): void {
    this.track('error', {
      error_type: typeof error === 'string' ? 'custom' : error.name,
      message: typeof error === 'string' ? error : error.message,
      ...context
    })
  }

  trackPerformance(metric: string, duration: number, details: Record<string, any> = {}): void {
    this.track('performance', {
      metric,
      duration: Math.round(duration),
      ...details
    })
  }
}

// Global instance
let telemetryInstance: TelemetryClient | null = null

function getTelemetryClient(): TelemetryClient {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryClient()
  }
  return telemetryInstance
}

// Export convenience functions
export function track(eventName: string, payload: Record<string, any> = {}): void {
  getTelemetryClient().track(eventName, payload)
}

export function trackPageView(path?: string): void {
  getTelemetryClient().trackPageView(path)
}

export function trackUserAction(action: string, details: Record<string, any> = {}): void {
  getTelemetryClient().trackUserAction(action, details)
}

export function trackError(error: Error | string, context: Record<string, any> = {}): void {
  getTelemetryClient().trackError(error, context)
}

export function trackPerformance(metric: string, duration: number, details: Record<string, any> = {}): void {
  getTelemetryClient().trackPerformance(metric, duration, details)
}

// Export client for advanced usage
export { TelemetryClient }
