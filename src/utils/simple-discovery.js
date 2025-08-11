/**
 * Simplified service discovery implementation for Phase 1
 * This will be replaced by @stackpro/discovery package once built
 */

// In-memory cache with 60-second TTL
const cache = new Map()

function getCacheKey(capability, env) {
  return `${capability}:${env}`
}

function getCachedUrl(cacheKey) {
  const entry = cache.get(cacheKey)
  if (!entry) return null
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey)
    return null
  }
  
  return entry.url
}

function setCachedUrl(cacheKey, url, ttlMs = 60000) {
  cache.set(cacheKey, {
    url,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Resolve the base URL for a capability
 * Phase 1: Environment variables only
 */
async function resolveCapabilityUrl(capability, env = 'sandbox') {
  const cacheKey = getCacheKey(capability, env)
  
  // 1. Check cache first
  const cachedUrl = getCachedUrl(cacheKey)
  if (cachedUrl) {
    return cachedUrl
  }
  
  // 2. Check environment variable
  const envVarName = `CAP_${capability.toUpperCase()}_BASE_URL`
  const url = process.env[envVarName] || '/api'
  
  // Cache the result
  setCachedUrl(cacheKey, url)
  
  return url
}

/**
 * Clear cache (useful for testing)
 */
function clearCache() {
  cache.clear()
}

module.exports = {
  resolveCapabilityUrl,
  clearCache
}
