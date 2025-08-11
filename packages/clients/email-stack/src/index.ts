/**
 * StackPro Email Stack Client SDK
 * Zero-dependency TypeScript SDK with graceful degradation
 */

// Types
export interface DNSRecord {
  name: string;
  type: 'TXT' | 'CNAME' | 'NS' | 'MX';
  value: string;
  ttl?: number;
  priority?: number;
  description?: string;
}

export interface EmailAddress {
  id: string;
  tenantId: string;
  address: string;
  domain: string;
  fullAddress: string;
  type: 'forwarding' | 'transactional' | 'no-reply';
  forwardTo?: string;
  displayName?: string;
  enabled: boolean;
  createdAt: string;
  lastUsed?: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  fromAddress: string;
  fromName: string;
  recipientCount: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  opens: number;
  uniqueOpens: number;
  clicks: number;
  uniqueClicks: number;
  bounces: number;
  complaints: number;
  unsubscribes: number;
  openRate: number;
  clickRate: number;
  lastUpdated: string;
}

export interface DomainSetupRequest {
  tenantId: string;
  domain: string;
  mode: 'delegated-subdomain' | 'full-zone';
  addresses: string[];
  forwardTo?: string;
}

export interface DomainSetupResponse {
  setupId: string;
  domain: string;
  status: 'pending-dns' | 'pending-verification' | 'verified' | 'failed';
  dnsRecords: DNSRecord[];
  nextSteps: string[];
  estimatedTime: string;
  degraded: boolean;
}

export interface DomainStatusResponse {
  domain: string;
  verified: boolean;
  dkimEnabled: boolean;
  dkimTokens: string[];
  spfRecord: string;
  dmarcRecord: string;
  addresses: EmailAddress[];
  lastChecked: string;
  degraded: boolean;
}

export interface AddressCreateRequest {
  tenantId: string;
  domain: string;
  address: string;
  type: 'forwarding' | 'transactional' | 'no-reply';
  forwardTo?: string;
  displayName?: string;
}

export interface CampaignCreateRequest {
  tenantId: string;
  subject: string;
  html: string;
  text?: string;
  fromAddress: string;
  fromName: string;
  listId?: string;
  tags?: string[];
}

export interface EmailTestRequest {
  tenantId: string;
  domain: string;
  testType?: 'forwarding' | 'archive' | 'full';
}

export interface EmailTestResponse {
  testId: string;
  status: 'sent' | 'delivered' | 'failed';
  message: string;
  degraded: boolean;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  degraded: boolean;
  fallbackGuidance?: string;
}

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  bearerToken?: string;
  timeout?: number;
  retries?: number;
  tenantId?: string;
  clientId?: string;
}

