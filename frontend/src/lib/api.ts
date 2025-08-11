/**
 * API client helpers
 * Centralized API calls with proper error handling
 */
import { API_URL, DEBUG } from './env';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    
    if (DEBUG) {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  async get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'GET', ...options });
  }

  async post<T>(
    path: string,
    body: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async put<T>(
    path: string,
    body: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { method: 'DELETE', ...options });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Health check helper
export async function checkApiHealth(): Promise<boolean> {
  const result = await api.get('/health');
  return result.status === 200;
}
