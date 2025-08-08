const AWS = require('aws-sdk');

class ClaudeAssistant {
  constructor() {
    this.bedrock = new AWS.BedrockRuntime();
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.logger = require('../logger');
    
    // Import our custom services
    this.embeddingService = new (require('./embedding-service'))();
    
    // Claude model configuration
    this.claudeModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.maxTokens = 4000;
    this.temperature = 0.7;
    
    // RAG configuration
    this.maxContextChunks = 8;
    this.minSimilarityThreshold = 0.7;
    this.conversationHistoryLimit = 10;
  }

  /**
   * Generate AI response with Retrieval-Augmented Generation
   * @param {string} clientId - Client identifier
   * @param {string} userMessage - User's message/question
   * @param {string} conversationId - Conversation identifier
   * @param {Object} options - Additional options
   * @returns {Object} AI response with sources
   */
  async generateResponse(clientId, userMessage, conversationId, options = {}) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Generating AI response`, {
        clientId,
        conversationId,
        messageLength: userMessage.length,
        useRAG: options.useRAG !== false
      });

      // Get client configuration
      const clientConfig = await this.getClientConfig(clientId);

      // Retrieve conversation history
      const conversationHistory = await this.getConversationHistory(conversationId);

      // Perform RAG search if enabled
      let relevantContext = [];
      if (options.useRAG !== false) {
        relevantContext = await this.performRAGSearch(clientId, userMessage);
      }

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(clientConfig, relevantContext);

      // Build conversation messages
      const messages = this.buildConversationMessages(
        conversationHistory, 
        userMessage, 
        relevantContext
      );

      // Generate response using Claude
      const claudeResponse = await this.invokeClaudeModel({
        system: systemPrompt,
        messages,
        maxTokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature
      });

      // Process and format response
      const formattedResponse = await this.formatResponse(
        claudeResponse, 
        relevantContext, 
        clientConfig
      );

      // Store conversation in history
      await this.storeConversationTurn(
        conversationId,
        clientId,
        userMessage,
        formattedResponse,
        relevantContext
      );

      // Track usage
      await this.trackAIUsage(clientId, {
        operation: 'chat_completion',
        tokensUsed: claudeResponse.usage?.total_tokens || 0,
        hasRAG: relevantContext.length > 0,
        responseTime: Date.now() - startTime
      });

      this.logger.info(`AI response generated successfully`, {
        clientId,
        conversationId,
        responseTime: Date.now() - startTime,
        contextChunks: relevantContext.length,
        responseLength: formattedResponse.content.length
      });

      return {
        success: true,
        conversationId,
        response: formattedResponse,
        context: {
          chunksUsed: relevantContext.length,
          sources: relevantContext.map(chunk => ({
            documentId: chunk.documentId,
            similarity: chunk.similarity,
            preview: chunk.content.substring(0, 100) + '...'
          }))
        },
        metadata: {
          tokensUsed: claudeResponse.usage?.total_tokens || 0,
          responseTime: Date.now() - startTime,
          model: this.claudeModel
        }
      };

    } catch (error) {
      this.logger.error(`AI response generation failed`, {
        clientId,
        conversationId,
        error: error.message
      });

      // Track failed usage
      await this.trackAIUsage(clientId, {
        operation: 'chat_completion_failed',
        error: error.message,
        responseTime: Date.now() - startTime
      });

      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  /**
   * Perform RAG search to find relevant context
   * @param {string} clientId - Client identifier
   * @param {string} query - Search query
   * @returns {Array} Relevant context chunks
   */
  async performRAGSearch(clientId, query) {
    try {
      // Search for similar content
      const similarChunks = await this.embeddingService.searchSimilarContent(
        clientId, 
        query, 
        this.maxContextChunks
      );

      // Filter by similarity threshold
      const relevantChunks = similarChunks.filter(
        chunk => chunk.similarity >= this.minSimilarityThreshold
      );

      this.logger.info(`RAG search completed`, {
        clientId,
        totalResults: similarChunks.length,
        relevantResults: relevantChunks.length,
        topSimilarity: relevantChunks.length > 0 ? relevantChunks[0].similarity : 0
      });

      return relevantChunks;

    } catch (error) {
      this.logger.warn(`RAG search failed, continuing without context`, {
        clientId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get client-specific configuration
   * @param {string} clientId - Client identifier
   * @returns {Object} Client configuration
   */
  async getClientConfig(clientId) {
    try {
      // In production, this would come from a database
      // For now, we'll return a default configuration with industry-specific prompts
      const defaultConfig = {
        clientId,
        businessName: 'Your Business',
        industry: 'general',
        systemInstructions: 'You are a helpful business assistant.',
        responseStyle: 'professional',
        features: ['document_search', 'general_questions']
      };

      // Try to get client-specific config from database
      try {
        const result = await this.dynamodb.get({
          TableName: 'StackPro-AIEmbeddings',
          Key: {
            clientId,
            documentId: 'client-config'
          }
        }).promise();

        if (result.Item) {
          return { ...defaultConfig, ...result.Item.config };
        }
      } catch (error) {
        this.logger.warn(`Could not retrieve client config, using defaults`, {
          clientId,
          error: error.message
        });
      }

      return defaultConfig;

    } catch (error) {
      this.logger.error(`Failed to get client config`, {
        clientId,
        error: error.message
      });
      
      // Return minimal default config
      return {
        clientId,
        businessName: 'Your Business',
        industry: 'general',
        systemInstructions: 'You are a helpful business assistant.',
        responseStyle: 'professional'
      };
    }
  }

  /**
   * Build system prompt with client context and RAG data
   * @param {Object} clientConfig - Client configuration
   * @param {Array} relevantContext - RAG context chunks
   * @returns {string} System prompt
   */
  buildSystemPrompt(clientConfig, relevantContext) {
    let systemPrompt = `You are an AI assistant for ${clientConfig.businessName}.`;

    // Add industry-specific context
    const industryPrompts = {
      'legal': `You are a legal assistant. Always maintain attorney-client privilege and provide accurate legal guidance. Reference specific documents when answering questions. Never provide legal advice outside your knowledge base.`,
      'real_estate': `You are a real estate assistant. Help with property information, market analysis, and client communication. Always reference current market data from the provided documents.`,
      'healthcare': `You are a healthcare practice assistant. Help with patient communication, appointment scheduling, and practice management. Always maintain patient privacy and HIPAA compliance.`,
      'consulting': `You are a business consulting assistant. Provide strategic advice based on the client's documents and business data. Focus on actionable insights.`,
      'general': `You are a professional business assistant. Help with general business questions, document analysis, and task management.`
    };

    systemPrompt += ' ' + (industryPrompts[clientConfig.industry] || industryPrompts['general']);

    // Add response style guidance
    if (clientConfig.responseStyle === 'formal') {
      systemPrompt += ' Always respond in a formal, professional tone.';
    } else if (clientConfig.responseStyle === 'casual') {
      systemPrompt += ' Respond in a friendly, conversational tone.';
    }

    // Add custom instructions
    if (clientConfig.systemInstructions) {
      systemPrompt += ` Additional instructions: ${clientConfig.systemInstructions}`;
    }

    // Add context from RAG if available
    if (relevantContext.length > 0) {
      systemPrompt += '\n\nYou have access to the following relevant information from the client\'s documents:';
      
      relevantContext.forEach((chunk, index) => {
        systemPrompt += `\n\n--- Document Context ${index + 1} (Relevance: ${(chunk.similarity * 100).toFixed(1)}%) ---\n${chunk.content}`;
      });

      systemPrompt += '\n\nWhen answering questions, reference this information when relevant and cite which document context you\'re using.';
    }

    // Add important guidelines
    systemPrompt += `\n\nImportant guidelines:
- Only answer questions based on your training data and the provided document context
- If you cannot find relevant information in the provided context, say so explicitly
- Always cite your sources when using information from the document context
- Keep responses concise but complete
- If asked about information outside the provided context, acknowledge the limitation`;

    return systemPrompt;
  }

  /**
   * Build conversation messages array
   * @param {Array} conversationHistory - Previous messages
   * @param {string} currentMessage - Current user message
   * @param {Array} context - RAG context
   * @returns {Array} Messages for Claude
   */
  buildConversationMessages(conversationHistory, currentMessage, context) {
    const messages = [];

    // Add recent conversation history
    const recentHistory = conversationHistory.slice(-this.conversationHistoryLimit);
    
    recentHistory.forEach(turn => {
      if (turn.userMessage) {
        messages.push({
          role: 'user',
          content: turn.userMessage
        });
      }
      if (turn.assistantResponse) {
        messages.push({
          role: 'assistant',
          content: turn.assistantResponse
        });
      }
    });

    // Add current message with context reference if available
    let currentContent = currentMessage;
    
    if (context.length > 0) {
      currentContent += `\n\n[Note: Please reference the document context provided in the system message when relevant to this question.]`;
    }

    messages.push({
      role: 'user',
      content: currentContent
    });

    return messages;
  }

  /**
   * Invoke Claude model with retries
   * @param {Object} payload - Request payload
   * @returns {Object} Claude response
   */
  async invokeClaudeModel(payload) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const requestBody = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: payload.maxTokens,
          temperature: payload.temperature,
          system: payload.system,
          messages: payload.messages
        };

        const response = await this.bedrock.invokeModel({
          modelId: this.claudeModel,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(requestBody)
        }).promise();

        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        if (!responseBody.content || responseBody.content.length === 0) {
          throw new Error('Empty response from Claude');
        }

        return {
          content: responseBody.content[0].text,
          usage: responseBody.usage || {},
          model: this.claudeModel,
          stopReason: responseBody.stop_reason
        };

      } catch (error) {
        lastError = error;
        this.logger.warn(`Claude invocation attempt ${attempt} failed`, {
          error: error.message,
          attempt,
          maxRetries
        });

        if (attempt === maxRetries) break;

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error(`Claude invocation failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Format and enhance the response
   * @param {Object} claudeResponse - Raw Claude response
   * @param {Array} context - RAG context used
   * @param {Object} clientConfig - Client configuration
   * @returns {Object} Formatted response
   */
  async formatResponse(claudeResponse, context, clientConfig) {
    let content = claudeResponse.content;

    // Add source citations if context was used
    if (context.length > 0) {
      content += '\n\n---\n**Sources:**\n';
      const uniqueDocuments = [...new Set(context.map(c => c.documentId))];
      uniqueDocuments.forEach((docId, index) => {
        content += `${index + 1}. Document: ${docId}\n`;
      });
    }

    return {
      content,
      type: 'text',
      sources: context.map(chunk => ({
        documentId: chunk.documentId,
        chunkId: chunk.chunkId,
        similarity: chunk.similarity,
        preview: chunk.content.substring(0, 200) + '...'
      })),
      timestamp: new Date().toISOString(),
      model: this.claudeModel
    };
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Conversation identifier
   * @returns {Array} Conversation history
   */
  async getConversationHistory(conversationId) {
    try {
      const result = await this.dynamodb.query({
        TableName: 'StackPro-ChatHistory',
        KeyConditionExpression: 'conversationId = :conversationId',
        ExpressionAttributeValues: {
          ':conversationId': conversationId
        },
        ScanIndexForward: true, // Oldest first
        Limit: this.conversationHistoryLimit * 2 // Account for user/assistant pairs
      }).promise();

      return result.Items || [];

    } catch (error) {
      this.logger.warn(`Could not retrieve conversation history`, {
        conversationId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Store conversation turn in history
   * @param {string} conversationId - Conversation identifier
   * @param {string} clientId - Client identifier
   * @param {string} userMessage - User's message
   * @param {Object} assistantResponse - Assistant's response
   * @param {Array} context - RAG context used
   */
  async storeConversationTurn(conversationId, clientId, userMessage, assistantResponse, context) {
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    try {
      // Store conversation turn
      await this.dynamodb.put({
        TableName: 'StackPro-ChatHistory',
        Item: {
          conversationId,
          messageId,
          clientId,
          userMessage,
          assistantResponse: assistantResponse.content,
          contextUsed: context.map(c => ({
            documentId: c.documentId,
            chunkId: c.chunkId,
            similarity: c.similarity
          })),
          timestamp,
          ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
        }
      }).promise();

      this.logger.info(`Conversation turn stored`, {
        conversationId,
        messageId,
        clientId
      });

    } catch (error) {
      this.logger.error(`Failed to store conversation turn`, {
        conversationId,
        clientId,
        error: error.message
      });
    }
  }

  /**
   * Track AI usage for billing
   * @param {string} clientId - Client identifier
   * @param {Object} usageData - Usage information
   */
  async trackAIUsage(clientId, usageData) {
    try {
      const timestamp = new Date().toISOString();
      const date = timestamp.split('T')[0];

      await this.dynamodb.put({
        TableName: 'StackPro-AIUsage',
        Item: {
          clientId,
          timestamp,
          date,
          ...usageData,
          service: 'claude-assistant'
        }
      }).promise();

    } catch (error) {
      this.logger.error(`Failed to track AI usage`, {
        clientId,
        error: error.message
      });
    }
  }

  /**
   * Create a new conversation
   * @param {string} clientId - Client identifier
   * @param {string} title - Conversation title
   * @returns {string} Conversation ID
   */
  async createConversation(clientId, title = 'New Conversation') {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await this.dynamodb.put({
        TableName: 'StackPro-ChatHistory',
        Item: {
          conversationId,
          messageId: 'metadata',
          clientId,
          title,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
          type: 'conversation-metadata'
        }
      }).promise();

      return conversationId;
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Get client conversations list
   * @param {string} clientId - Client identifier
   * @returns {Array} Conversations
   */
  async getClientConversations(clientId) {
    try {
      const result = await this.dynamodb.query({
        TableName: 'StackPro-ChatHistory',
        IndexName: 'ClientIndex',
        KeyConditionExpression: 'clientId = :clientId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':clientId': clientId,
          ':type': 'conversation-metadata'
        },
        ScanIndexForward: false // Newest first
      }).promise();

      return result.Items.map(item => ({
        conversationId: item.conversationId,
        title: item.title,
        createdAt: item.createdAt,
        lastActivity: item.lastActivity,
        messageCount: item.messageCount || 0
      }));

    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  /**
   * Update client AI configuration
   * @param {string} clientId - Client identifier
   * @param {Object} config - Configuration to update
   */
  async updateClientConfig(clientId, config) {
    try {
      await this.dynamodb.put({
        TableName: 'StackPro-AIEmbeddings',
        Item: {
          clientId,
          documentId: 'client-config',
          config,
          type: 'client-config',
          updatedAt: new Date().toISOString()
        }
      }).promise();

      this.logger.info(`Client AI config updated`, {
        clientId,
        configKeys: Object.keys(config)
      });

    } catch (error) {
      throw new Error(`Failed to update client config: ${error.message}`);
    }
  }
}

module.exports = ClaudeAssistant;
