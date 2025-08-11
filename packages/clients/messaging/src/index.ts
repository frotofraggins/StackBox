// Generated types from OpenAPI contract
export interface Thread {
  id: string
  title?: string | null
  participants: string[]
  createdAt: string
  updatedAt: string
  lastMessage?: Message | null
  unreadCount: number
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  text: string
  type: 'text' | 'system' | 'notification'
  createdAt: string
  editedAt?: string | null
  metadata?: Record<string, any>
}

export interface MessagingError {
  error: string
  code: 'VALIDATION_ERROR' | 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR' | 'NOT_FOUND' | 'RATE_LIMITED' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR'
  degraded?: boolean
  requestId?: string
}

// Response types with degraded flag
export interface ListThreadsResponse {
  threads: Thread[]
  cursor?: string | null
  hasMore?: boolean
  degraded: boolean
}

export interface GetThreadMessagesResponse {
  messages: Message[]
  thread: Thread
  cursor?: string | null
  hasMore?: boolean
  degraded: boolean
}

export interface SendMessageResponse {
  message: Message
  degraded: boolean
}

// Client configuration
export interface MessagingClientConfig {
  baseUrl: string
  getAuthToken?: () => Promise<string>
  timeoutMs?: number
  tenantId?: string
  clientId?: string
}

// Request options for individual calls
export interface RequestOptions {
  tenantId?: string
  clientId?: string
  requestId?: string
}

// Send message request body
export interface SendMessageRequest {
  threadId: string
  text: string
  type?: 'text' | 'system' | 'notification'
  metadata?: Record<string, any>
}

/**
 * StackPro Messaging Client
 * Lightweight, resilient client with graceful degradation
 */
export class MessagingClient {
  private config: Required<MessagingClientConfig>

  constructor(config: MessagingClientConfig) {
    this.config = {
      timeoutMs: 5000,
      getAuthToken: async () => '',
      tenantId: '',
      clientId: 'stackpro-messaging-client',
      ...config
    }
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
    requestOptions: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`
    
    // Build headers
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    
    // Add tenant context headers
    const tenantId = requestOptions.tenantId || this.config.tenantId
    const clientId = requestOptions.clientId || this.config.clientId
    const requestId = requestOptions.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (tenantId) headers.set('x-tenant-id', tenantId)
    if (clientId) headers.set('x-client-id', clientId)
    if (requestId) headers.set('x-request-id', requestId)
    
    // Add authentication
    if (this.config.getAuthToken) {
      try {
        const token = await this.config.getAuthToken()
        if (token) {
          headers.set('Authorization', `Bearer ${token}`)
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error)
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * List message threads
   * Returns safe fallback on failure
   */
  async listThreads(options: {
    limit?: number
    cursor?: string
  } & RequestOptions = {}): Promise<ListThreadsResponse> {
    try {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.cursor) params.set('cursor', options.cursor)
      
      const query = params.toString()
      const path = `/v1/threads${query ? `?${query}` : ''}`
      
      const response = await this.makeRequest<ListThreadsResponse>(path, {}, options)
      
      return {
        threads: response.threads || [],
        cursor: response.cursor,
        hasMore: response.hasMore || false,
        degraded: false
      }
    } catch (error) {
      console.warn('Messaging listThreads degraded:', error)
      return {
        threads: [],
        cursor: null,
        hasMore: false,
        degraded: true
      }
    }
  }

  /**
   * Get messages in a thread
   * Returns safe fallback on failure
   */
  async getThreadMessages(
    threadId: string,
    options: {
      limit?: number
      cursor?: string
    } & RequestOptions = {}
  ): Promise<GetThreadMessagesResponse> {
    try {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', options.limit.toString())
      if (options.cursor) params.set('cursor', options.cursor)
      
      const query = params.toString()
      const path = `/v1/threads/${encodeURIComponent(threadId)}/messages${query ? `?${query}` : ''}`
      
      const response = await this.makeRequest<GetThreadMessagesResponse>(path, {}, options)
      
      return {
        messages: response.messages || [],
        thread: response.thread || {
          id: threadId,
          participants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          unreadCount: 0
        },
        cursor: response.cursor,
        hasMore: response.hasMore || false,
        degraded: false
      }
    } catch (error) {
      console.warn('Messaging getThreadMessages degraded:', error)
      return {
        messages: [],
        thread: {
          id: threadId,
          participants: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          unreadCount: 0
        },
        cursor: null,
        hasMore: false,
        degraded: true
      }
    }
  }

  /**
   * Send a message to a thread
   * Returns safe fallback on failure
   */
  async sendMessage(
    request: SendMessageRequest,
    options: RequestOptions = {}
  ): Promise<SendMessageResponse> {
    try {
      const response = await this.makeRequest<SendMessageResponse>(
        '/v1/messages',
        {
          method: 'POST',
          body: JSON.stringify(request)
        },
        options
      )
      
      return {
        message: response.message || {
          id: `temp_${Date.now()}`,
          threadId: request.threadId,
          senderId: 'unknown',
          text: request.text,
          type: request.type || 'text',
          createdAt: new Date().toISOString()
        },
        degraded: false
      }
    } catch (error) {
      console.warn('Messaging sendMessage degraded:', error)
      return {
        message: {
          id: `temp_${Date.now()}`,
          threadId: request.threadId,
          senderId: 'unknown',
          text: request.text,
          type: request.type || 'text',
          createdAt: new Date().toISOString()
        },
        degraded: true
      }
    }
  }
}

/**
 * Factory function to create messaging client
 * Recommended way to instantiate the client
 */
export function createMessagingClient(config: MessagingClientConfig): MessagingClient {
  return new MessagingClient(config)
}
