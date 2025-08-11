import { isEnabled, getVariant, FlagOptions, FlagConfig } from './index';

/**
 * AI-First Feature Flags for StackPro Platform
 * All flags default to FALSE in sandbox environment for safe deployment
 */

export interface AIFeatureFlags {
  // AI Document Analysis
  AI_DOCS_ENABLED: boolean;
  AI_STACK_SUGGESTIONS_ENABLED: boolean;
  AI_GAP_ANALYSIS_ENABLED: boolean;
  AI_CROSS_SELL_ENABLED: boolean;
  
  // Connector and Industry Features
  CONNECTOR_LIBRARY_ENABLED: boolean;
  INDUSTRY_TEMPLATES_ENABLED: boolean;
  AUTO_BACKLOG_ENABLED: boolean;
  
  // Observability and Analytics
  OBSERVABILITY_ENABLED: boolean;
  AI_INSIGHTS_DASHBOARD_ENABLED: boolean;
  USAGE_ANALYTICS_ENABLED: boolean;
  
  // Onboarding Enhancements
  AI_ONBOARDING_RECOMMENDATIONS_ENABLED: boolean;
  SMART_CONNECTOR_PREFILL_ENABLED: boolean;
  PAIN_POINT_DETECTION_ENABLED: boolean;
  
  // Cross-sell and Upsell
  LIFECYCLE_CROSS_SELL_ENABLED: boolean;
  USAGE_BASED_UPSELL_ENABLED: boolean;
  RETENTION_RISK_DETECTION_ENABLED: boolean;
  
  // Business Intelligence
  BI_DASHBOARD_ENABLED: boolean;
  INDUSTRY_BENCHMARKING_ENABLED: boolean;
  QUARTERLY_HEALTH_REPORTS_ENABLED: boolean;
  
  // Advanced AI Features
  BUSINESS_MATURITY_ANALYSIS_ENABLED: boolean;
  INTEGRATION_READINESS_SCORING_ENABLED: boolean;
  COMPETITIVE_INTELLIGENCE_ENABLED: boolean;
}

// Default flag states for sandbox environment
const AI_FLAG_DEFAULTS: AIFeatureFlags = {
  // AI Document Analysis - OFF by default
  AI_DOCS_ENABLED: false,
  AI_STACK_SUGGESTIONS_ENABLED: false,
  AI_GAP_ANALYSIS_ENABLED: false,
  AI_CROSS_SELL_ENABLED: false,
  
  // Connector and Industry Features - OFF by default
  CONNECTOR_LIBRARY_ENABLED: false,
  INDUSTRY_TEMPLATES_ENABLED: false,
  AUTO_BACKLOG_ENABLED: false,
  
  // Observability and Analytics - OFF by default
  OBSERVABILITY_ENABLED: false,
  AI_INSIGHTS_DASHBOARD_ENABLED: false,
  USAGE_ANALYTICS_ENABLED: false,
  
  // Onboarding Enhancements - OFF by default
  AI_ONBOARDING_RECOMMENDATIONS_ENABLED: false,
  SMART_CONNECTOR_PREFILL_ENABLED: false,
  PAIN_POINT_DETECTION_ENABLED: false,
  
  // Cross-sell and Upsell - OFF by default
  LIFECYCLE_CROSS_SELL_ENABLED: false,
  USAGE_BASED_UPSELL_ENABLED: false,
  RETENTION_RISK_DETECTION_ENABLED: false,
  
  // Business Intelligence - OFF by default
  BI_DASHBOARD_ENABLED: false,
  INDUSTRY_BENCHMARKING_ENABLED: false,
  QUARTERLY_HEALTH_REPORTS_ENABLED: false,
  
  // Advanced AI Features - OFF by default
  BUSINESS_MATURITY_ANALYSIS_ENABLED: false,
  INTEGRATION_READINESS_SCORING_ENABLED: false,
  COMPETITIVE_INTELLIGENCE_ENABLED: false,
};

/**
 * Get all AI feature flags for a tenant
 */
