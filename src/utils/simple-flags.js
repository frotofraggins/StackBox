/**
 * Simplified feature flags implementation for Phase 1
 * This will be replaced by @stackpro/flags package once built
 */

// In-memory cache with 60-second TTL
const cache = new Map()

function getCacheKey(flagKey, options = {}) {
  const parts = [flagKey]
  if (options.tenantId) parts.push(`tenant:${options.tenantId}`)
  return parts.join('|')
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
 * Check if a feature flag is enabled
 * Phase 1: Environment variables only
 */
async function isEnabled(flagKey, options = {}) {
  const cacheKey = getCacheKey(flagKey, options)
  
  // Check cache first
  const cachedValue = getCachedValue(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }
  
  // For Phase 1, just check environment variables
  const value = process.env[flagKey] === 'true'
  
  // Cache the result
  setCachedValue(cacheKey, value)
  
  return value
}

/**
 * Get a feature flag variant
 * Phase 1: Environment variables only
 */
async function getVariant(flagKey, options = {}) {
  const variantKey = `${flagKey}_VARIANT`
  const cacheKey = getCacheKey(variantKey, options)
  
  // Check cache first
  const cachedValue = getCachedValue(cacheKey)
  if (cachedValue !== null) {
    return cachedValue
  }
  
  // For Phase 1, just check environment variables
  const value = process.env[variantKey] || 'default'
  
  // Cache the result
  setCachedValue(cacheKey, value)
  
  return value
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  cache.clear()
}

module.exports = {
  isEnabled,
  getVariant,
  clearCache
}
