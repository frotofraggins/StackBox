const express = require('express');
const { DatasetIngestionService } = require('../../services/ai/dataset-ingestion-service');
const { logger } = require('../../services/logger');

const router = express.Router();

/**
 * Dataset Ingestion API Routes
 * Phase 3+ Feature: AI-First Platform Enhancement
 */

/**
 * POST /api/dataset-ingestion/ingest/:tenantId
 * Start dataset ingestion for a tenant
 */
router.post('/ingest/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const options = req.body || {};
  
  try {
    logger.info(`Dataset ingestion requested for tenant: ${tenantId}`);
    
    // Validate tenant access (in production, add proper auth)
    if (!tenantId || tenantId.length < 3) {
      return res.status(400).json({
        error: 'Invalid tenant ID',
        code: 'INVALID_TENANT'
      });
    }

    // Check if dataset ingestion is enabled for this tenant
    const flagsEnabled = process.env.DATASET_INGESTION_ENABLED === 'true';
    if (!flagsEnabled) {
      return res.status(200).json({
        success: false,
        message: 'Dataset ingestion is not enabled',
        degraded: true,
        tenantId: tenantId
      });
    }

    // Initialize dataset ingestion service
    const ingestionService = new DatasetIngestionService(tenantId);
    
    // Start ingestion (this could be long-running, consider async processing)
    const results = await ingestionService.ingestDatasets(options);
    
    // Return results
    res.json({
      success: results.success,
      tenantId: tenantId,
      timestamp: results.timestamp,
      datasets: results.datasets,
      tenantDocumentCount: results.tenantDocumentCount,
      insights: results.insights ? {
        summary: results.insights.summary?.substring(0, 500) + '...',
        recommendationCount: results.insights.recommendations?.length || 0,
        generatedAt: results.insights.generated_at
      } : null,
      error: results.error
    });

  } catch (error) {
    logger.error(`Dataset ingestion failed for tenant ${tenantId}:`, error);
    res.status(500).json({
      error: 'Dataset ingestion failed',
      message: error.message,
      tenantId: tenantId
    });
  }
});

/**
 * GET /api/dataset-ingestion/status/:tenantId
 * Get dataset ingestion status for a tenant
 */
router.get('/status/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  
  try {
    // In a production system, you'd track ingestion jobs in a database
    // For now, we'll return a simple status
    const flagsEnabled = process.env.DATASET_INGESTION_ENABLED === 'true';
    
    res.json({
      tenantId: tenantId,
      enabled: flagsEnabled,
      lastIngestion: null, // Would come from database
      status: 'ready',
      availableDatasets: [
        {
          name: 'census',
          description: 'US Census demographic data',
          enabled: true
        },
        {
          name: 'bbb',
          description: 'Better Business Bureau ratings',
          enabled: true
        },
        {
          name: 'yelp',
          description: 'Local business data from Yelp',
          enabled: !!process.env.YELP_API_KEY
        },
        {
          name: 'linkedin',
          description: 'Industry insights (simulated)',
          enabled: true
        }
      ]
    });

  } catch (error) {
    logger.error(`Failed to get dataset status for tenant ${tenantId}:`, error);
    res.status(500).json({
      error: 'Failed to get dataset status',
      message: error.message
    });
  }
});

/**
 * GET /api/dataset-ingestion/insights/:tenantId
 * Get latest AI insights for a tenant
 */
router.get('/insights/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  
  try {
    const ingestionService = new DatasetIngestionService(tenantId);
    
    // Get latest insights from S3 (would implement proper retrieval)
    // For now, return a sample structure
    res.json({
      tenantId: tenantId,
      hasInsights: false,
      message: 'Run dataset ingestion to generate AI insights',
      sampleInsights: {
        marketOpportunity: 'High growth potential in target demographic',
        competitiveLandscape: 'Moderate competition with differentiation opportunities',
        targetAudience: 'Professionals aged 25-45 with college education',
        recommendations: [
          'Focus on digital marketing channels',
          'Expand service offerings to include consultation',
          'Consider partnerships with complementary businesses'
        ]
      }
    });

  } catch (error) {
    logger.error(`Failed to get insights for tenant ${tenantId}:`, error);
    res.status(500).json({
      error: 'Failed to get insights',
      message: error.message
    });
  }
});

/**
 * POST /api/dataset-ingestion/configure/:tenantId
 * Configure dataset ingestion settings for a tenant
 */
router.post('/configure/:tenantId', async (req, res) => {
  const { tenantId } = req.params;
  const config = req.body;
  
  try {
    // Validate configuration
    const allowedDatasets = ['census', 'bbb', 'yelp', 'linkedin'];
    const configDatasets = Object.keys(config.datasets || {});
    const invalidDatasets = configDatasets.filter(d => !allowedDatasets.includes(d));
    
    if (invalidDatasets.length > 0) {
      return res.status(400).json({
        error: 'Invalid dataset configuration',
        invalidDatasets: invalidDatasets
      });
    }

    // Store configuration (in production, save to database)
    logger.info(`Dataset configuration updated for tenant ${tenantId}:`, config);
    
    res.json({
      success: true,
      tenantId: tenantId,
      configuration: config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`Failed to configure datasets for tenant ${tenantId}:`, error);
    res.status(500).json({
      error: 'Configuration failed',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'dataset-ingestion',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      datasetIngestionEnabled: process.env.DATASET_INGESTION_ENABLED === 'true',
      censusApiConfigured: !!process.env.CENSUS_API_KEY,
      yelpApiConfigured: !!process.env.YELP_API_KEY
    }
  });
});

module.exports = router;