export async function getAIFlags(
  options: FlagOptions = {},
  config?: FlagConfig
): Promise<AIFeatureFlags> {
  const flags: Partial<AIFeatureFlags> = {};
  
  // Check each flag using the main flags system
  for (const [flagName, defaultValue] of Object.entries(AI_FLAG_DEFAULTS)) {
    try {
      flags[flagName as keyof AIFeatureFlags] = await isEnabled(flagName, options, config);
    } catch (error) {
      console.warn(`Failed to get AI flag ${flagName}, using default:`, error);
      flags[flagName as keyof AIFeatureFlags] = defaultValue;
    }
  }
  
  return flags as AIFeatureFlags;
}

/**
 * Check if any AI features are enabled for a tenant
 */
export async function hasAnyAIFeatures(
  options: FlagOptions = {},
  config?: FlagConfig
): Promise<boolean> {
  const flags = await getAIFlags(options, config);
  return Object.values(flags).some(enabled => enabled === true);
}

/**
 * Get AI feature variant (for A/B testing)
 */
export async function getAIVariant(
  flagName: keyof AIFeatureFlags,
  options: FlagOptions = {},
  config?: FlagConfig
): Promise<string> {
  return await getVariant(flagName, options, config);
}

/**
 * Helper functions for specific AI capabilities
 */

export async function isAIDocsEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('AI_DOCS_ENABLED', options, config);
}

export async function isGapAnalysisEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('AI_GAP_ANALYSIS_ENABLED', options, config);
}

export async function isCrossSellEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('AI_CROSS_SELL_ENABLED', options, config);
}

export async function isConnectorLibraryEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('CONNECTOR_LIBRARY_ENABLED', options, config);
}

export async function isObservabilityEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('OBSERVABILITY_ENABLED', options, config);
}

export async function isOnboardingAIEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  const aiOnboardingEnabled = await isEnabled('AI_ONBOARDING_RECOMMENDATIONS_ENABLED', options, config);
  const smartPrefillEnabled = await isEnabled('SMART_CONNECTOR_PREFILL_ENABLED', options, config);
  const painPointDetectionEnabled = await isEnabled('PAIN_POINT_DETECTION_ENABLED', options, config);
  
  return aiOnboardingEnabled || smartPrefillEnabled || painPointDetectionEnabled;
}

export async function isBIDashboardEnabled(options: FlagOptions = {}, config?: FlagConfig): Promise<boolean> {
  return await isEnabled('BI_DASHBOARD_ENABLED', options, config);
}

/**
 * Get AI readiness level for a tenant based on enabled features
 */
export async function getAIReadinessLevel(
  options: FlagOptions = {},
  config?: FlagConfig
): Promise<'none' | 'basic' | 'advanced' | 'enterprise'> {
  const flags = await getAIFlags(options, config);
  
  const enabledCount = Object.values(flags).filter(enabled => enabled).length;
  const totalFlags = Object.keys(flags).length;
  const enabledPercentage = enabledCount / totalFlags;
  
  if (enabledPercentage === 0) return 'none';
  if (enabledPercentage < 0.25) return 'basic';
  if (enabledPercentage < 0.75) return 'advanced';
  return 'enterprise';
}

/**
 * Get flag states for debugging
 */
export async function getAIFlagsSummary(
  options: FlagOptions = {},
  config?: FlagConfig
): Promise<{
  flags: AIFeatureFlags;
  enabledCount: number;
  readinessLevel: string;
  hasAnyAI: boolean;
}> {
  const flags = await getAIFlags(options, config);
  const enabledCount = Object.values(flags).filter(enabled => enabled).length;
  const readinessLevel = await getAIReadinessLevel(options, config);
  const hasAnyAI = enabledCount > 0;
  
  return {
    flags,
    enabledCount,
    readinessLevel,
    hasAnyAI
  };
}

export default {
  getAIFlags,
  hasAnyAIFeatures,
  getAIVariant,
  isAIDocsEnabled,
  isGapAnalysisEnabled,
  isCrossSellEnabled,
  isConnectorLibraryEnabled,
  isObservabilityEnabled,
  isOnboardingAIEnabled,
  isBIDashboardEnabled,
  getAIReadinessLevel,
  getAIFlagsSummary,
  AI_FLAG_DEFAULTS
};
