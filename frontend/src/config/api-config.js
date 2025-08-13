/**
 * API Configuration - Environment-based endpoint resolution
 */

const API_ENDPOINTS = {
  development: 'http://localhost:3001',
  staging: 'https://api-staging.stackpro.io',
  production: 'https://api.stackpro.io'
};

const WS_ENDPOINTS = {
  development: 'ws://localhost:3001',
  staging: 'wss://api-staging.stackpro.io',
  production: 'wss://api.stackpro.io'
};

// Get environment from build-time variable or detect from hostname
const getEnvironment = () => {
  // Build-time environment (set by Amplify)
  if (process.env.NEXT_PUBLIC_ENV) {
    return process.env.NEXT_PUBLIC_ENV;
  }
  
  // Runtime detection for client-side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
  }
  
  return 'production';
};

const environment = getEnvironment();

export const API_CONFIG = {
  baseURL: API_ENDPOINTS[environment],
  wsURL: WS_ENDPOINTS[environment],
  environment,
  timeout: 10000,
  retries: 3
};

// Health check function
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/health`);
    return response.ok;
  } catch (error) {
    console.warn('API health check failed:', error);
    return false;
  }
};

export default API_CONFIG;
