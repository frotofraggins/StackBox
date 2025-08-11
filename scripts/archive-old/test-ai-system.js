#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Import our AI services
const DocumentProcessor = require('../src/services/ai/document-processor');
const EmbeddingService = require('../src/services/ai/embedding-service');
const ClaudeAssistant = require('../src/services/ai/claude-assistant');

class AISystemTester {
  constructor() {
    this.testClientId = 'test-client-' + Date.now();
    this.documentProcessor = new DocumentProcessor();
    this.embeddingService = new EmbeddingService();
    this.claudeAssistant = new ClaudeAssistant();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting StackPro AI System Tests...\n');
    
    try {
      // Test 1: Document Processing
      await this.testDocumentProcessing();
      
      // Test 2: Embedding Generation
      await this.testEmbeddingGeneration();
      
      // Test 3: Vector Search
      await this.testVectorSearch();
      
      // Test 4: AI Chat with RAG
      await this.testAIChat();
      
      // Test 5: Conversation Management
      await this.testConversationManagement();
      
      // Test 6: System Integration
      await this.testSystemIntegration();
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testDocumentProcessing() {
    console.log('📄 Testing Document Processing...');
    
    try {
      // Create test document
      const testText = `
        Test Business Document
        
        This is a sample business document for testing StackPro's AI capabilities.
        
        Our company provides excellent legal services to clients nationwide.
        We specialize in corporate law, contract negotiations, and litigation support.
        
        Key Services:
        - Contract Review and Drafting
        - Corporate Compliance
        - Merger and Acquisition Support
        - Litigation Management
        
        Contact Information:
        Phone: (555) 123-4567
        Email: info@testlaw.com
        Address: 123 Business St, City, State 12345
      `;
      
      const testFile = {
        originalname: 'test-document.txt',
        mimetype: 'text/plain',
        size: Buffer.byteLength(testText)
      };
      
      const testBuffer = Buffer.from(testText);
      
      // Process document
      const result = await this.documentProcessor.processDocument(
        this.testClientId,
        testFile,
        testBuffer
      );
      
      this.addTestResult('Document Processing', true, {
        documentId: result.documentId,
        wordCount: result.metadata.wordCount,
        processingTime: result.metadata.processingTime
      });
      
      this.testDocumentId = result.documentId;
      
    } catch (error) {
      this.addTestResult('Document Processing', false, { error: error.message });
      throw error;
    }
  }

  async testEmbeddingGeneration() {
    console.log('🔢 Testing Embedding Generation...');
    
    try {
      if (!this.testDocumentId) {
        throw new Error('No test document available');
      }
      
      // Get processed text
      const processedText = await this.documentProcessor.getProcessedText(
        this.testClientId,
        this.testDocumentId
      );
      
      // Generate embeddings
      const result = await this.embeddingService.generateDocumentEmbeddings(
        this.testClientId,
        this.testDocumentId,
        processedText
      );
      
      this.addTestResult('Embedding Generation', true, {
        totalChunks: result.totalChunks,
        successfulChunks: result.successfulChunks,
        processingTime: result.processingTime
      });
      
    } catch (error) {
      this.addTestResult('Embedding Generation', false, { error: error.message });
      throw error;
    }
  }

  async testVectorSearch() {
    console.log('🔍 Testing Vector Search...');
    
    try {
      // Test search queries
      const testQueries = [
        'legal services',
        'contract review',
        'contact information',
        'business address'
      ];
      
      const searchResults = [];
      
      for (const query of testQueries) {
        const results = await this.embeddingService.searchSimilarContent(
          this.testClientId,
          query,
          3
        );
        
        searchResults.push({
          query,
          resultCount: results.length,
          topSimilarity: results.length > 0 ? results[0].similarity : 0
        });
      }
      
      this.addTestResult('Vector Search', true, { searchResults });
      
    } catch (error) {
      this.addTestResult('Vector Search', false, { error: error.message });
      throw error;
    }
  }

  async testAIChat() {
    console.log('🤖 Testing AI Chat with RAG...');
    
    try {
      // Create conversation
      const conversationId = await this.claudeAssistant.createConversation(
        this.testClientId,
        'AI System Test'
      );
      
      // Test questions
      const testQuestions = [
        'What services does this business provide?',
        'What is the contact information?',
        'Tell me about the legal services offered.'
      ];
      
      const chatResults = [];
      
      for (const question of testQuestions) {
        const response = await this.claudeAssistant.generateResponse(
          this.testClientId,
          question,
          conversationId
        );
        
        chatResults.push({
          question,
          responseLength: response.response.content.length,
          contextChunks: response.context.chunksUsed,
          tokensUsed: response.metadata.tokensUsed
        });
      }
      
      this.addTestResult('AI Chat with RAG', true, { chatResults });
      this.testConversationId = conversationId;
      
    } catch (error) {
      this.addTestResult('AI Chat with RAG', false, { error: error.message });
      throw error;
    }
  }

  async testConversationManagement() {
    console.log('💬 Testing Conversation Management...');
    
    try {
      // List conversations
      const conversations = await this.claudeAssistant.getClientConversations(
        this.testClientId
      );
      
      // Verify our test conversation exists
      const testConversation = conversations.find(
        conv => conv.conversationId === this.testConversationId
      );
      
      if (!testConversation) {
        throw new Error('Test conversation not found in conversation list');
      }
      
      this.addTestResult('Conversation Management', true, {
        totalConversations: conversations.length,
        testConversationFound: true
      });
      
    } catch (error) {
      this.addTestResult('Conversation Management', false, { error: error.message });
      throw error;
    }
  }

  async testSystemIntegration() {
    console.log('🔧 Testing System Integration...');
    
    try {
      // Test getting AI stats
      const documents = await this.documentProcessor.listClientDocuments(this.testClientId);
      const embeddingStats = await this.embeddingService.getClientEmbeddingStats(this.testClientId);
      const conversations = await this.claudeAssistant.getClientConversations(this.testClientId);
      
      // Update client configuration
      await this.claudeAssistant.updateClientConfig(this.testClientId, {
        businessName: 'Test Legal Firm',
        industry: 'legal',
        responseStyle: 'professional'
      });
      
      this.addTestResult('System Integration', true, {
        documentsCount: documents.length,
        embeddingsCount: embeddingStats.totalEmbeddings,
        conversationsCount: conversations.length,
        configUpdated: true
      });
      
    } catch (error) {
      this.addTestResult('System Integration', false, { error: error.message });
    }
  }

  addTestResult(testName, success, data = {}) {
    this.testResults.push({
      test: testName,
      success,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${success ? 'PASSED' : 'FAILED'}`);
    
    if (data.error) {
      console.log(`   Error: ${data.error}`);
    } else if (success && Object.keys(data).length > 0) {
      console.log(`   Details: ${JSON.stringify(data, null, 2)}`);
    }
    console.log('');
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${passRate}%\n`);
    
    if (passRate === 100) {
      console.log('🎉 All tests passed! Your AI system is ready for production.');
    } else if (passRate >= 80) {
      console.log('⚠️  Most tests passed, but some issues need attention.');
    } else {
      console.log('❌ Multiple test failures detected. Please review the errors.');
    }
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    // Cleanup recommendation
    console.log('\n🧹 Cleanup:');
    console.log(`To clean up test data, run:`);
    console.log(`node scripts/cleanup-test-data.js ${this.testClientId}`);
  }
}

// Infrastructure validation
async function validateInfrastructure() {
  console.log('🏗️ Validating AWS Infrastructure...\n');
  
  const checks = [
    {
      name: 'S3 Bucket Access',
      test: async () => {
        const s3 = new AWS.S3();
        await s3.headBucket({ Bucket: 'stackpro-knowledge-base' }).promise();
      }
    },
    {
      name: 'DynamoDB Tables',
      test: async () => {
        const dynamodb = new AWS.DynamoDB();
        const tables = ['StackPro-AIEmbeddings', 'StackPro-ChatHistory', 'StackPro-AIUsage'];
        
        for (const tableName of tables) {
          await dynamodb.describeTable({ TableName: tableName }).promise();
        }
      }
    },
    {
      name: 'Bedrock Access',
      test: async () => {
        const bedrock = new AWS.BedrockRuntime();
        
        // Test Titan Embeddings
        await bedrock.invokeModel({
          modelId: 'amazon.titan-embed-text-v1',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            inputText: 'Infrastructure test'
          })
        }).promise();
      }
    }
  ];
  
  for (const check of checks) {
    try {
      await check.test();
      console.log(`✅ ${check.name}: Available`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      return false;
    }
  }
  
  console.log('\n🎉 Infrastructure validation complete!\n');
  return true;
}

// Main execution
async function main() {
  try {
    // Check if infrastructure setup is required
    if (process.argv.includes('--setup-infrastructure')) {
      console.log('Setting up infrastructure first...\n');
      const setup = require('./setup-ai-infrastructure');
      await new setup().setup();
      console.log('\n');
    }
    
    // Validate infrastructure
    const infraReady = await validateInfrastructure();
    if (!infraReady) {
      console.log('❌ Infrastructure not ready. Run: node scripts/setup-ai-infrastructure.js');
      process.exit(1);
    }
    
    // Run tests
    const tester = new AISystemTester();
    await tester.runAllTests();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AISystemTester;
