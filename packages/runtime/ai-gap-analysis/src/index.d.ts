export interface TenantAIProfile {
    tenantId: string;
    businessType: string;
    businessSize: string;
    industry: string;
    onboardingDate: string;
    lastAnalysis?: string;
    painPoints: Array<{
        category: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        confidence: number;
    }>;
    currentStacks: string[];
    currentConnectors: string[];
    usageStats: {
        [stackId: string]: {
            lastUsed: string;
            usageFrequency: 'never' | 'rare' | 'occasional' | 'frequent' | 'daily';
            userCount: number;
        };
    };
    aiInsights?: {
        opportunityAreas: string[];
        businessMaturity: 'startup' | 'growth' | 'established' | 'enterprise';
        integrationReadiness: 'low' | 'medium' | 'high';
    };
}
export interface CapabilityStack {
    stackId: string;
    name: string;
    category: string;
    businessTypes: string[];
    painPointCategories: string[];
    dependencies: string[];
    maturityLevel: 'beta' | 'stable' | 'mature';
    pricing: {
        model: string;
        baseCost: number;
        scalingCost?: number;
    };
}
export interface Connector {
    connectorId: string;
    name: string;
    provider: string;
    category: string;
    businessTypes: string[];
    integrationComplexity: 'simple' | 'moderate' | 'complex';
    monthlyUsage: 'light' | 'moderate' | 'heavy';
}
export interface GapAnalysisResult {
    analysisId: string;
    tenantId: string;
    analysisDate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    missingCapabilities: Array<{
        type: 'stack' | 'connector';
        id: string;
        name: string;
        relevanceScore: number;
        reasons: string[];
        addressedPainPoints: string[];
        estimatedROI: 'low' | 'medium' | 'high';
        implementationEffort: 'low' | 'medium' | 'high';
        priority: number;
    }>;
    upsellOpportunities: Array<{
        type: 'upgrade' | 'addon' | 'integration';
        currentStack?: string;
        recommendedStack: string;
        trigger: 'usage_pattern' | 'pain_point' | 'industry_trend' | 'ai_insight';
        confidence: number;
        expectedRevenue: number;
        timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
        reasons: string[];
    }>;
    retentionRisks: Array<{
        stackId: string;
        riskLevel: 'low' | 'medium' | 'high';
        reason: 'low_usage' | 'missing_integration' | 'competitor_advantage';
        recommendation: string;
    }>;
    nextActions: Array<{
        action: 'contact_sales' | 'show_recommendation' | 'schedule_demo' | 'offer_trial';
        priority: number;
        timing: string;
        context: string;
    }>;
}
export interface IndustryBenchmark {
    businessType: string;
    averageStackCount: number;
    commonStacks: string[];
    averageConnectorCount: number;
    maturityIndicators: {
        [stack: string]: {
            adoptionRate: number;
            timeToValue: number;
            retentionRate: number;
        };
    };
}
export declare class AIGapAnalysisEngine {
    private mappingsPath;
    private connectorsPath;
    private benchmarksPath?;
    private mappingsData;
    private connectorsData;
    private benchmarksData;
    constructor(mappingsPath: string, connectorsPath: string, benchmarksPath?: string | undefined);
    private loadData;
    /**
     * Perform comprehensive gap analysis for a tenant
     */
    performGapAnalysis(tenantProfile: TenantAIProfile): Promise<GapAnalysisResult>;
    private identifyMissingCapabilities;
    private identifyUpsellOpportunities;
    private assessRetentionRisks;
    private generateNextActions;
    private calculateStackRelevance;
    private calculateConnectorRelevance;
    private calculateOverallPriority;
    private generateStackId;
    private generateStackReasons;
    private getAddressedPainPoints;
    private stackAddressesPainPoint;
    private estimateROI;
    private estimateConnectorROI;
    private estimateImplementationEffort;
    private estimateUpgradeRevenue;
    private estimateAddonRevenue;
    private calculateDaysSinceLastUse;
    private findAddonForPainPoint;
    private identifyCriticalIntegrations;
}
export declare function createGapAnalysisEngine(mappingsPath: string, connectorsPath: string, benchmarksPath?: string): AIGapAnalysisEngine;
export default AIGapAnalysisEngine;
