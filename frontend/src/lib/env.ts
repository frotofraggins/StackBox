/**
 * Environment configuration
 * Handles API URLs with fallbacks for different environments
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 
  (typeof window === 'undefined'
    ? 'http://localhost:3001'  // SSR fallback
    : '/api'                   // Client-side uses proxy
  );

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export const ENV = process.env.NEXT_PUBLIC_ENV || 'development';

export const IS_FREE_TIER = process.env.NEXT_PUBLIC_FREE_TIER === 'true';

export const AI_ENABLED = process.env.AI_ENABLED === 'true';

// Feature flags
export const FEATURES = {
  MARKETPLACE: process.env.MARKETPLACE_ENABLED === 'true',
  ETL: process.env.ETL_ENABLED === 'true',
  IOT: process.env.IOT_ENABLED === 'true',
  DATA_SELLER_PORTAL: process.env.DATA_SELLER_PORTAL_ENABLED === 'true',
};

// Debug logging in development
export const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('StackPro Environment Config:', {
    API_URL,
    WS_URL,
    ENV,
    IS_FREE_TIER,
    AI_ENABLED,
    FEATURES,
  });
}
