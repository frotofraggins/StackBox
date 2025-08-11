// Types generated from OpenAPI spec
export interface BusinessType {
  Construction: 'Construction';
  Tradesmen: 'Tradesmen';
  Legal: 'Legal';
  Retail: 'Retail';
  Medical: 'Medical';
  'Real Estate': 'Real Estate';
  Manufacturing: 'Manufacturing';
  Logistics: 'Logistics';
  'Marketing Agencies': 'Marketing Agencies';
  Nonprofits: 'Nonprofits';
  'E-commerce': 'E-commerce';
  Hospitality: 'Hospitality';
  Education: 'Education';
  'Fitness/Wellness': 'Fitness/Wellness';
  'Technology Services': 'Technology Services';
  Other: 'Other';
}

export type BusinessTypeValue = keyof BusinessType;

export type AnalysisType = 'pain-points' | 'capabilities' | 'full-analysis';
export type Priority = 'low' | 'normal' | 'high';
export type AnalysisStatus = 'processing' | 'completed' | 'failed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Frequency = 'rare' | 'occasional' | 'frequent' | 'constant';
export type Impact = 'minimal' | 'moderate' | 'significant' | 'severe';

export interface DocumentInfo {
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileSize: number;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  s3Key?: string;
}

export interface PainPoint {
  category: 'process-inefficiency' | 'data-management' | 'communication' | 
           'compliance' | 'customer-experience' | 'resource-management' |
           'integration' | 'reporting' | 'security' | 'scalability';
  description: string;
  severity: Severity;
  frequency: Frequency;
  impact: Impact;
  evidence?: string[];
  confidence: number;
}

export interface Opportunity {
  type: 'automation' | 'integration' | 'optimization' | 'expansion';
  description: string;
  estimatedImpact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
}

export interface KeyMetric {
  name: string;
  value: string;
  unit?: string;
  context?: string;
}

export interface BusinessInsights {
  painPoints: PainPoint[];
  opportunities: Opportunity[];
  keyMetrics: KeyMetric[];
  stakeholders: string[];
}

export interface StackRecommendation {
  stackId: string;
  name: string;
  category: string;
  relevanceScore: number;
  reasons: string[];
  addressedPainPoints: string[];
  estimatedROI: 'low' | 'medium' | 'high';
}

export interface ConnectorRecommendation {
  connectorId: string;
  name: string;
  provider: string;
  category: 'crm' | 'accounting' | 'project-management' | 'communication' |
           'e-commerce' | 'analytics' | 'hr' | 'marketing' | 'support';
  relevanceScore: number;
  integrationComplexity: 'simple' | 'moderate' | 'complex';
  monthlyUsage: 'light' | 'moderate' | 'heavy';
}

export interface MissingCapability {
  type: 'stack' | 'connector' | 'integration';
  name: string;
  description: string;
  demandScore: number;
  developmentEffort: 'low' | 'medium' | 'high';
}

export interface ImplementationPhase {
  phase: number;
  name: string;
  description: string;
  timeEstimate: string;
  dependencies: string[];
  deliverables: string[];
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalTimeEstimate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface Recommendations {
  capabilityStacks: StackRecommendation[];
  connectors: ConnectorRecommendation[];
  missingCapabilities: MissingCapability[];
  implementationPlan?: ImplementationPlan;
}

export interface AnalysisResult {
  analysisId: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt?: string;
  document?: DocumentInfo;
  insights?: BusinessInsights;
  recommendations?: Recommendations;
  confidence?: number;
  processingTimeMs?: number;
}

export interface CapabilityStack {
  stackId: string;
  name: string;
  category: string;
  description?: string;
  businessTypes?: string[];
  painPointCategories?: string[];
  maturityLevel?: 'beta' | 'stable' | 'mature';
  pricing?: PricingInfo;
}

export interface Connector {
  connectorId: string;
  name: string;
  provider: string;
  category?: string;
  description?: string;
  authType?: 'oauth2' | 'api-key' | 'basic-auth' | 'custom';
  rateLimit?: {
    requests: number;
    period: string;
  };
  dataSync?: {
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
    direction: 'inbound' | 'outbound' | 'bidirectional';
  };
}

export interface PricingInfo {
  model: 'free' | 'per-user' | 'per-transaction' | 'flat-rate' | 'usage-based';
  baseCost?: number;
  scalingCost?: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

export interface AnalyzeDocumentRequest {
  document: File | Buffer;
  businessType: BusinessTypeValue;
  analysisType?: AnalysisType;
  priority?: Priority;
}

export interface GetCapabilitiesOptions {
  businessType?: string;
  category?: 'stacks' | 'connectors' | 'integrations';
}

export interface CapabilitiesResponse {
  stacks: CapabilityStack[];
  connectors: Connector[];
  lastUpdated: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  version: string;
  aiModel: string;
}

export interface AIDocsClientConfig {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

// Client implementation
export class AIDocsClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;
  private timeout: number;
  private retries: number;
  private debug: boolean;

