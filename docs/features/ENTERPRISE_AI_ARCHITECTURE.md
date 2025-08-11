# StackPro Enterprise AI Architecture
## Per-Client AI Assistant & Knowledge Embedding System

### 🎯 **Executive Summary**
This document outlines the architecture for implementing isolated, context-aware AI assistants for each StackPro client, with per-client knowledge bases, vector storage, and secure document ingestion.

---

## 🏗️ **Architecture Overview**

### **Core Components:**
1. **Bedrock AI Gateway** - Centralized AI routing per client
2. **Per-Client S3 Knowledge Stores** - Isolated document storage
3. **Vector Database (DynamoDB + OpenSearch)** - Embeddings storage
4. **Document Ingestion Pipeline** - PDF/DOC/TXT processing
5. **Context Manager** - Chat history and session management
6. **AI Assistant API** - RESTful interface for frontend

---

## 🧠 **Bedrock Architecture for Client Isolation**

### **1. Multi-Tenant AI Gateway Pattern**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client A      │    │   AI Gateway     │    │   Bedrock       │
│   Request       ├────┤   (Lambda)       ├────┤   Claude 3.5    │
└─────────────────┘    │                  │    │   Sonnet        │
                       │  ┌─────────────┐ │    └─────────────────┘
┌─────────────────┐    │  │ IAM Role    │ │
│   Client B      │    │  │ Switcher    │ │    ┌─────────────────┐
│   Request       ├────┤  └─────────────┘ ├────┤   Bedrock       │
└─────────────────┘    │                  │    │   Titan         │
                       │  ┌─────────────┐ │    │   Embeddings    │
┌─────────────────┐    │  │ Context     │ │    └─────────────────┘
│   Client C      │    │  │ Injection   │ │
│   Request       ├────┤  └─────────────┘ │
└─────────────────┘    └──────────────────┘
```

### **2. Client-Specific IAM Role Architecture**
```javascript
// Each client gets dedicated IAM roles
const clientRoles = {
  "client-123": {
    bedrock: "arn:aws:iam::account:role/StackPro-Client-123-Bedrock",
    s3: "arn:aws:iam::account:role/StackPro-Client-123-S3",
    dynamodb: "arn:aws:iam::account:role/StackPro-Client-123-DynamoDB"
  }
};

// Role assumption for secure client isolation
const assumeClientRole = async (clientId, service) => {
  const roleArn = clientRoles[clientId][service];
  return await sts.assumeRole({
    RoleArn: roleArn,
    RoleSessionName: `StackPro-${clientId}-${service}`
  }).promise();
};
```

---

## 📚 **Knowledge Base Architecture**

### **1. S3 Folder Structure Per Client**
```
stackpro-knowledge-base/
├── client-123/
│   ├── documents/
│   │   ├── raw/          # Original uploaded files
│   │   ├── processed/    # Text extracted content
│   │   └── metadata/     # File metadata and indexing
│   ├── embeddings/       # Vector chunks
│   └── index/           # Search indices
├── client-456/
│   └── [same structure]
└── templates/           # Shared knowledge templates
```

### **2. Document Processing Pipeline**
```
Upload → S3 → Lambda → Text Extraction → Chunking → Embeddings → DynamoDB/OpenSearch
   ↓
PDF/DOC → Textract → Claude 3.5 → Titan → Vector Store
```

---

## 🔍 **Vector Storage Strategy**

### **1. Hybrid DynamoDB + OpenSearch Approach**
- **DynamoDB**: Fast metadata, chat history, user sessions
- **OpenSearch**: Complex vector similarity search, analytics
- **Titan Embeddings**: 1536-dimensional vectors for semantic search

### **2. Vector Schema Design**
```json
{
  "client_id": "client-123",
  "document_id": "doc-456",
  "chunk_id": "chunk-789",
  "embedding": [0.1, -0.2, 0.8, ...], // 1536 dimensions
  "content": "Original text chunk",
  "metadata": {
    "source_file": "contract.pdf",
    "page": 3,
    "created_at": "2025-01-15T10:30:00Z",
    "content_type": "legal_document"
  },
  "ttl": 1735689600 // Auto-cleanup old embeddings
}
```

---

## 🤖 **Claude Assistant Configuration**

### **1. Per-Client System Prompts**
```javascript
const clientPrompts = {
  "client-123": {
    industry: "legal",
    systemPrompt: `
You are a legal assistant for Johnson & Associates Law Firm.
You have access to their case files, contracts, and legal documents.
Always maintain attorney-client privilege and provide accurate legal guidance.
Reference specific documents when answering questions.
    `,
    context: {
      companyName: "Johnson & Associates",
      industry: "Legal Services",
      specialties: ["Corporate Law", "Real Estate", "Family Law"]
    }
  }
};
```

### **2. Context-Aware Response Generation**
```javascript
const generateResponse = async (clientId, userMessage, chatHistory) => {
  // 1. Get client configuration
  const clientConfig = await getClientConfig(clientId);
  
  // 2. Retrieve relevant knowledge
  const relevantDocs = await vectorSearch(clientId, userMessage);
  
  // 3. Build context
  const context = buildContextPrompt(clientConfig, relevantDocs, chatHistory);
  
  // 4. Generate response with Claude
  const response = await bedrock.invokeModel({
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 4000,
      system: context.systemPrompt,
      messages: context.messages
    })
  });
  
  return response;
};
```

---

## 📤 **Document Ingestion System**

### **1. Upload Flow**
```javascript
// Frontend upload component
const DocumentUpload = ({ clientId }) => {
  const handleUpload = async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    
    const response = await fetch(`/api/ai/clients/${clientId}/documents`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.json();
  };
};
```

### **2. Backend Processing**
```javascript
// API endpoint for document upload
app.post('/api/ai/clients/:clientId/documents', async (req, res) => {
  const { clientId } = req.params;
  
  // 1. Validate client access
  await validateClientAccess(req.user, clientId);
  
  // 2. Upload to client-specific S3 folder
  const uploadResults = await uploadToS3(clientId, req.files);
  
  // 3. Trigger processing pipeline
  await triggerDocumentProcessing(clientId, uploadResults);
  
  res.json({ success: true, documents: uploadResults });
});

