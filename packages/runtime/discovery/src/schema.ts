/**
 * Discovery Service Schema & Types
 * Enhanced capability discovery with health status and degraded mode
 */

export interface CapabilityDefinition {
  id: string
  version: string
  enabled: boolean
  degraded: boolean
  baseUrl: string | null
  scopes: string[]
  health: 'healthy' | 'degraded' | 'unknown' | 'error'
  sdk?: {
    npm: string
    version: string
  }
  contract?: string
  description?: string
}

export interface CapabilityRegistry {
  env: 'sandbox' | 'production'
  version: string
  capabilities: CapabilityDefinition[]
  metadata?: {
    requestId?: string
    timestamp: string
    degraded: boolean
  }
}

export interface HealthCheckResult {
  healthy: boolean
  degraded: boolean
  reason?: string
  lastCheck?: string
}

/**
 * Validate capability definition structure
 */
export function validateCapability(capability: any): capability is CapabilityDefinition {
  return (
    typeof capability === 'object' &&
    typeof capability.id === 'string' &&
    typeof capability.version === 'string' &&
    typeof capability.enabled === 'boolean' &&
    typeof capability.degraded === 'boolean' &&
    (capability.baseUrl === null || typeof capability.baseUrl === 'string') &&
    Array.isArray(capability.scopes) &&
    ['healthy', 'degraded', 'unknown', 'error'].includes(capability.health)
  )
}

/**
 * Create capability definition with defaults
 */
export function createCapabilityDefinition(
  id: string,
  overrides: Partial<CapabilityDefinition> = {}
): CapabilityDefinition {
  return {
    id,
    version: '1.0.0',
    enabled: false,
    degraded: false,
    baseUrl: null,
    scopes: ['read'],
    health: 'unknown',
    ...overrides
  }
}

/**
 * Health check status enumeration
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded', 
  UNKNOWN = 'unknown',
  ERROR = 'error'
}

/**
 * Capability scopes enumeration
 */
export enum CapabilityScope {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  INGEST = 'ingest',
  QUERY = 'query'
}

/**
 * Environment enumeration
 */
export enum Environment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production'
}