  constructor(config: AIDocsClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
    this.timeout = config.timeout || 30000; // 30 seconds default
    this.retries = config.retries || 3;
    this.debug = config.debug || false;

    if (!this.apiKey && !this.bearerToken) {
      throw new Error('Either apiKey or bearerToken must be provided');
    }
  }

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
      isFormData?: boolean;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;
    const url = `${this.baseUrl}${endpoint}`;

    // Set authorization header
    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    // Set content type unless it's form data (fetch will set boundary)
    if (!isFormData && body) {
      headers['Content-Type'] = 'application/json';
    }

    const requestOptions: any = {
      method,
      headers,
      ...(body && { body: isFormData ? body : JSON.stringify(body) })
    };

    if (this.debug) {
      console.log(`[AIDocsClient] ${method} ${url}`, { headers, body: isFormData ? '[FormData]' : body });
    }

    let lastError: Error;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        // Use dynamic import for fetch compatibility
        const fetch = (globalThis.fetch || (await import('node-fetch')).default) as any;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: ApiError;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: 'HTTP_ERROR',
              message: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: new Date().toISOString()
            };
          }

          const error = new Error(errorData.message) as any;
          error.status = response.status;
          error.data = errorData;
          throw error;
        }

        const result = await response.json();
        
        if (this.debug) {
          console.log(`[AIDocsClient] Response:`, result);
        }

        return result;
      } catch (error: any) {
        lastError = error;
        
        if (this.debug) {
          console.log(`[AIDocsClient] Attempt ${attempt} failed:`, error.message);
        }

        // Don't retry on 4xx errors (client errors)
        if (error.status && error.status >= 400 && error.status < 500) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === this.retries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Analyze a document for business insights and recommendations
   */
  async analyzeDocument(request: AnalyzeDocumentRequest): Promise<AnalysisResult> {
    const FormData = (globalThis.FormData || (await import('form-data')).default) as any;
    const formData = new FormData();

    // Handle different document input types
    if (request.document instanceof File) {
      formData.append('document', request.document);
    } else if (Buffer.isBuffer(request.document)) {
      formData.append('document', request.document, 'document.pdf');
    } else {
      throw new Error('Document must be a File or Buffer');
    }

    formData.append('businessType', request.businessType);
    
    if (request.analysisType) {
      formData.append('analysisType', request.analysisType);
    }
    
    if (request.priority) {
      formData.append('priority', request.priority);
    }

    return this.request<AnalysisResult>('/analyze', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }

  /**
   * Get the result of a previous document analysis
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResult> {
    return this.request<AnalysisResult>(`/analyze/${analysisId}`);
  }

  /**
   * Get available capability stacks and connectors
   */
  async getCapabilities(options: GetCapabilitiesOptions = {}): Promise<CapabilitiesResponse> {
    const params = new URLSearchParams();
    
    if (options.businessType) {
      params.append('businessType', options.businessType);
    }
    
    if (options.category) {
      params.append('category', options.category);
    }

    const query = params.toString();
    const endpoint = query ? `/capabilities?${query}` : '/capabilities';
    
    return this.request<CapabilitiesResponse>(endpoint);
  }

  /**
   * Check service health and availability
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  /**
   * Utility method to wait for analysis completion
   */
  async waitForAnalysis(
    analysisId: string, 
    options: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (result: AnalysisResult) => void;
    } = {}
  ): Promise<AnalysisResult> {
    const { maxWaitMs = 300000, pollIntervalMs = 2000, onProgress } = options; // 5 min max, 2s interval
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.getAnalysisResult(analysisId);
      
      if (onProgress) {
        onProgress(result);
      }

      if (result.status === 'completed') {
        return result;
      }

      if (result.status === 'failed') {
        throw new Error(`Analysis failed for ID: ${analysisId}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Analysis timed out after ${maxWaitMs}ms for ID: ${analysisId}`);
  }
}

// Factory function for easier instantiation
export function createAIDocsClient(config: AIDocsClientConfig): AIDocsClient {
  return new AIDocsClient(config);
}

// Default export
export default AIDocsClient;
