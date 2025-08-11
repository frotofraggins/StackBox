const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const router = express.Router();

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * GET /api/ai-docs/tenant/:tenantId/documents
 * List all documents for a tenant
 */
router.get('/tenant/:tenantId/documents', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { source } = req.query; // 'upload' or 'email-ingest'
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    let prefix = `tenants/${tenantId}/docs/`;
    
    if (source) {
      prefix += `${source}/`;
    }

    const listCommand = new ListObjectsV2Command({
      Bucket: baseBucket,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await s3.send(listCommand);
    
    const documents = (response.Contents || []).map(obj => ({
      key: obj.Key,
      filename: obj.Key.split('/').pop(),
      size: obj.Size,
      lastModified: obj.LastModified,
      source: obj.Key.includes('/email-ingest/') ? 'email' : 'upload'
    }));

    res.json({
      tenantId,
      documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * POST /api/ai-docs/tenant/:tenantId/upload
 * Upload documents for a tenant
 */
router.post('/tenant/:tenantId/upload', upload.array('documents', 10), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const files = req.files;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    const uploadedFiles = [];

    for (const file of files) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const key = `tenants/${tenantId}/docs/upload/${timestamp}-${file.originalname}`;
        
        const putCommand = new PutObjectCommand({
          Bucket: baseBucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            tenantId: tenantId,
            originalFilename: file.originalname,
            uploadedAt: new Date().toISOString(),
            source: 'upload',
            processed: 'false'
          },
          ServerSideEncryption: 'aws:kms'
        });

        await s3.send(putCommand);
        
        uploadedFiles.push({
          filename: file.originalname,
          s3Key: key,
          size: file.size,
          contentType: file.mimetype,
          uploadedAt: new Date().toISOString()
        });

        console.log(`✅ Uploaded document: ${file.originalname} for tenant ${tenantId}`);
      } catch (fileError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, fileError);
        // Continue with other files
      }
    }

    // Store upload metadata
    await storeUploadMetadata(tenantId, uploadedFiles);

    res.json({
      message: 'Files uploaded successfully',
      tenantId,
      uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

/**
 * GET /api/ai-docs/tenant/:tenantId/document/:documentKey/download
 * Get signed URL for document download
 */
router.get('/tenant/:tenantId/document/:documentKey/download', async (req, res) => {
  try {
    const { tenantId, documentKey } = req.params;
    
    if (!tenantId || !documentKey) {
      return res.status(400).json({ error: 'Tenant ID and document key are required' });
    }

    const baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    const decodedKey = decodeURIComponent(documentKey);
    
    // Verify the key belongs to the tenant
    if (!decodedKey.startsWith(`tenants/${tenantId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const getCommand = new GetObjectCommand({
      Bucket: baseBucket,
      Key: decodedKey
    });

    const signedUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour
    
    res.json({
      downloadUrl: signedUrl,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

/**
 * DELETE /api/ai-docs/tenant/:tenantId/document/:documentKey
 * Delete a document
 */
router.delete('/tenant/:tenantId/document/:documentKey', async (req, res) => {
  try {
    const { tenantId, documentKey } = req.params;
    
    if (!tenantId || !documentKey) {
      return res.status(400).json({ error: 'Tenant ID and document key are required' });
    }

    const baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    const decodedKey = decodeURIComponent(documentKey);
    
    // Verify the key belongs to the tenant
    if (!decodedKey.startsWith(`tenants/${tenantId}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: baseBucket,
      Key: decodedKey
    });

    await s3.send(deleteCommand);
    
    res.json({
      message: 'Document deleted successfully',
      documentKey: decodedKey
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * POST /api/ai-docs/tenant/:tenantId/analyze
 * Trigger AI analysis of tenant documents
 */
router.post('/tenant/:tenantId/analyze', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { forceReprocess = false } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Check if AI analysis is enabled
    const aiAnalysisEnabled = process.env.AI_ANALYSIS_ENABLED === 'true';
    if (!aiAnalysisEnabled) {
      return res.status(503).json({ 
        error: 'AI analysis is currently disabled',
        feature: 'ai-docs-analysis',
        enabled: false
      });
    }

    // In a real implementation, this would trigger:
    // 1. Document text extraction (PDF, DOCX parsing)
    // 2. Bedrock Claude analysis for business insights
    // 3. Gap analysis against industry standards
    // 4. Recommendation generation

    res.json({
      message: 'AI analysis initiated',
      tenantId,
      status: 'processing',
      estimatedCompletionTime: '5-10 minutes',
      analysisId: `analysis-${tenantId}-${Date.now()}`
    });
  } catch (error) {
    console.error('Error initiating AI analysis:', error);
    res.status(500).json({ error: 'Failed to initiate AI analysis' });
  }
});

/**
 * GET /api/ai-docs/tenant/:tenantId/analysis
 * Get AI analysis results for tenant
 */
router.get('/tenant/:tenantId/analysis', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Mock analysis results for demo
    const mockAnalysis = {
      tenantId,
      analysisDate: new Date().toISOString(),
      documentsAnalyzed: 3,
      keyInsights: [
        "Business operates in construction industry based on document patterns",
        "Strong project management processes identified",
        "Gap in automated invoicing workflows detected"
      ],
      industryMatch: "Construction",
      confidence: 0.85,
      recommendedCapabilities: [
        {
          name: "Automated Invoicing Stack",
          priority: "high",
          reason: "Multiple manual invoice templates detected"
        },
        {
          name: "Project Timeline Optimization",
          priority: "medium", 
          reason: "Schedule coordination challenges identified"
        }
      ],
      nextSteps: [
        "Review recommended stacks in capabilities dashboard",
        "Schedule consultation for invoicing automation",
        "Upload recent project documentation for deeper analysis"
      ]
    };

    res.json(mockAnalysis);
  } catch (error) {
    console.error('Error getting analysis results:', error);
    res.status(500).json({ error: 'Failed to get analysis results' });
  }
});

/**
 * Helper function to store upload metadata
 */
async function storeUploadMetadata(tenantId, uploadedFiles) {
  try {
    const baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    const metadata = {
      tenantId,
      uploadTimestamp: new Date().toISOString(),
      files: uploadedFiles,
      source: 'direct-upload',
      processed: false
    };

    const key = `tenants/${tenantId}/metadata/uploads/${Date.now()}.json`;
    
    const putCommand = new PutObjectCommand({
      Bucket: baseBucket,
      Key: key,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      Metadata: {
        tenantId: tenantId,
        source: 'upload-metadata',
        createdAt: new Date().toISOString()
      },
      ServerSideEncryption: 'aws:kms'
    });

    await s3.send(putCommand);
    console.log(`✅ Stored upload metadata for tenant ${tenantId}`);
  } catch (error) {
    console.error('❌ Failed to store upload metadata:', error);
  }
}

module.exports = router;
