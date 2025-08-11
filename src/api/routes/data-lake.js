const express = require('express')
const router = express.Router()

/**
 * Data Lake Mock Handlers (Phase 2.5)
 * Returns degraded responses with guidance for integration
 */

/**
 * POST /v1/data/upload - Upload dataset (dry-run validation)
 */
router.post('/v1/data/upload', async (req, res) => {
  const startTime = Date.now()
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const tenantId = req.headers['x-tenant-id']
  
  try {
    const { datasetId, format, data, schema, metadata } = req.body
    
    // Validation
    if (!datasetId || !format || !data) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [
          !datasetId && 'datasetId is required',
          !format && 'format is required',
          !data && 'data array is required'
        ].filter(Boolean),
        degraded: true,
        requestId
      })
    }
    
    // Mock validation results
    const recordCount = Array.isArray(data) ? data.length : 0
    const warnings = []
    
    if (recordCount > 1000) {
      warnings.push(`Large dataset (${recordCount} records) - consider chunking for better performance`)
    }
    
    if (format === 'csv' && !schema) {
      warnings.push('No schema provided - will infer from data structure')
    }
    
    // Log request
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Data upload validated (mock)',
      capability: 'data-lake',
      route: '/v1/data/upload',
      tenantId,
      datasetId,
      recordCount,
      latency_ms: Date.now() - startTime,
      degraded: true,
      requestId
    }))
    
    res.json({
      success: true,
      datasetId,
      recordCount,
      validationResults: {
        valid: true,
        warnings,
        errors: []
      },
      degraded: true,
      requestId,
      guidance: {
        message: 'Data Lake capability is in development mode',
        instructions: [
          'Data validation completed successfully',
          'No actual storage occurred (mock mode)',
          'Enable CAP_DATALAKE_ENABLED=true when backend is deployed',
          'Contact support for production data lake access'
        ]
      }
    })
    
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Data upload failed (mock)',
      capability: 'data-lake',
      route: '/v1/data/upload',
      tenantId,
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

/**
 * GET /v1/data/:datasetId - Get dataset metadata (mock)
 */
router.get('/v1/data/:datasetId', async (req, res) => {
  const startTime = Date.now()
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const tenantId = req.headers['x-tenant-id']
  const { datasetId } = req.params
  
  try {
    // Mock dataset metadata
    const mockDataset = {
      datasetId,
      status: 'ready',
      recordCount: 1247,
      schema: {
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'timestamp', type: 'datetime', required: true },
          { name: 'value', type: 'number', required: false }
        ]
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'mock-data-generator',
        version: '1.0.0'
      },
      degraded: true,
      requestId,
      guidance: {
        message: 'Mock dataset metadata returned',
        instructions: [
          'This is simulated data for testing',
          'Real datasets will have actual metadata',
          'Enable full data lake for production use'
        ]
      }
    }
    
    // Log request
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Dataset metadata retrieved (mock)',
      capability: 'data-lake',
      route: '/v1/data/:datasetId',
      tenantId,
      datasetId,
      latency_ms: Date.now() - startTime,
      degraded: true,
      requestId
    }))
    
    res.json(mockDataset)
    
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Dataset metadata retrieval failed (mock)',
      capability: 'data-lake',
      route: '/v1/data/:datasetId',
      tenantId,
      datasetId,
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