// HTTP Client with graceful degradation
class HTTPClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private headers: Record<string, string>;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001/api';
    this.timeout = config.timeout || 10000; // 10s timeout
    this.retries = config.retries || 2;
    
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (config.tenantId) {
      this.headers['x-tenant-id'] = config.tenantId;
    }
    
    if (config.clientId) {
      this.headers['x-client-id'] = config.clientId;
    }

    if (config.bearerToken) {
      this.headers['Authorization'] = `Bearer ${config.bearerToken}`;
    } else if (config.apiKey) {
      this.headers['x-api-key'] = config.apiKey;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const headers = {
      ...this.headers,
      'x-request-id': requestId,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();

        if (!response.ok) {
          // Handle HTTP errors gracefully
          return {
            error: responseData.error || `HTTP ${response.status}: ${response.statusText}`,
            degraded: true,
            fallbackGuidance: responseData.fallbackGuidance || 'Service temporarily unavailable',
          };
        }

        return {
          data: responseData,
          degraded: responseData.degraded || false,
        };

      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.name === 'AbortError') {
          break; // Timeout - don't retry
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // All attempts failed - return degraded response
    return {
      error: lastError?.message || 'Network error',
      degraded: true,
      fallbackGuidance: 'Please check network connection and try again',
    };
  }

  async get<T>(path: string): Promise<APIResponse<T>> {
    return this.makeRequest<T>('GET', path);
  }

  async post<T>(path: string, body?: any): Promise<APIResponse<T>> {
    return this.makeRequest<T>('POST', path, body);
  }

  async put<T>(path: string, body?: any): Promise<APIResponse<T>> {
    return this.makeRequest<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<APIResponse<T>> {
    return this.makeRequest<T>('DELETE', path);
  }
}

// Main Email Stack Client
export class EmailStackClient {
  private http: HTTPClient;

  constructor(config: ClientConfig = {}) {
    this.http = new HTTPClient(config);
  }

  /**
   * Request email domain setup and get DNS records to configure
   */
  async requestDomainSetup(request: DomainSetupRequest): Promise<APIResponse<DomainSetupResponse>> {
    return this.http.post<DomainSetupResponse>('/email/domains/request-setup', request);
  }

  /**
   * Get domain verification status and configuration
   */
  async getDomainStatus(domain: string): Promise<APIResponse<DomainStatusResponse>> {
    const encodedDomain = encodeURIComponent(domain);
    return this.http.get<DomainStatusResponse>(`/email/domains/${encodedDomain}`);
  }

  /**
   * Create email address route (forwarding, transactional, no-reply)
   */
  async createEmailAddress(request: AddressCreateRequest): Promise<APIResponse<EmailAddress>> {
    return this.http.post<EmailAddress>('/email/addresses', request);
  }

  /**
   * Create marketing campaign draft
   */
  async createCampaign(request: CampaignCreateRequest): Promise<APIResponse<Campaign>> {
    return this.http.post<Campaign>('/email/campaigns', request);
  }

  /**
   * Get campaign analytics and metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<APIResponse<CampaignMetrics>> {
    const encodedId = encodeURIComponent(campaignId);
    return this.http.get<CampaignMetrics>(`/email/campaigns/${encodedId}/metrics`);
  }

  /**
   * Test email identity and forwarding setup
   */
  async testEmailIdentity(request: EmailTestRequest): Promise<APIResponse<EmailTestResponse>> {
    return this.http.post<EmailTestResponse>('/email/identity/test', request);
  }

  /**
   * Helper: Generate DNS guidance for cross-account setup
   */
  generateDNSGuidance(domain: string, mode: 'delegated-subdomain' | 'full-zone'): {
    instructions: string[];
    records: DNSRecord[];
    warnings: string[];
  } {
    const baseRecords: DNSRecord[] = [
      {
        name: `_amazonses.${domain}`,
        type: 'TXT',
        value: 'PENDING_VERIFICATION_TOKEN',
        ttl: 300,
        description: 'SES domain verification record'
      },
      {
        name: domain,
        type: 'TXT',
        value: 'v=spf1 include:amazonses.com ~all',
        ttl: 300,
        description: 'SPF record for email authentication'
      },
      {
        name: `_dmarc.${domain}`,
        type: 'TXT',
        value: `v=DMARC1; p=quarantine; rua=mailto:admin@${domain}`,
        ttl: 300,
        description: 'DMARC policy record'
      }
    ];

    const instructions = [
      `1. Add the DNS records below to your ${mode === 'delegated-subdomain' ? 'parent domain DNS' : 'domain DNS'}`,
      '2. Wait 5-15 minutes for DNS propagation',
      '3. Verify domain setup using getDomainStatus()',
      '4. Create email addresses once domain is verified',
      '5. Test email forwarding before going live'
    ];

    const warnings = [
      'DNS changes may take up to 24 hours to fully propagate',
      'Test thoroughly before directing production email traffic',
      mode === 'delegated-subdomain' 
        ? 'Subdomain delegation requires NS records in parent zone'
        : 'Full zone management gives complete control but requires domain transfer'
    ];

    return { instructions, records: baseRecords, warnings };
  }

  /**
   * Helper: Check if response indicates degraded service
   */
  static isDegraded(response: APIResponse): boolean {
    return response.degraded === true;
  }

  /**
   * Helper: Extract error message with fallback
   */
  static getErrorMessage(response: APIResponse): string {
    if (response.error) {
      return response.error;
    }
    if (response.degraded) {
      return response.fallbackGuidance || 'Service temporarily degraded';
    }
    return 'Unknown error occurred';
  }
}

// Factory function for easy client creation
export function createEmailStackClient(config: ClientConfig = {}): EmailStackClient {
  return new EmailStackClient(config);
}


// Default export
export default EmailStackClient;
