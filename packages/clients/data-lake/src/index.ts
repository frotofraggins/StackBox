// Generated types from OpenAPI contract
export interface DatasetUpload {
  datasetId: string
  format: 'json' | 'csv'
  schema?: Record<string, any>
  data: Record<string, any>[]
  metadata?: Record<string, any>
}

export interface UploadResponse {
  success: boolean
  datasetId: string
  recordCount: number
  validationResults: {
    valid: boolean
    warnings: string[]
    errors: string[]
  }
  degraded: boolean
  requestId: string
}

export interface Dataset {
  datasetId: string
  status: 'uploaded' | 'processing' | 'ready' | 'error'
  recordCount: number
  schema?: Record<string, any>
  createdAt: string
  updatedAt: string
  metadata?: Record<string, any>
  degraded: boolean
  requestId: string
}

export interface DataLakeClientConfig {
  baseUrl: string
  getAuthToken?: () => Promise<string>
  timeoutMs?: number
  tenantId?: string
  clientId?: string
}

export interface RequestOptions {
  tenantId?: string
  clientId?: string
  requestId?: string
}

/**
 * StackPro Data Lake Client
 * Lightweight, resilient client with graceful degradation
 */
export class DataLakeClient {
  private config: Required<DataLakeClientConfig>

  constructor(config: DataLakeClientConfig) {
    this.config = {
      timeoutMs: 10000,
      getAuthToken: async () => '',
      tenantId: '',
      clientId: 'stackpro-datalake-client',
      ...config
    }
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {},
    requestOptions: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`
    
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    
    const tenantId = requestOptions.tenantId || this.config.tenantId
    const clientId = requestOptions.clientId || this.config.clientId
    const requestId = requestOptions.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (tenantId) headers.set('x-tenant-id', tenantId)
    if (clientId) headers.set('x-client-id', clientId)
    if (requestId) headers.set('x-request-id', requestId)
    
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
   * Upload dataset for processing
   */
  async uploadData(
    upload: DatasetUpload,
    options: RequestOptions = {}
  ): Promise<UploadResponse> {
    try {
      const response = await this.makeRequest<UploadResponse>(
        '/v1/data/upload',
        {
          method: 'POST',
          body: JSON.stringify(upload)
        },
        options
      )
      
      return {
        success: response.success ?? false,
        datasetId: response.datasetId || upload.datasetId,
        recordCount: response.recordCount || upload.data.length,
        validationResults: response.validationResults || { valid: true, warnings: [], errors: [] },
        degraded: false,
        requestId: response.requestId || 'unknown'
      }
    } catch (error) {
      console.warn('Data Lake uploadData degraded:', error)
      return {
        success: false,
        datasetId: upload.datasetId,
        recordCount: upload.data.length,
        validationResults: {
          valid: false,
          warnings: [],
          errors: ['Service temporarily unavailable - data not uploaded']
        },
        degraded: true,
        requestId: `fallback_${Date.now()}`
      }
    }
  }

  /**
   * Get dataset metadata
   */
  async getDataset(
    datasetId: string,
    options: RequestOptions = {}
  ): Promise<Dataset> {
    try {
      const response = await this.makeRequest<Dataset>(
        `/v1/data/${encodeURIComponent(datasetId)}`,
        {},
        options
      )
      
      return {
        datasetId: response.datasetId || datasetId,
        status: response.status || 'unknown' as any,
        recordCount: response.recordCount || 0,
        schema: response.schema,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        metadata: response.metadata,
        degraded: false,
        requestId: response.requestId || 'unknown'
      }
    } catch (error) {
      console.warn('Data Lake getDataset degraded:', error)
      return {
        datasetId,
        status: 'error',
        recordCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        degraded: true,
        requestId: `fallback_${Date.now()}`
      }
    }
  }
}

/**
 * Factory function to create data lake client
 */
export function createDataLakeClient(config: DataLakeClientConfig): DataLakeClient {
  return new DataLakeClient(config)
}
