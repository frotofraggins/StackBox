import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

export type Capability = 'messaging' | 'datalake' | 'ai' | 'billing'
export type Environment = 'sandbox' | 'production'

interface CacheEntry {
  url: string
  expiresAt: number
}

// In-memory cache with 60-second TTL
const cache = new Map<string, CacheEntry>()

let ssmClient: SSMClient | null = null

function initializeSSMClient(region: string = process.env.AWS_REGION || 'us-west-2') {
  if (!ssmClient) {
    ssmClient = new SSMClient({ region })
  }
}

function getCacheKey(capability: Capability, env: Environment): string {
  return `${capability}:${env}`
}

function getCachedUrl(cacheKey: string): string | null {
  const entry = cache.get(cacheKey)
  if (!entry) return null
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey)
    return null
  }
  
  return entry.url
}

function setCachedUrl(cacheKey: string, url: string, ttlMs: number = 60000) {
  cache.set(cacheKey, {
    url,
    expiresAt: Date.now() + ttlMs
  })
}

async function getFromSSM(capability: Capability, env: Environment): Promise<string | null> {
  try {
    initializeSSMClient()
    
    const parameterName = `/stackpro/${env}/capabilities/${capability}/base-url`
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: false
    })
    
    const response = await ssmClient!.send(command)
    return response.Parameter?.Value || null
  } catch (error) {
    console.warn(`SSM lookup failed for ${capability}/${env}:`, error)
    return null
  }
}

/**
 * Resolve the base URL for a capability
 * Resolution order: Cache → Environment Variable → SSM Parameter Store → Fallback
 */
export async function resolveCapabilityUrl(
  capability: Capability,
  env: Environment = 'sandbox'
): Promise<string> {
  const cacheKey = getCacheKey(capability, env)
  
  // 1. Check cache first
  const cachedUrl = getCachedUrl(cacheKey)
  if (cachedUrl) {
    return cachedUrl
  }
  
  let url: string | null = null
  
  // 2. Check environment variable
  const envVarName = `CAP_${capability.toUpperCase()}_BASE_URL`
  url = process.env[envVarName] || null
  
  // 3. Try SSM Parameter Store
  if (!url) {
    url = await getFromSSM(capability, env)
  }
  
  // 4. Fallback to main API
  const finalUrl = url || '/api'
  
  // Cache the result
  setCachedUrl(cacheKey, finalUrl)
  
  return finalUrl
}

/**
 * Clear capability URL cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
