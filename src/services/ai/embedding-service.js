const AWS = require('aws-sdk');
const crypto = require('crypto');

class EmbeddingService {
  constructor() {
    this.bedrock = new AWS.BedrockRuntime();
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.logger = require('../logger');
    
    // Titan Embedding model configuration
    this.embeddingModel = 'amazon.titan-embed-text-v1';
    this.embeddingDimensions = 1536;
    this.maxChunkSize = 8000; // Titan's max input length
    this.chunkOverlap = 200; // Overlap between chunks for continuity
  }

  /**
   * Generate embeddings for a processed document
   * @param {string} clientId - Client identifier
   * @param {string} documentId - Document identifier
   * @param {string} textContent - Processed text content
   * @returns {Object} Embedding generation result
   */
  async generateDocumentEmbeddings(clientId, documentId, textContent) {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Starting embedding generation`, {
        clientId,
        documentId,
        textLength: textContent.length
      });

      // Split text into chunks
      const chunks = this.splitTextIntoChunks(textContent);
      this.logger.info(`Text split into ${chunks.length} chunks`, {
        clientId,
        documentId,
        chunkCount: chunks.length
      });

      // Generate embeddings for each chunk
      const embeddings = [];
      let processedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = this.generateChunkId(documentId, i);
        
        try {
          // Generate embedding using Titan
          const embedding = await this.generateEmbedding(chunk.text);
          
          // Store embedding with metadata
          const embeddingRecord = {
            clientId,
            documentId,
            chunkId,
            content: chunk.text,
            embedding: embedding,
            metadata: {
              chunkIndex: i,
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
              wordCount: this.countWords(chunk.text),
              generatedAt: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          };

          // Store in DynamoDB
          await this.storeEmbedding(embeddingRecord);
          
          embeddings.push({
            chunkId,
            embeddingLength: embedding.length,
            contentPreview: chunk.text.substring(0, 100) + '...'
          });

          processedChunks++;
          
          // Log progress for long documents
          if (chunks.length > 10 && processedChunks % 5 === 0) {
            this.logger.info(`Embedding progress: ${processedChunks}/${chunks.length}`, {
              clientId,
              documentId
            });
          }

          // Small delay to avoid rate limiting
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          this.logger.error(`Failed to generate embedding for chunk ${i}`, {
            clientId,
            documentId,
            chunkId,
            error: error.message
          });
          
          // Store error record
          await this.storeEmbeddingError(clientId, documentId, chunkId, {
            chunkIndex: i,
            error: error.message,
            failedAt: new Date().toISOString()
          });
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.info(`Embedding generation completed`, {
        clientId,
        documentId,
        totalChunks: chunks.length,
        successfulChunks: processedChunks,
        processingTime
      });

      // Update document metadata with embedding info
      await this.updateDocumentEmbeddingStatus(clientId, documentId, {
        embeddingStatus: 'completed',
        totalChunks: chunks.length,
        successfulChunks: processedChunks,
        embeddingProcessingTime: processingTime,
        embeddingsGeneratedAt: new Date().toISOString()
      });

      return {
        success: true,
        documentId,
        totalChunks: chunks.length,
        successfulChunks: processedChunks,
        processingTime,
        embeddings
      };

    } catch (error) {
      this.logger.error(`Embedding generation failed`, {
        clientId,
        documentId,
        error: error.message
      });

      // Update document with error status
      await this.updateDocumentEmbeddingStatus(clientId, documentId, {
        embeddingStatus: 'failed',
        embeddingError: error.message,
        embeddingFailedAt: new Date().toISOString()
      });

      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a single embedding using Titan
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const payload = {
        inputText: text.trim()
      };

      const response = await this.bedrock.invokeModel({
        modelId: this.embeddingModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      }).promise();

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (!responseBody.embedding || !Array.isArray(responseBody.embedding)) {
        throw new Error('Invalid embedding response from Titan');
      }

      if (responseBody.embedding.length !== this.embeddingDimensions) {
        this.logger.warn(`Unexpected embedding dimensions`, {
          expected: this.embeddingDimensions,
          actual: responseBody.embedding.length
        });
      }

      return responseBody.embedding;

    } catch (error) {
      if (error.code === 'ValidationException' && error.message.includes('too long')) {
        // Text is too long, try truncating
        const truncatedText = text.substring(0, this.maxChunkSize - 100);
        this.logger.warn(`Text too long, truncating and retrying`, {
          originalLength: text.length,
          truncatedLength: truncatedText.length
        });
        
        return await this.generateEmbedding(truncatedText);
      }
      
      throw new Error(`Titan embedding failed: ${error.message}`);
    }
  }

  /**
   * Split text into chunks suitable for embedding
   * @param {string} text - Text to split
   * @returns {Array} Array of text chunks with metadata
   */
  splitTextIntoChunks(text) {
    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + this.maxChunkSize, text.length);
      
      // Try to end at a sentence boundary
      if (endIndex < text.length) {
        const sentenceEnd = text.lastIndexOf('.', endIndex);
        const paragraphEnd = text.lastIndexOf('\n', endIndex);
        const spaceEnd = text.lastIndexOf(' ', endIndex);
        
        // Choose the best boundary
        const boundaries = [sentenceEnd, paragraphEnd, spaceEnd].filter(pos => pos > startIndex + this.maxChunkSize * 0.7);
        if (boundaries.length > 0) {
          endIndex = Math.max(...boundaries) + 1;
        }
      }

      const chunkText = text.substring(startIndex, endIndex).trim();
      
      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          startIndex,
          endIndex: endIndex - 1
        });
      }

      // Move start position with overlap
      startIndex = Math.max(endIndex - this.chunkOverlap, endIndex);
    }

    return chunks;
  }

  /**
   * Store embedding record in DynamoDB
   * @param {Object} embeddingRecord - Complete embedding record
   */
  async storeEmbedding(embeddingRecord) {
    await this.dynamodb.put({
      TableName: 'StackPro-AIEmbeddings',
      Item: {
        ...embeddingRecord,
        type: 'embedding-chunk',
        // Create GSI-friendly keys
        GSI1PK: `${embeddingRecord.clientId}#${embeddingRecord.documentId}`,
        GSI1SK: `CHUNK#${embeddingRecord.chunkId}`
      }
    }).promise();
  }

  /**
   * Store embedding error record
   */
  async storeEmbeddingError(clientId, documentId, chunkId, errorData) {
    try {
      await this.dynamodb.put({
        TableName: 'StackPro-AIEmbeddings',
        Item: {
          clientId,
          documentId: `${documentId}#ERROR#${chunkId}`,
          chunkId,
          ...errorData,
          type: 'embedding-error',
          timestamp: new Date().toISOString()
        }
      }).promise();
    } catch (error) {
      this.logger.error('Failed to store embedding error', { error: error.message });
    }
  }

  /**
   * Update document metadata with embedding status
   */
  async updateDocumentEmbeddingStatus(clientId, documentId, statusData) {
    try {
      const updateExpression = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};

      Object.keys(statusData).forEach(key => {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = statusData[key];
      });

      await this.dynamodb.update({
        TableName: 'StackPro-AIEmbeddings',
        Key: {
          clientId,
          documentId
        },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }).promise();
    } catch (error) {
      this.logger.error('Failed to update document embedding status', {
        clientId,
        documentId,
        error: error.message
      });
    }
  }

  /**
   * Search for similar content using vector similarity
   * @param {string} clientId - Client identifier
   * @param {string} queryText - Query text to search for
   * @param {number} limit - Maximum number of results
   * @returns {Array} Similar content chunks
   */
  async searchSimilarContent(clientId, queryText, limit = 10) {
    try {
      this.logger.info(`Starting similarity search`, {
        clientId,
        queryLength: queryText.length,
        limit
      });

      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(queryText);

      // Get all embeddings for the client
      const clientEmbeddings = await this.getClientEmbeddings(clientId);
      
      if (clientEmbeddings.length === 0) {
        return [];
      }

      // Calculate similarities and sort
      const similarities = clientEmbeddings.map(item => ({
        ...item,
        similarity: this.calculateCosineSimilarity(queryEmbedding, item.embedding)
      }));

      // Sort by similarity (descending) and take top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, limit);

      this.logger.info(`Similarity search completed`, {
        clientId,
        totalEmbeddings: clientEmbeddings.length,
        topSimilarity: topResults.length > 0 ? topResults[0].similarity : 0,
        resultsReturned: topResults.length
      });

      return topResults.map(result => ({
        documentId: result.documentId,
        chunkId: result.chunkId,
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata
      }));

    } catch (error) {
      this.logger.error(`Similarity search failed`, {
        clientId,
        error: error.message
      });
      throw new Error(`Similarity search failed: ${error.message}`);
    }
  }

  /**
   * Get all embeddings for a client
   * @param {string} clientId - Client identifier
   * @returns {Array} Client embeddings
   */
  async getClientEmbeddings(clientId) {
    try {
      let allEmbeddings = [];
      let lastEvaluatedKey = null;

      do {
        const params = {
          TableName: 'StackPro-AIEmbeddings',
          KeyConditionExpression: 'clientId = :clientId',
          FilterExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type'
          },
          ExpressionAttributeValues: {
            ':clientId': clientId,
            ':type': 'embedding-chunk'
          }
        };

        if (lastEvaluatedKey) {
          params.ExclusiveStartKey = lastEvaluatedKey;
        }

        const result = await this.dynamodb.query(params).promise();
        allEmbeddings = allEmbeddings.concat(result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;

      } while (lastEvaluatedKey);

      return allEmbeddings;
    } catch (error) {
      throw new Error(`Failed to retrieve client embeddings: ${error.message}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} vectorA - First vector
   * @param {Array} vectorB - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get document embeddings summary
   * @param {string} clientId - Client identifier
   * @param {string} documentId - Document identifier
   * @returns {Object} Embedding summary
   */
  async getDocumentEmbeddingsSummary(clientId, documentId) {
    try {
      const result = await this.dynamodb.query({
        TableName: 'StackPro-AIEmbeddings',
        KeyConditionExpression: 'clientId = :clientId AND begins_with(documentId, :documentId)',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':clientId': clientId,
          ':documentId': documentId,
          ':type': 'embedding-chunk'
        }
      }).promise();

      const chunks = result.Items;
      
      return {
        documentId,
        totalChunks: chunks.length,
        averageChunkLength: chunks.length > 0 ? 
          chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length : 0,
        firstChunkPreview: chunks.length > 0 ? chunks[0].content.substring(0, 200) + '...' : '',
        embeddingDimensions: chunks.length > 0 ? chunks[0].embedding.length : 0,
        generatedAt: chunks.length > 0 ? chunks[0].metadata.generatedAt : null
      };
    } catch (error) {
      throw new Error(`Failed to get embeddings summary: ${error.message}`);
    }
  }

  /**
   * Delete all embeddings for a document
   * @param {string} clientId - Client identifier
   * @param {string} documentId - Document identifier
   */
  async deleteDocumentEmbeddings(clientId, documentId) {
    try {
      // Get all chunks for the document
      const result = await this.dynamodb.query({
        TableName: 'StackPro-AIEmbeddings',
        KeyConditionExpression: 'clientId = :clientId AND begins_with(documentId, :documentId)',
        ExpressionAttributeValues: {
          ':clientId': clientId,
          ':documentId': documentId
        }
      }).promise();

      // Delete all chunks in batches
      const chunks = result.Items;
      const batchSize = 25; // DynamoDB batch limit

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const deleteRequests = batch.map(chunk => ({
          DeleteRequest: {
            Key: {
              clientId: chunk.clientId,
              documentId: chunk.documentId
            }
          }
        }));

        await this.dynamodb.batchWrite({
          RequestItems: {
            'StackPro-AIEmbeddings': deleteRequests
          }
        }).promise();
      }

      this.logger.info(`Deleted ${chunks.length} embedding chunks`, {
        clientId,
        documentId
      });

      return { success: true, deletedChunks: chunks.length };
    } catch (error) {
      throw new Error(`Failed to delete document embeddings: ${error.message}`);
    }
  }

  // Utility functions
  generateChunkId(documentId, chunkIndex) {
    return `${documentId}-chunk-${chunkIndex.toString().padStart(4, '0')}`;
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get embedding statistics for a client
   * @param {string} clientId - Client identifier
   */
  async getClientEmbeddingStats(clientId) {
    try {
      const embeddings = await this.getClientEmbeddings(clientId);
      
      if (embeddings.length === 0) {
        return {
          totalEmbeddings: 0,
          totalDocuments: 0,
          totalWords: 0,
          averageWordsPerChunk: 0
        };
      }

      const documentIds = [...new Set(embeddings.map(e => e.documentId))];
      const totalWords = embeddings.reduce((sum, e) => sum + (e.metadata?.wordCount || 0), 0);

      return {
        totalEmbeddings: embeddings.length,
        totalDocuments: documentIds.length,
        totalWords,
        averageWordsPerChunk: Math.round(totalWords / embeddings.length),
        oldestEmbedding: Math.min(...embeddings.map(e => new Date(e.timestamp).getTime())),
        newestEmbedding: Math.max(...embeddings.map(e => new Date(e.timestamp).getTime()))
      };
    } catch (error) {
      throw new Error(`Failed to get embedding stats: ${error.message}`);
    }
  }
}

module.exports = EmbeddingService;