// Document processing Lambda
const processDocument = async (event) => {
  const { clientId, documentKey } = event;
  
  // 1. Extract text from document
  const text = await extractText(documentKey);
  
  // 2. Chunk text into manageable pieces
  const chunks = await chunkText(text, 1000); // 1000 char chunks
  
  // 3. Generate embeddings
  const embeddings = await Promise.all(
    chunks.map(chunk => generateEmbedding(chunk))
  );
  
  // 4. Store in vector database
  await storeEmbeddings(clientId, documentKey, chunks, embeddings);
  
  // 5. Update search index
  await updateSearchIndex(clientId, documentKey, text);
};
```

---

## 🔐 **Security & Isolation**

### **1. IAM Policy per Client**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/ClientId": "${aws:PrincipalTag/ClientId}"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::stackpro-knowledge-base/${aws:PrincipalTag/ClientId}/*"
    }
  ]
}
```

### **2. Request Validation & Scoping**
```javascript
const validateAndScopeRequest = async (req, res, next) => {
  const { clientId } = req.params;
  const userClientIds = req.user.clientIds || [];
  
  // Ensure user has access to this client
  if (!userClientIds.includes(clientId)) {
    return res.status(403).json({ error: 'Access denied to client data' });
  }
  
  // Add client scoping to request context
  req.clientContext = {
    id: clientId,
    s3Prefix: `client-${clientId}/`,
    dynamoTable: `StackPro-Client-${clientId}`,
    iamRole: `StackPro-Client-${clientId}-Role`
  };
  
  next();
};
```

---

## 📊 **Usage Tracking & Monitoring**

### **1. AI Usage Metrics**
```javascript
const trackAIUsage = async (clientId, operation, tokens, cost) => {
  await cloudWatch.putMetricData({
    Namespace: 'StackPro/AI',
    MetricData: [
      {
        MetricName: 'TokenUsage',
        Dimensions: [
          { Name: 'ClientId', Value: clientId },
          { Name: 'Operation', Value: operation }
        ],
        Value: tokens,
        Timestamp: new Date()
      },
      {
        MetricName: 'Cost',
        Dimensions: [
          { Name: 'ClientId', Value: clientId }
        ],
        Value: cost,
        Timestamp: new Date()
      }
    ]
  }).promise();
};
```

### **2. Knowledge Base Analytics**
- Document upload frequency
- Query patterns and popular topics
- Response quality metrics
- Knowledge gap identification

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Week 1-2)**
1. Set up Bedrock access and IAM roles
2. Create S3 bucket structure
3. Implement basic document upload API
4. Set up DynamoDB tables for embeddings

### **Phase 2: AI Integration (Week 3-4)**
1. Implement Titan embeddings generation
2. Build vector search functionality
3. Create Claude integration with context injection
4. Develop chat history management

### **Phase 3: Advanced Features (Week 5-6)**
1. Document processing pipeline
2. Real-time chat interface
3. Knowledge base management UI
4. Usage tracking and analytics

### **Phase 4: Optimization (Week 7-8)**
1. Performance optimization
2. Advanced security hardening
3. Cost optimization strategies
4. Monitoring and alerting

---

## 💰 **Cost Optimization Strategies**

### **1. Intelligent Caching**
- Cache frequently accessed embeddings
- Reuse similar queries with semantic similarity
- Implement response caching for common questions

### **2. Usage-Based Scaling**
- Auto-scale OpenSearch clusters based on usage
- Implement cold storage for old documents
- Use Spot instances for batch processing

### **3. Model Selection**
- Use Haiku for simple queries, Sonnet for complex analysis
- Implement query classification for optimal model routing
- Cache embeddings to avoid regeneration

---

## 📈 **Success Metrics**

### **Business Metrics**
- Client engagement with AI features
- Time saved through AI assistance
- Knowledge base utilization rates
- Client satisfaction scores

### **Technical Metrics**
- Response time (< 3 seconds target)
- Accuracy of retrieved documents
- System uptime (99.9% target)
- Cost per AI interaction

---

## 🔄 **Next Steps**

1. **Start with Phase 1** - Foundation implementation
2. **Create client onboarding flow** for AI features
3. **Implement usage billing** integration with Stripe
4. **Build admin dashboard** for AI analytics
5. **Plan integration** with existing site builder

This architecture provides a solid foundation for enterprise-grade AI features while maintaining strict client isolation and cost efficiency.
