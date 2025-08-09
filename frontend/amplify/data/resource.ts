import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * StackPro Comprehensive Schema - Production Ready
 * Features: User Profiles, Website Builder, Messaging, Subscriptions
 * AI Features: DISABLED (as requested)
 */
const schema = a.schema({
  // USER MANAGEMENT
  UserProfile: a
    .model({
      email: a.string().required(),
      displayName: a.string(),
      avatarUrl: a.string(),
      company: a.string(),
      role: a.string(),
      bio: a.string(),
      subscriptionTier: a.enum(['FREE', 'PRO', 'ENTERPRISE']),
      subscriptionStatus: a.enum(['ACTIVE', 'INACTIVE', 'TRIAL', 'CANCELLED']),
      trialEndsAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner(), allow.groups(['admins'])]),

  // WEBSITE BUILDER SYSTEM
  Project: a
    .model({
      name: a.string().required(),
      description: a.string(),
      domain: a.string(),
      customDomain: a.string(),
      isPublished: a.boolean().default(false),
      template: a.string(),
      settings: a.json(), // Project-level settings
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      pages: a.hasMany('Page', 'projectId'),
      components: a.hasMany('Component', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  Page: a
    .model({
      projectId: a.id().required(),
      name: a.string().required(),
      slug: a.string().required(),
      title: a.string(),
      metaDescription: a.string(),
      content: a.json(), // Page content/layout
      isHomepage: a.boolean().default(false),
      isPublished: a.boolean().default(false),
      order: a.integer(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  Component: a
    .model({
      projectId: a.id().required(),
      name: a.string().required(),
      type: a.enum(['HEADER', 'FOOTER', 'HERO', 'CONTENT', 'FORM', 'GALLERY', 'CUSTOM']),
      config: a.json(), // Component configuration
      styles: a.json(), // Custom styling
      content: a.json(), // Component content
      isReusable: a.boolean().default(true),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // MESSAGING SYSTEM
  Conversation: a
    .model({
      name: a.string(),
      type: a.enum(['DIRECT', 'GROUP', 'SUPPORT']),
      participants: a.string().array(), // Array of user IDs
      lastMessageAt: a.datetime(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      messages: a.hasMany('Message', 'conversationId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groupsDefinedIn('participants'),
    ]),

  Message: a
    .model({
      conversationId: a.id().required(),
      content: a.string().required(),
      type: a.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']),
      fileUrl: a.string(),
      fileName: a.string(),
      isRead: a.boolean().default(false),
      readBy: a.string().array(), // Array of user IDs who read this message
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      conversation: a.belongsTo('Conversation', 'conversationId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groupsDefinedIn('conversation.participants'),
    ]),

  // NOTIFICATION SYSTEM
  Notification: a
    .model({
      title: a.string().required(),
      message: a.string().required(),
      type: a.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM']),
      category: a.enum(['MESSAGE', 'PROJECT', 'BILLING', 'SYSTEM', 'SECURITY']),
      isRead: a.boolean().default(false),
      actionUrl: a.string(),
      metadata: a.json(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // BILLING & SUBSCRIPTION MANAGEMENT
  Subscription: a
    .model({
      tier: a.enum(['FREE', 'PRO', 'ENTERPRISE']),
      status: a.enum(['ACTIVE', 'INACTIVE', 'TRIAL', 'CANCELLED']),
      stripeCustomerId: a.string(),
      stripeSubscriptionId: a.string(),
      currentPeriodStart: a.datetime(),
      currentPeriodEnd: a.datetime(),
      trialStart: a.datetime(),
      trialEnd: a.datetime(),
      cancelAtPeriodEnd: a.boolean().default(false),
      metadata: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Invoice: a
    .model({
      stripeInvoiceId: a.string().required(),
      amount: a.integer().required(), // Amount in cents
      currency: a.string().default('usd'),
      status: a.enum(['DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE']),
      paidAt: a.datetime(),
      dueDate: a.datetime(),
      description: a.string(),
      downloadUrl: a.string(),
      metadata: a.json(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  // ANALYTICS & USAGE TRACKING
  ProjectAnalytics: a
    .model({
      projectId: a.id().required(),
      pageViews: a.integer().default(0),
      uniqueVisitors: a.integer().default(0),
      bounceRate: a.float(),
      avgSessionDuration: a.integer(), // in seconds
      topPages: a.json(),
      referrerSources: a.json(),
      deviceBreakdown: a.json(),
      geographicData: a.json(),
      date: a.date().required(), // Date for this analytics record
      createdAt: a.datetime(),
      project: a.belongsTo('Project', 'projectId'),
    })
    .authorization((allow) => [allow.owner()]),

  // SUPPORT SYSTEM  
  SupportTicket: a
    .model({
      subject: a.string().required(),
      description: a.string().required(),
      category: a.enum(['TECHNICAL', 'BILLING', 'GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST']),
      priority: a.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      status: a.enum(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']),
      assignedTo: a.string(), // Admin user ID
      attachments: a.string().array(),
      metadata: a.json(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
      responses: a.hasMany('SupportResponse', 'ticketId'),
    })
    .authorization((allow) => [allow.owner(), allow.groups(['admins', 'support'])]),

  SupportResponse: a
    .model({
      ticketId: a.id().required(),
      message: a.string().required(),
      isFromAdmin: a.boolean().default(false),
      attachments: a.string().array(),
      createdAt: a.datetime(),
      ticket: a.belongsTo('SupportTicket', 'ticketId'),
    })
    .authorization((allow) => [allow.owner(), allow.groups(['admins', 'support'])]),

  // TEMPLATE SYSTEM
  Template: a
    .model({
      name: a.string().required(),
      description: a.string(),
      category: a.enum(['BUSINESS', 'PORTFOLIO', 'BLOG', 'ECOMMERCE', 'LANDING', 'CUSTOM']),
      thumbnail: a.string(),
      previewUrl: a.string(),
      config: a.json(), // Template configuration
      components: a.json(), // Template components
      styles: a.json(), // Template styles
      isPremium: a.boolean().default(false),
      isActive: a.boolean().default(true),
      usageCount: a.integer().default(0),
      rating: a.float(),
      tags: a.string().array(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.groups(['admins']).to(['create', 'update', 'delete'])
    ]),

  // SYSTEM SETTINGS
  SystemSettings: a
    .model({
      key: a.string().required(),
      value: a.json().required(),
      category: a.enum(['GENERAL', 'BILLING', 'FEATURES', 'LIMITS', 'MAINTENANCE']),
      description: a.string(),
      isPublic: a.boolean().default(false),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.groups(['admins']).to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
      description: 'API key for public templates and system data'
    }
  },
});
