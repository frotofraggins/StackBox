const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import AI services
const DocumentProcessor = require('../../services/ai/document-processor');
const EmbeddingService = require('../../services/ai/embedding-service');
const ClaudeAssistant = require('../../services/ai/claude-assistant');

// Import utilities
const { logger, performanceLogger } = require('../../services/logger');
const authMiddleware = require('../middleware/auth');

// Initialize services
const documentProcessor = new DocumentProcessor();
const embeddingService = new EmbeddingService();
const claudeAssistant = new ClaudeAssistant();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

// Authentication middleware for all AI routes
router.use(authMiddleware);

// Helper function to get client ID from request
const getClientId = (req) => {
  return req.user?.clientId || req.headers['x-client-id'] || 'demo-client-123';
};

/**
 * @route POST /api/ai/documents/upload
 * @desc Upload and process a document
 * @access Private
 */
router.post('/documents/upload', upload.single('document'), async (req, res) => {
  const perf = performanceLogger('document_upload').start();
  const clientId = getClientId(req);

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    logger.info('Document upload initiated', {
      clientId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Process the document
    const processingResult = await documentProcessor.processDocument(
      clientId,
      req.file,
      req.file.buffer
    );

    // Generate embeddings
    const documentText = await documentProcessor.getProcessedText(
      clientId,
      processingResult.documentId
    );

    const embeddingResult = await embeddingService.generateDocumentEmbeddings(
      clientId,
      processingResult.documentId,
      documentText
    );

    const duration = perf.end('success', {
      documentId: processingResult.documentId,
      chunks: embeddingResult.totalChunks
    });

    res.json({
      success: true,
      document: {
        id: processingResult.documentId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime: processingResult.metadata.processingTime,
        wordCount: processingResult.metadata.wordCount,
        status: 'processed'
      },
      embeddings: {
        totalChunks: embeddingResult.totalChunks,
        successfulChunks: embeddingResult.successfulChunks,
        processingTime: embeddingResult.processingTime
      },
      totalTime: duration
    });

  } catch (error) {
    perf.end('error', { error: error.message });
    
    logger.error('Document upload failed', {
      clientId,
      fileName: req.file?.originalname,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/documents
 * @desc List client documents
 * @access Private
 */
router.get('/documents', async (req, res) => {
  const clientId = getClientId(req);

  try {
    const documents = await documentProcessor.listClientDocuments(clientId);

    // Get embedding stats for each document
    const documentsWithStats = await Promise.all(
      documents.map(async (doc) => {
        try {
          const embeddingStats = await embeddingService.getDocumentEmbeddingsSummary(
            clientId,
            doc.documentId
          );
          return { ...doc, embeddings: embeddingStats };
        } catch (error) {
          return { ...doc, embeddings: null };
        }
      })
    );

    res.json({
      success: true,
      documents: documentsWithStats,
      total: documentsWithStats.length
    });

  } catch (error) {
    logger.error('Failed to list documents', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/ai/documents/:documentId
 * @desc Delete a document and its embeddings
 * @access Private
 */
router.delete('/documents/:documentId', async (req, res) => {
  const clientId = getClientId(req);
  const { documentId } = req.params;

  try {
    // Delete embeddings first
    await embeddingService.deleteDocumentEmbeddings(clientId, documentId);
    
    // Delete document
    await documentProcessor.deleteDocument(clientId, documentId);

    logger.info('Document deleted successfully', {
      clientId,
      documentId
    });

    res.json({
      success: true,
      message: 'Document and embeddings deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete document', {
      clientId,
      documentId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/chat
 * @desc Generate AI response with RAG
 * @access Private
 */
router.post('/chat', async (req, res) => {
  const perf = performanceLogger('ai_chat').start();
  const clientId = getClientId(req);

  try {
    const { message, conversationId, options = {} } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string'
      });
    }

    let finalConversationId = conversationId;

    // Create new conversation if not provided
    if (!finalConversationId) {
      finalConversationId = await claudeAssistant.createConversation(
        clientId,
        message.substring(0, 50) + '...' // Use first 50 chars as title
      );
    }

    logger.info('AI chat request', {
      clientId,
      conversationId: finalConversationId,
      messageLength: message.length,
      options
    });

    // Generate AI response
    const response = await claudeAssistant.generateResponse(
      clientId,
      message,
      finalConversationId,
      options
    );

    const duration = perf.end('success', {
      conversationId: finalConversationId,
      tokensUsed: response.metadata.tokensUsed
    });

    res.json({
      ...response,
      totalTime: duration
    });

  } catch (error) {
    perf.end('error', { error: error.message });
    
    logger.error('AI chat failed', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/conversations
 * @desc Get client conversations
 * @access Private
 */
router.get('/conversations', async (req, res) => {
  const clientId = getClientId(req);

  try {
    const conversations = await claudeAssistant.getClientConversations(clientId);

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    logger.error('Failed to get conversations', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/conversations
 * @desc Create a new conversation
 * @access Private
 */
router.post('/conversations', async (req, res) => {
  const clientId = getClientId(req);
  const { title = 'New Conversation' } = req.body;

  try {
    const conversationId = await claudeAssistant.createConversation(clientId, title);

    res.json({
      success: true,
      conversationId,
      title
    });

  } catch (error) {
    logger.error('Failed to create conversation', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/search
 * @desc Search documents using vector similarity
 * @access Private
 */
router.post('/search', async (req, res) => {
  const clientId = getClientId(req);

  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a string'
      });
    }

    logger.info('Document search request', {
      clientId,
      query: query.substring(0, 100),
      limit
    });

    const results = await embeddingService.searchSimilarContent(
      clientId,
      query,
      Math.min(limit, 20) // Cap at 20 results
    );

    res.json({
      success: true,
      query,
      results: results.map(result => ({
        documentId: result.documentId,
        chunkId: result.chunkId,
        content: result.content,
        similarity: Math.round(result.similarity * 100) / 100, // Round to 2 decimals
        metadata: result.metadata
      })),
      total: results.length
    });

  } catch (error) {
    logger.error('Document search failed', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/stats
 * @desc Get AI usage statistics for client
 * @access Private
 */
router.get('/stats', async (req, res) => {
  const clientId = getClientId(req);

  try {
    // Get document stats
    const documents = await documentProcessor.listClientDocuments(clientId);
    
    // Get embedding stats
    const embeddingStats = await embeddingService.getClientEmbeddingStats(clientId);
    
    // Get conversation count
    const conversations = await claudeAssistant.getClientConversations(clientId);

    res.json({
      success: true,
      stats: {
        documents: {
          total: documents.length,
          totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
          totalWords: documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0)
        },
        embeddings: embeddingStats,
        conversations: {
          total: conversations.length,
          recent: conversations.slice(0, 5).map(conv => ({
            id: conv.conversationId,
            title: conv.title,
            lastActivity: conv.lastActivity
          }))
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get AI stats', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route PUT /api/ai/config
 * @desc Update client AI configuration
 * @access Private
 */
router.put('/config', async (req, res) => {
  const clientId = getClientId(req);

  try {
    const config = req.body;

    // Validate configuration
    const allowedKeys = [
      'businessName',
      'industry',
      'systemInstructions', 
      'responseStyle',
      'features'
    ];

    const filteredConfig = {};
    Object.keys(config).forEach(key => {
      if (allowedKeys.includes(key)) {
        filteredConfig[key] = config[key];
      }
    });

    if (Object.keys(filteredConfig).length === 0) {
      return res.status(400).json({
        success: false,
        error: `No valid configuration provided. Allowed keys: ${allowedKeys.join(', ')}`
      });
    }

    await claudeAssistant.updateClientConfig(clientId, filteredConfig);

    logger.info('AI config updated', {
      clientId,
      configKeys: Object.keys(filteredConfig)
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: filteredConfig
    });

  } catch (error) {
    logger.error('Failed to update AI config', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/health
 * @desc Health check for AI services
 * @access Private
 */
router.get('/health', async (req, res) => {
  const clientId = getClientId(req);
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // Test document processor
    try {
      await documentProcessor.listClientDocuments(clientId);
      health.services.documentProcessor = 'healthy';
    } catch (error) {
      health.services.documentProcessor = 'unhealthy';
      health.status = 'degraded';
    }

    // Test embedding service
    try {
      await embeddingService.getClientEmbeddingStats(clientId);
      health.services.embeddingService = 'healthy';
    } catch (error) {
      health.services.embeddingService = 'unhealthy';
      health.status = 'degraded';
    }

    // Test Claude assistant
    try {
      await claudeAssistant.getClientConversations(clientId);
      health.services.claudeAssistant = 'healthy';
    } catch (error) {
      health.services.claudeAssistant = 'unhealthy';
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status !== 'unhealthy',
      health
    });

  } catch (error) {
    logger.error('Health check failed', {
      clientId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Error handling middleware specific to AI routes
router.use((error, req, res, next) => {
  logger.error('AI API Error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    clientId: getClientId(req)
  });

  // Handle multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 50MB.'
      });
    }
  }

  // Handle validation errors
  if (error.message.includes('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.'
  });
});

module.exports = router;
