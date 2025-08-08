import { defineBackend } from '@aws-amplify/backend';
import { defineAuth } from '@aws-amplify/backend';
import { defineData } from '@aws-amplify/backend';

// Auth configuration with email/password
const auth = defineAuth({
  loginWith: {
    email: true,
  },
});

// Enhanced data schema with all AI and business functionality

// Enhanced Data Schema with AI and business features
const data = defineData({
  schema: /* GraphQL */ `
    # User Profile Management
    type UserProfile @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      email: AWSEmail!
      username: String
      businessName: String
      industry: String
      subscription: String
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    # AI Chat Conversations
    type ChatConversation @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      title: String!
      clientId: String! @index(name: "byClient")
      lastActivity: AWSDateTime!
      messageCount: Int!
      tags: [String]
      isArchived: Boolean
      createdAt: AWSDateTime!
      messages: [ChatMessage] @hasMany(indexName: "byConversation", fields: ["id"])
    }

    type ChatMessage @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      conversationId: ID! @index(name: "byConversation")
      role: ChatRole!
      content: String!
      sources: [DocumentSource]
      tokensUsed: Int
      timestamp: AWSDateTime!
      conversation: ChatConversation @belongsTo(fields: ["conversationId"])
    }

    enum ChatRole {
      USER
      ASSISTANT
      SYSTEM
    }

    type DocumentSource {
      documentId: String!
      similarity: Float!
      preview: String!
    }

    # Document Management
    type Document @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      clientId: String! @index(name: "byClient")
      filename: String!
      fileSize: Int!
      mimeType: String!
      s3Key: String!
      extractedText: String
      summary: String
      tags: [String]
      processed: Boolean!
      processingStatus: ProcessingStatus!
      uploadedAt: AWSDateTime!
      processedAt: AWSDateTime
    }

    enum ProcessingStatus {
      PENDING
      PROCESSING
      COMPLETED
      FAILED
    }

    # Site Builder
    type Website @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      clientId: String! @index(name: "byClient") 
      siteName: String!
      domain: String
      template: String!
      content: AWSJSON!
      isPublished: Boolean!
      publishedAt: AWSDateTime
      lastModified: AWSDateTime!
      pages: [WebPage] @hasMany(indexName: "byWebsite", fields: ["id"])
    }

    type WebPage @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      websiteId: ID! @index(name: "byWebsite")
      pageName: String!
      slug: String!
      content: AWSJSON!
      isPublished: Boolean!
      seoTitle: String
      seoDescription: String
      lastModified: AWSDateTime!
      website: Website @belongsTo(fields: ["websiteId"])
    }

    # Messaging System
    type MessageThread @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      clientId: String! @index(name: "byClient")
      participants: [String]!
      subject: String!
      lastMessage: String
      lastActivity: AWSDateTime!
      isArchived: Boolean!
      createdAt: AWSDateTime!
      messages: [ThreadMessage] @hasMany(indexName: "byThread", fields: ["id"])
    }

    type ThreadMessage @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      threadId: ID! @index(name: "byThread")
      senderId: String!
      senderEmail: String!
      content: String!
      attachments: [MessageAttachment]
      timestamp: AWSDateTime!
      isRead: Boolean!
      thread: MessageThread @belongsTo(fields: ["threadId"])
    }

    type MessageAttachment {
      filename: String!
      s3Key: String!
      fileSize: Int!
      mimeType: String!
    }

    # Business Analytics
    type UsageAnalytics @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      clientId: String! @index(name: "byClient")
      service: String! @index(name: "byService")
      usage: Int!
      cost: Float
      date: AWSDate! @index(name: "byDate")
      metadata: AWSJSON
    }

    # Subscription Management
    type Subscription @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      clientId: String! @index(name: "byClient")
      plan: SubscriptionPlan!
      status: SubscriptionStatus!
      stripeSubscriptionId: String
      currentPeriodStart: AWSDateTime!
      currentPeriodEnd: AWSDateTime!
      cancelAtPeriodEnd: Boolean!
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    enum SubscriptionPlan {
      FREE
      STARTER
      PROFESSIONAL
      ENTERPRISE
    }

    enum SubscriptionStatus {
      ACTIVE
      TRIALING
      PAST_DUE
      CANCELED
      INCOMPLETE
      INCOMPLETE_EXPIRED
    }

    # Todo items (keeping original)
    type Todo @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      content: String!
      done: Boolean!
      priority: Priority
      dueDate: AWSDateTime
      createdAt: AWSDateTime!
    }

    enum Priority {
      LOW
      MEDIUM
      HIGH
      URGENT
    }

    # Custom Queries and Mutations
    type Query {
      searchDocuments(clientId: String!, query: String!, limit: Int): [DocumentSearchResult]
        @function(name: "embedding-service") @auth(rules: [{ allow: private }])
      
      generateAIResponse(
        clientId: String!
        message: String!
        conversationId: String!
        useRAG: Boolean
      ): AIResponse
        @function(name: "claude-ai-assistant") @auth(rules: [{ allow: private }])
      
      getUsageAnalytics(clientId: String!, startDate: AWSDate!, endDate: AWSDate!): [UsageAnalytics]
        @auth(rules: [{ allow: owner }])
    }

    type Mutation {
      processDocument(documentId: String!): DocumentProcessingResult
        @function(name: "document-processor") @auth(rules: [{ allow: private }])
      
      publishWebsite(websiteId: String!): PublishResult
        @function(name: "site-builder") @auth(rules: [{ allow: private }])
        
      sendMessage(threadId: String!, content: String!, attachments: [String]): ThreadMessage
        @function(name: "messaging-service") @auth(rules: [{ allow: private }])
    }

    # Response Types
    type DocumentSearchResult {
      documentId: String!
      filename: String!
      similarity: Float!
      excerpt: String!
      createdAt: AWSDateTime!
    }

    type AIResponse {
      conversationId: String!
      content: String!
      sources: [DocumentSource]
      tokensUsed: Int!
      timestamp: AWSDateTime!
    }

    type DocumentProcessingResult {
      documentId: String!
      success: Boolean!
      extractedText: String
      summary: String
      error: String
    }

    type PublishResult {
      websiteId: String!
      success: Boolean!
      url: String
      error: String
    }

    # Subscriptions for real-time features
    type Subscription {
      onNewMessage(threadId: String!): ThreadMessage
        @aws_subscribe(mutations: ["sendMessage"])
      
      onDocumentProcessed(clientId: String!): Document
        @aws_subscribe(mutations: ["processDocument"])
    }
  `,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

export const backend = defineBackend({
  auth,
  data,
});
