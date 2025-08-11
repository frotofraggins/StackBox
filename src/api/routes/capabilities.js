const express = require('express')
const router = express.Router()

// Import runtime services (will work once packages are built)
// For now, use simplified implementations with tenant overrides
const { isEnabled } = require('../../utils/simple-tenant-flags')
const { resolveCapabilityUrl } = require('../../utils/simple-discovery')

/**
 * GET /capabilities - Capability Registry
 * Returns current capability status and metadata in new schema format
 */
router.get('/', async (req, res) => {
  const startTime = Date.now()
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const tenantId = req.headers['x-tenant-id']
  
  try {
    const env = process.env.STACKPRO_ENV || 'sandbox'
    const version = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Tenant context for flag resolution
    const tenantOptions = { tenantId }
    
    // Build capabilities array in new schema format
    const capabilities = []
    
    // Messaging capability
    const messagingEnabled = await isEnabled('CAP_MESSAGING_ENABLED', tenantOptions)
    const messagingBaseUrl = await resolveCapabilityUrl('messaging', env)
    
    capabilities.push({
      id: 'messaging',
      version: '1.0.0',
      enabled: messagingEnabled,
      degraded: false, // TODO: Add health check logic
      baseUrl: messagingEnabled ? messagingBaseUrl : null,
      scopes: ['read', 'write'],
      health: 'unknown',
      sdk: {
        npm: '@stackpro/messaging-client',
        version: '0.1.0'
      },
      contract: `${req.protocol}://${req.get('host')}/contracts/messaging/v1.yaml`,
      description: 'Multi-tenant messaging and collaboration system'
    })
    
    // Data Lake capability
    const datalakeEnabled = await isEnabled('CAP_DATALAKE_ENABLED', tenantOptions)
    const datalakeBaseUrl = await resolveCapabilityUrl('datalake', env)
    
    capabilities.push({
      id: 'data-lake',
      version: '1.0.0',
      enabled: datalakeEnabled,
      degraded: false,
      baseUrl: datalakeEnabled ? datalakeBaseUrl : null,
      scopes: ['ingest', 'query'],
      health: 'unknown',
      sdk: {
        npm: '@stackpro/datalake-client',
        version: '0.1.0'
      },
      contract: `${req.protocol}://${req.get('host')}/contracts/datalake/v1.yaml`,
      description: 'Tenant data ingestion and analytics platform'
    })
    
    const response = {
      env,
      version,
      capabilities,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        degraded: false
      }
    }
    
    // Log request
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Capabilities retrieved',
      capability: 'registry',
      route: '/capabilities',
      tenantId: req.headers['x-tenant-id'],
      latency_ms: Date.now() - startTime,
      degraded: false,
      requestId
    }))
    
    res.json(response)
  } catch (error) {
    // Log error
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Capabilities retrieval failed',
      capability: 'registry',
      route: '/capabilities',
      tenantId: req.headers['x-tenant-id'],
      latency_ms: Date.now() - startTime,
      degraded: true,
      requestId,
      error: error.message
    }))
    
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      degraded: true,
      requestId
    })
  }
})

module.exports = router
