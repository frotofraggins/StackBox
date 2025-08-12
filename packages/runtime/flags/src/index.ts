import { AppConfigDataClient, GetLatestConfigurationCommand } from '@aws-sdk/client-appconfigdata'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

export interface FlagOptions {
  tenantId?: string
  clientId?: string
}

export interface FlagConfig {
  appConfigApplication?: string
  appConfigEnvironment?: string
  appConfigConfiguration?: string
  dynamoTableName?: string
  cacheTimeoutMs?: number
  region?: string
}

interface CacheEntry {
  value: boolean | string
  expiresAt: number
}

// In-memory cache with 60-second TTL
const cache = new Map<string, CacheEntry>()

let appConfigClient: AppConfigDataClient | null = null
let dynamoClient: DynamoDBDocumentClient | null = null

const defaultConfig: FlagConfig = {
  appConfigApplication: process.env.APPCONFIG_APPLICATION || 'stackpro',
  appConfigEnvironment: process.env.APPCONFIG_ENVIRONMENT || 'sandbox',
  appConfigConfiguration: process.env.APPCONFIG_CONFIGURATION || 'feature-flags',
  dynamoTableName: process.env.FLAGS_DYNAMO_TABLE || 'stackpro-flags',
  cacheTimeoutMs: 60000, // 60 seconds
  region: process.env.AWS_REGION || 'us-west-2'
}

function initializeClients(config: FlagConfig = defaultConfig) {
  if (!appConfigClient) {
    appConfigClient = new AppConfigDataClient({ region: config.region })
  }
  if (!dynamoClient) {
    const client = new DynamoDBClient({ region: config.region })
    dynamoClient = DynamoDBDocumentClient.from(client)
  }
}

function getCacheKey(flagKey: string, options?: FlagOptions): string {
  const parts = [flagKey]
  if (options?.tenantId) parts.push(`tenant:${options.tenantId}`)
  if (options?.clientId) parts.push(`client:${options.clientId}`)
  return parts.join('|')
}

function getCachedValue(cacheKey: string): boolean | string | null {
  const entry = cache.get(cacheKey)
  if (!entry) return null
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey)
    return null
  }
  
  return entry.value
}

function setCachedValue(cacheKey: string, value: boolean | string, ttlMs: number = defaultConfig.cacheTimeoutMs!) {
  cache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

async function getFromAppConfig(flagKey: string, config: FlagConfig): Promise<string | null> {
  try {
    initializeClients(config)
    
    const command = new GetLatestConfigurationCommand({
      ConfigurationToken: `stackpro-flags-${Date.now()}`
    })
    
    const response = await appConfigClient!.send(command)
    
    if (response.Configuration) {
      const decoder = new TextDecoder()
      const configJson = JSON.parse(decoder.decode(response.Configuration))
      return configJson[flagKey] || null
    }
  } catch (error) {
    console.warn(`AppConfig lookup failed for ${flagKey}:`, error)
  }
  
  return null
}

async function getFromDynamoDB(flagKey: string, options: FlagOptions, config: FlagConfig): Promise<string | null> {
  try {
    initializeClients(config)
    
    // Try tenant-specific flag first
    if (options.tenantId) {
      const tenantKey = `${flagKey}:tenant:${options.tenantId}`
      const tenantCommand = new GetCommand({
        TableName: config.dynamoTableName,
        Key: { flagKey: tenantKey }
      })
      
      const tenantResponse = await dynamoClient!.send(tenantCommand)
      if (tenantResponse.Item?.value !== undefined) {
        return tenantResponse.Item.value
      }
    }
    
    // Fallback to global flag
    const globalCommand = new GetCommand({
      TableName: config.dynamoTableName,
      Key: { flagKey }
    })
    
    const globalResponse = await dynamoClient!.send(globalCommand)
    if (globalResponse.Item?.value !== undefined) {
      return globalResponse.Item.value
    }
  } catch (error) {
    console.warn(`DynamoDB lookup failed for ${flagKey}:`, error)
  }
  
  return null
}

/**
 * Check if a feature flag is enabled
 * Resolution order: Cache → AppConfig → DynamoDB → Environment Variables
 */
export async function isEnabled(
  flagKey: string, 
  options: FlagOptions = {},
  config: FlagConfig = defaultConfig
): Promise<boolean> {
  const cacheKey = getCacheKey(flagKey, options)
  
  // 1. Check cache first
  const cachedValue = getCachedValue(cacheKey)
  if (cachedValue !== null) {
    return typeof cachedValue === 'boolean' ? cachedValue : cachedValue === 'true'
  }
  
  let value: string | null = null
  
  // 2. Try AppConfig
  value = await getFromAppConfig(flagKey, config)
  
  // 3. Try DynamoDB
  if (value === null) {
    value = await getFromDynamoDB(flagKey, options, config)
  }
  
  // 4. Fallback to environment variables
  if (value === null) {
    value = process.env[flagKey] || null
  }
  
  // 5. Default to false if not found anywhere
  const boolValue = value === 'true'
  
  // Cache the result
  setCachedValue(cacheKey, boolValue)
  
  return boolValue
}

/**
 * Get a feature flag variant (for A/B testing)
 * Resolution order: Cache → AppConfig → DynamoDB → Environment Variables → 'default'
 */
export async function getVariant(
  flagKey: string,
  options: FlagOptions = {},
  config: FlagConfig = defaultConfig
): Promise<string> {
  const cacheKey = getCacheKey(`${flagKey}_variant`, options)
  
  // 1. Check cache first
  const cachedValue = getCachedValue(cacheKey)
  if (cachedValue !== null) {
    return String(cachedValue)
  }
  
  let value: string | null = null
  
  // 2. Try AppConfig
  value = await getFromAppConfig(`${flagKey}_variant`, config)
  
  // 3. Try DynamoDB
  if (value === null) {
    value = await getFromDynamoDB(`${flagKey}_variant`, options, config)
  }
  
  // 4. Fallback to environment variables
  if (value === null) {
    value = process.env[`${flagKey}_VARIANT`] || null
  }
  
  // 5. Default to 'default'
  const stringValue = value || 'default'
  
  // Cache the result
  setCachedValue(cacheKey, stringValue)
  
  return stringValue
}

/**
 * Clear all cached flag values (useful for testing)
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
