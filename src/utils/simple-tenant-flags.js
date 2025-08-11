/**
 * Simplified tenant flag override system for Phase 2
 * Supports per-tenant capability flags with merge order: tenant → global → default
 */

// In-memory cache with 60-second TTL
const cache = new Map()

function getCacheKey(flagKey, tenantId) {
  return tenantId ? `${flagKey}:${tenantId}` : flagKey
}

function getCachedValue(cacheKey) {
  const entry = cache.get(cacheKey)
  if (!entry) return null
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey)
    return null
  }
  
  return entry.value
}

function setCachedValue(cacheKey, value, ttlMs = 60000) {
  cache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Resolve tenant-specific flags with fallback chain
 * @param {string} flagKey - The flag key to resolve
 * @param {object} options - Options with tenantId, clientId
 * @returns {object} - { value, source }
 */
function resolveTenantFlag(flagKey, options = {}) {
  const { tenantId } = options
  const cacheKey = getCacheKey(flagKey, tenantId)
  
  // 1. Check cache first
  const cachedValue = getCachedValue(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }
  
  let result = null
  
  // 2. Try tenant-specific flag first
  if (tenantId) {
    const tenantKey = `${flagKey}:tenant:${tenantId}`
    const tenantValue = process.env[tenantKey]
    if (tenantValue !== undefined) {
      result = {
        value: tenantValue === 'true',
        source: 'tenant'
      }
    }
  }
  
  // 3. Try global flag
  if (!result) {
    const globalValue = process.env[flagKey]
    if (globalValue !== undefined) {
      result = {
        value: globalValue === 'true',
        source: 'global'
      }
    }
  }
  
  // 4. Default fallback
  if (!result) {
    const defaultValue = getDefaultValue(flagKey)
    result = {
      value: defaultValue,
      source: 'default'
    }
  }
  
  // Cache the result
  setCachedValue(cacheKey, result)
  
  return result
}

/**
 * Get default values for known flags
 */
function getDefaultValue(flagKey) {
  const defaults = {
    'CAP_MESSAGING_ENABLED': false,
    'CAP_DATALAKE_ENABLED': false,
    'CAP_DATA_INGESTION_ENABLED': false,
    'ONBOARDING_V2_ENABLED': false,
    'CAP_AUTH_JWT_ALLOWED': true,
    'CAP_AUTH_IAM_ALLOWED': true
  }
  
  return defaults[flagKey] ?? false
}

/**
 * Check if flag is enabled (simplified interface)
 */
async function isEnabled(flagKey, options = {}) {
  const result = resolveTenantFlag(flagKey, options)
  return result.value
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  cache.clear()
}

module.exports = {
  resolveTenantFlag,
  isEnabled,
  clearCache
}
