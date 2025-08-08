/**
 * StackPro Site Builder API Routes
 * Handles site builder operations
 */

const express = require('express');
const router = express.Router();
const { BuilderService } = require('../../services/site-builder/builder-service');

// Initialize builder service
const builderService = new BuilderService();

/**
 * GET /api/site-builder/templates
 * Get available site templates
 */
router.get('/templates', async (req, res) => {
  try {
    const { category } = req.query;
    const templates = await builderService.getTemplates(category);
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates'
    });
  }
});

/**
 * GET /api/site-builder/templates/:templateId
 * Get specific template
 */
router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await builderService.getTemplate(templateId);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
    
    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template'
    });
  }
});

/**
 * GET /api/site-builder/sites/:clientId
 * Get site for client
 */
router.get('/sites/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const site = await builderService.getSiteByClient(clientId);
    
    res.json({
      success: true,
      site
    });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get site'
    });
  }
});

/**
 * POST /api/site-builder/sites
 * Create new site
 */
router.post('/sites', async (req, res) => {
  try {
    const { clientId, templateId, settings, theme } = req.body;
    
    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Client ID is required'
      });
    }

    const result = await builderService.createSite(clientId, {
      templateId,
      settings,
      theme
    });
    
    res.json(result);
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site'
    });
  }
});

/**
 * PUT /api/site-builder/sites/:clientId
 * Update site
 */
router.put('/sites/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const updates = req.body;
    
    // First get the site to get its ID
    const existingSite = await builderService.getSiteByClient(clientId);
    if (!existingSite) {
      // Create new site if it doesn't exist
      const result = await builderService.createSite(clientId, updates);
      return res.json(result);
    }
    
    const result = await builderService.updateSite(existingSite.id, updates);
    res.json(result);
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update site'
    });
  }
});

/**
 * POST /api/site-builder/publish/:clientId
 * Publish site
 */
router.post('/publish/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { siteConfig, staticSite } = req.body;
    
    // Get site by client
    const site = await builderService.getSiteByClient(clientId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found'
      });
    }
    
    const result = await builderService.publishSite(site.id, staticSite);
    res.json(result);
  } catch (error) {
    console.error('Publish site error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish site'
    });
  }
});

/**
 * POST /api/site-builder/assets/upload
 * Upload asset
 */
router.post('/assets/upload', async (req, res) => {
  try {
    // For demo, just return a mock response
    // In production, this would handle file upload to S3
    const assetId = `asset-${Date.now()}`;
    const assetUrl = `https://via.placeholder.com/400x300?text=${req.body.fileName || 'Asset'}`;
    
    res.json({
      success: true,
      id: assetId,
      url: assetUrl
    });
  } catch (error) {
    console.error('Upload asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload asset'
    });
  }
});

/**
 * DELETE /api/site-builder/assets/:assetId
 * Delete asset
 */
router.delete('/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    
    // For demo, just return success
    // In production, this would delete from S3
    
    res.json({
      success: true,
      message: 'Asset deleted'
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
});

/**
 * GET /api/site-builder/stats/:clientId
 * Get site statistics
 */
router.get('/stats/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const stats = await builderService.getSiteStats(clientId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get site stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get site stats'
    });
  }
});

module.exports = router;
