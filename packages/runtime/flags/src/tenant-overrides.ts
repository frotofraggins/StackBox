/**
 * Tenant Flag Override System
 * Supports per-tenant capability flags with merge order: tenant → global → default
 */

export interface TenantFlagOptions {
  tenantId?: string
  clientId?: string
}

export interface FlagResult {
  value: boolean | string
  source: 'tenant' | 'global' | 'default'
  degraded?: boolean
}

/**
 * Check tenant-specific flags with fallback chain
 * Merge order: tenant → global → default
 */
export function resolveTenantFlag(
  flagKey: string, 
  options: TenantFlagOptions = {}
): FlagResult {
  // 1. Try tenant-specific flag first
  if (options.tenantId) {
    const tenantKey = `${flagKey}:tenant:${options.tenantId}`
    const tenantValue = process.env[tenantKey]
    if (tenantValue !== undefined) {
      return {
        value: tenantValue === 'true' ? true : tenantValue === 'false' ? false : tenantValue,
        source: 'tenant'
      }
    }
  }
  
  // 2. Try global flag
  const globalValue = process.env[flagKey]
  if (globalValue !== undefined) {
    return {
      value: globalValue === 'true' ? true : globalValue === 'false' ? false : globalValue,
      source: 'global'
    }
  }
  
  // 3. Default fallback
  const defaultValue = getDefaultValue(flagKey)
  return {
    value: defaultValue,
    source: 'default'
  }
}

/**
 * Get default values for known flags
 */
function getDefaultValue(flagKey: string): boolean {
  const defaults: Record<string, boolean> = {
    'CAP_MESSAGING_ENABLED': false,
    'CAP_DATALAKE_ENABLED': false,
    'ONBOARDING_V2_ENABLED': false,
    'CAP_AUTH_JWT_ALLOWED': true,
    'CAP_AUTH_IAM_ALLOWED': true
  }
  
  return defaults[flagKey] ?? false
}

/**
 * Batch resolve multiple flags for a tenant
 */
export function resolveTenantFlags(
  flagKeys: string[],
  options: TenantFlagOptions = {}
): Record<string, FlagResult> {
  const results: Record<string, FlagResult> = {}
  
  for (const flagKey of flagKeys) {
    results[flagKey] = resolveTenantFlag(flagKey, options)
  }
  
  return results
}

/**
 * Check if any flags are degraded (future: health check integration)
 */
export function checkFlagHealth(): { degraded: boolean; reason?: string } {
  // Phase 1: Always healthy
  // Future: Check AppConfig/DynamoDB connectivity
  return { degraded: false }
}

/**
 * Get tenant flag statistics for debugging
 */
export function getTenantFlagStats(tenantId?: string): {
  tenantOverrides: number
  globalFlags: number
  defaults: number
} {
  if (!tenantId) {
    return { tenantOverrides: 0, globalFlags: 0, defaults: 0 }
  }
  
  let tenantOverrides = 0
  let globalFlags = 0
  let defaults = 0
  
  // Count environment variables with tenant prefix
  for (const key in process.env) {
    if (key.includes(`:tenant:${tenantId}`)) {
      tenantOverrides++
    } else if (key.startsWith('CAP_') || key.startsWith('ONBOARDING_')) {
      globalFlags++
    }
  }
  
  // Known defaults (flags that would use default if not set)
  const knownFlags = ['CAP_MESSAGING_ENABLED', 'CAP_DATALAKE_ENABLED', 'ONBOARDING_V2_ENABLED']
  defaults = knownFlags.length - tenantOverrides - globalFlags
  
  return { tenantOverrides, globalFlags, defaults }
}
