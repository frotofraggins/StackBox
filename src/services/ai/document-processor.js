const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mammoth = require('mammoth'); // For DOCX files
const pdf2pic = require('pdf2pic'); // For PDF files
const textract = require('textract'); // For various document formats

class DocumentProcessor {
  constructor() {
    this.s3 = new AWS.S3();
    this.textract = new AWS.Textract();
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.logger = require('../logger');
    
    this.bucketName = 'stackpro-knowledge-base';
    this.supportedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Process uploaded document for a client
   * @param {string} clientId - Client identifier
   * @param {Object} fileData - File data from upload
   * @param {Buffer} fileBuffer - File content buffer
   * @returns {Object} Processing result
   */
  async processDocument(clientId, fileData, fileBuffer) {
    const startTime = Date.now();
    const documentId = this.generateDocumentId();
    
    try {
      this.logger.info(`Starting document processing`, {
        clientId,
        documentId,
        fileName: fileData.originalname,
        fileSize: fileBuffer.length,
        mimeType: fileData.mimetype
      });

      // Validate file
      await this.validateFile(fileData, fileBuffer);

      // Store original file in S3
      const rawKey = await this.storeRawFile(clientId, documentId, fileData, fileBuffer);

      // Extract text content
      const textContent = await this.extractText(fileData, fileBuffer);

      // Store processed text
      const processedKey = await this.storeProcessedText(clientId, documentId, textContent);

      // Create document metadata
      const metadata = {
        clientId,
        documentId,
        fileName: fileData.originalname,
        fileSize: fileBuffer.length,
        mimeType: fileData.mimetype,
        rawS3Key: rawKey,
        processedS3Key: processedKey,
        textLength: textContent.length,
        wordCount: this.countWords(textContent),
        processingTime: Date.now() - startTime,
        processedAt: new Date().toISOString(),
        status: 'processed'
      };

      // Store metadata
      await this.storeMetadata(clientId, documentId, metadata);

      this.logger.info(`Document processing completed`, {
        clientId,
        documentId,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        documentId,
        metadata,
        textPreview: textContent.substring(0, 500) + '...'
      };

    } catch (error) {
      this.logger.error(`Document processing failed`, {
        clientId,
        documentId,
        fileName: fileData.originalname,
        error: error.message
      });

      // Store error metadata
      await this.storeErrorMetadata(clientId, documentId, {
        fileName: fileData.originalname,
        error: error.message,
        failedAt: new Date().toISOString()
      });

      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Validate uploaded file
   */
  async validateFile(fileData, fileBuffer) {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file extension
    const ext = path.extname(fileData.originalname).toLowerCase();
    if (!this.supportedTypes.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}. Supported types: ${this.supportedTypes.join(', ')}`);
    }

    // Basic file integrity check
    if (fileBuffer.length === 0) {
      throw new Error('File is empty');
    }

    return true;
  }

  /**
   * Store raw file in S3
   */
  async storeRawFile(clientId, documentId, fileData, fileBuffer) {
    const key = `${clientId}/documents/raw/${documentId}/${fileData.originalname}`;
    
    await this.s3.upload({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileData.mimetype,
      Metadata: {
        'client-id': clientId,
        'document-id': documentId,
        'original-name': fileData.originalname,
        'uploaded-at': new Date().toISOString()
      },
      Tags: [
        { Key: 'ClientId', Value: clientId },
        { Key: 'DocumentId', Value: documentId },
        { Key: 'Type', Value: 'raw-document' }
      ].map(tag => `${tag.Key}=${tag.Value}`).join('&')
    }).promise();

    return key;
  }

  /**
   * Extract text content from various file types
   */
  async extractText(fileData, fileBuffer) {
    const ext = path.extname(fileData.originalname).toLowerCase();
    
    try {
      switch (ext) {
        case '.txt':
        case '.md':
          return fileBuffer.toString('utf-8');
          
        case '.pdf':
          return await this.extractFromPDF(fileBuffer);
          
        case '.docx':
          return await this.extractFromDOCX(fileBuffer);
          
        case '.doc':
          return await this.extractFromDOC(fileBuffer);
          
        case '.csv':
          return await this.extractFromCSV(fileBuffer);
          
        default:
          throw new Error(`Text extraction not implemented for ${ext} files`);
      }
    } catch (error) {
      this.logger.warn(`Primary text extraction failed, trying Textract`, {
        fileName: fileData.originalname,
        error: error.message
      });
      
      // Fallback to AWS Textract for supported formats
      return await this.extractWithTextract(fileBuffer, fileData.mimetype);
    }
  }

  /**
   * Extract text from PDF using AWS Textract
   */
  async extractFromPDF(fileBuffer) {
    try {
      const result = await this.textract.detectDocumentText({
        Document: {
          Bytes: fileBuffer
        }
      }).promise();

      const text = result.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');

      if (!text.trim()) {
        throw new Error('No text content found in PDF');
      }

      return text;
    } catch (error) {
      // Fallback to pdf2pic + OCR if Textract fails
      this.logger.warn('Textract PDF extraction failed, trying alternative method', {
        error: error.message
      });
      
      return await this.extractPDFWithOCR(fileBuffer);
    }
  }

  /**
   * Fallback PDF extraction using pdf2pic
   */
  async extractPDFWithOCR(fileBuffer) {
    // For now, return a placeholder - in production, you'd implement OCR
    return 'PDF text extraction requires OCR setup - placeholder text for now';
  }

  /**
   * Extract text from DOCX files
   */
  async extractFromDOCX(fileBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      
      if (!result.value.trim()) {
        throw new Error('No text content found in DOCX file');
      }
      
      return result.value;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOC files using textract
   */
  async extractFromDOC(fileBuffer) {
    return new Promise((resolve, reject) => {
      textract.fromBufferWithMime('application/msword', fileBuffer, (error, text) => {
        if (error) {
          reject(new Error(`DOC extraction failed: ${error.message}`));
        } else {
          resolve(text || '');
        }
      });
    });
  }

  /**
   * Extract text from CSV files
   */
  async extractFromCSV(fileBuffer) {
    const csvContent = fileBuffer.toString('utf-8');
    
    // Convert CSV to readable text format
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Use first line as headers if it looks like headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    let text = `CSV Data with ${headers.length} columns and ${dataLines.length} rows:\n\n`;
    text += `Headers: ${headers.join(', ')}\n\n`;
    
    // Include sample data (first 10 rows)
    const sampleRows = dataLines.slice(0, 10);
    sampleRows.forEach((row, index) => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      text += `Row ${index + 1}:\n`;
      headers.forEach((header, i) => {
        text += `  ${header}: ${values[i] || ''}\n`;
      });
      text += '\n';
    });
    
    if (dataLines.length > 10) {
      text += `... and ${dataLines.length - 10} more rows\n`;
    }
    
    return text;
  }

  /**
   * Fallback extraction using AWS Textract
   */
  async extractWithTextract(fileBuffer, mimeType) {
    try {
      const result = await this.textract.detectDocumentText({
        Document: {
          Bytes: fileBuffer
        }
      }).promise();

      return result.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');
        
    } catch (error) {
      throw new Error(`Textract extraction failed: ${error.message}`);
    }
  }

  /**
   * Store processed text in S3
   */
  async storeProcessedText(clientId, documentId, textContent) {
    const key = `${clientId}/documents/processed/${documentId}/text.txt`;
    
    await this.s3.upload({
      Bucket: this.bucketName,
      Key: key,
      Body: textContent,
      ContentType: 'text/plain',
      Metadata: {
        'client-id': clientId,
        'document-id': documentId,
        'processed-at': new Date().toISOString(),
        'text-length': textContent.length.toString()
      },
      Tags: [
        { Key: 'ClientId', Value: clientId },
        { Key: 'DocumentId', Value: documentId },
        { Key: 'Type', Value: 'processed-text' }
      ].map(tag => `${tag.Key}=${tag.Value}`).join('&')
    }).promise();

    return key;
  }

  /**
   * Store document metadata in DynamoDB
   */
  async storeMetadata(clientId, documentId, metadata) {
    await this.dynamodb.put({
      TableName: 'StackPro-AIEmbeddings',
      Item: {
        clientId,
        documentId,
        ...metadata,
        type: 'document-metadata',
        timestamp: new Date().toISOString()
      }
    }).promise();
  }

  /**
   * Store error metadata
   */
  async storeErrorMetadata(clientId, documentId, errorData) {
    try {
      await this.dynamodb.put({
        TableName: 'StackPro-AIEmbeddings',
        Item: {
          clientId,
          documentId,
          ...errorData,
          type: 'document-error',
          timestamp: new Date().toISOString()
        }
      }).promise();
    } catch (error) {
      this.logger.error('Failed to store error metadata', { error: error.message });
    }
  }

  /**
   * Get document metadata
   */
  async getDocumentMetadata(clientId, documentId) {
    try {
      const result = await this.dynamodb.get({
        TableName: 'StackPro-AIEmbeddings',
        Key: {
          clientId,
          documentId
        }
      }).promise();

      return result.Item || null;
    } catch (error) {
      throw new Error(`Failed to retrieve document metadata: ${error.message}`);
    }
  }

  /**
   * Get processed text from S3
   */
  async getProcessedText(clientId, documentId) {
    try {
      const metadata = await this.getDocumentMetadata(clientId, documentId);
      if (!metadata || !metadata.processedS3Key) {
        throw new Error('Document not found or not processed');
      }

      const result = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: metadata.processedS3Key
      }).promise();

      return result.Body.toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to retrieve processed text: ${error.message}`);
    }
  }

  /**
   * List documents for a client
   */
  async listClientDocuments(clientId) {
    try {
      const result = await this.dynamodb.query({
        TableName: 'StackPro-AIEmbeddings',
        KeyConditionExpression: 'clientId = :clientId',
        FilterExpression: '#type = :type',
        ExpressionAttributeNames: {
          '#type': 'type'
        },
        ExpressionAttributeValues: {
          ':clientId': clientId,
          ':type': 'document-metadata'
        }
      }).promise();

      return result.Items.map(item => ({
        documentId: item.documentId,
        fileName: item.fileName,
        fileSize: item.fileSize,
        mimeType: item.mimeType,
        wordCount: item.wordCount,
        processedAt: item.processedAt,
        status: item.status
      }));
    } catch (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }
  }

  /**
   * Delete document and all associated data
   */
  async deleteDocument(clientId, documentId) {
    try {
      const metadata = await this.getDocumentMetadata(clientId, documentId);
      if (!metadata) {
        throw new Error('Document not found');
      }

      // Delete from S3
      const objectsToDelete = [];
      if (metadata.rawS3Key) {
        objectsToDelete.push({ Key: metadata.rawS3Key });
      }
      if (metadata.processedS3Key) {
        objectsToDelete.push({ Key: metadata.processedS3Key });
      }

      if (objectsToDelete.length > 0) {
        await this.s3.deleteObjects({
          Bucket: this.bucketName,
          Delete: {
            Objects: objectsToDelete
          }
        }).promise();
      }

      // Delete metadata from DynamoDB
      await this.dynamodb.delete({
        TableName: 'StackPro-AIEmbeddings',
        Key: {
          clientId,
          documentId
        }
      }).promise();

      this.logger.info(`Document deleted successfully`, {
        clientId,
        documentId,
        fileName: metadata.fileName
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Utility functions
  generateDocumentId() {
    return `doc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = DocumentProcessor;
