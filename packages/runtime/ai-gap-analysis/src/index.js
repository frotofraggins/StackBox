"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGapAnalysisEngine = void 0;
exports.createGapAnalysisEngine = createGapAnalysisEngine;
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
class AIGapAnalysisEngine {
    mappingsPath;
    connectorsPath;
    benchmarksPath;
    mappingsData;
    connectorsData;
    benchmarksData;
    constructor(mappingsPath, connectorsPath, benchmarksPath) {
        this.mappingsPath = mappingsPath;
        this.connectorsPath = connectorsPath;
        this.benchmarksPath = benchmarksPath;
        this.loadData();
    }
    loadData() {
        try {
            // Load mappings
            this.mappingsData = JSON.parse(fs.readFileSync(this.mappingsPath, 'utf8'));
            // Load connectors
            this.connectorsData = JSON.parse(fs.readFileSync(this.connectorsPath, 'utf8'));
            // Load benchmarks (optional)
            if (this.benchmarksPath && fs.existsSync(this.benchmarksPath)) {
                this.benchmarksData = JSON.parse(fs.readFileSync(this.benchmarksPath, 'utf8'));
            }
            else {
                this.benchmarksData = {};
            }
            console.log(`✅ Gap Analysis Engine loaded:`, {
                businessTypes: this.mappingsData.length,
                connectorTypes: Object.keys(this.connectorsData).length,
                benchmarks: Object.keys(this.benchmarksData).length
            });
        }
        catch (error) {
            console.error('❌ Failed to load gap analysis data:', error);
            throw error;
        }
    }
    /**
     * Perform comprehensive gap analysis for a tenant
     */
    async performGapAnalysis(tenantProfile) {
        console.log(`🔍 Starting gap analysis for tenant: ${tenantProfile.tenantId}`);
        const analysisId = (0, uuid_1.v4)();
        const analysisDate = new Date().toISOString();
        // Get business type mapping
        const businessMapping = this.mappingsData.find(mapping => mapping.businessType === tenantProfile.businessType);
        if (!businessMapping) {
            throw new Error(`No mapping found for business type: ${tenantProfile.businessType}`);
        }
        // Analyze missing capabilities
        const missingCapabilities = await this.identifyMissingCapabilities(tenantProfile, businessMapping);
        // Identify upsell opportunities
        const upsellOpportunities = await this.identifyUpsellOpportunities(tenantProfile, businessMapping);
        // Assess retention risks
        const retentionRisks = await this.assessRetentionRisks(tenantProfile);
        // Generate next actions
        const nextActions = this.generateNextActions(missingCapabilities, upsellOpportunities, retentionRisks);
        // Calculate overall priority
        const priority = this.calculateOverallPriority(missingCapabilities, upsellOpportunities, retentionRisks);
        const result = {
            analysisId,
            tenantId: tenantProfile.tenantId,
            analysisDate,
            priority,
            missingCapabilities,
            upsellOpportunities,
            retentionRisks,
            nextActions
        };
        console.log(`✅ Gap analysis complete for ${tenantProfile.tenantId}:`, {
            missingCapabilities: missingCapabilities.length,
            upsellOpportunities: upsellOpportunities.length,
            retentionRisks: retentionRisks.length,
            priority
        });
        return result;
    }
    async identifyMissingCapabilities(tenantProfile, businessMapping) {
        const missing = [];
        // Check for missing recommended stacks
        const recommendedStacks = businessMapping.recommendedStacks || [];
        const missingStacks = recommendedStacks.filter((stack) => !tenantProfile.currentStacks.includes(stack));
        for (const stackName of missingStacks) {
            const relevanceScore = this.calculateStackRelevance(stackName, tenantProfile, businessMapping);
            if (relevanceScore > 0.3) { // Only include relevant recommendations
                const reasons = this.generateStackReasons(stackName, tenantProfile, businessMapping);
                const addressedPainPoints = this.getAddressedPainPoints(stackName, tenantProfile);
                missing.push({
                    type: 'stack',
                    id: this.generateStackId(stackName),
                    name: stackName,
                    relevanceScore,
                    reasons,
                    addressedPainPoints,
                    estimatedROI: this.estimateROI(relevanceScore, tenantProfile),
                    implementationEffort: this.estimateImplementationEffort(stackName),
                    priority: Math.round(relevanceScore * 100)
                });
            }
        }
        // Check for missing connectors
        const businessConnectors = this.connectorsData[tenantProfile.businessType] || [];
        const currentConnectorNames = tenantProfile.currentConnectors;
        for (const connector of businessConnectors) {
            if (!currentConnectorNames.includes(connector.name)) {
                const relevanceScore = this.calculateConnectorRelevance(connector, tenantProfile);
                if (relevanceScore > 0.4) { // Higher threshold for connectors
                    missing.push({
                        type: 'connector',
                        id: connector.connectorId,
                        name: connector.name,
                        relevanceScore,
                        reasons: [`Commonly used in ${tenantProfile.businessType} businesses`],
                        addressedPainPoints: [connector.category],
                        estimatedROI: this.estimateConnectorROI(connector, tenantProfile),
                        implementationEffort: connector.integrationComplexity === 'simple' ? 'low' :
                            connector.integrationComplexity === 'moderate' ? 'medium' : 'high',
                        priority: Math.round(relevanceScore * 80) // Slightly lower priority than stacks
                    });
                }
            }
        }
        // Sort by priority (highest first)
        return missing.sort((a, b) => b.priority - a.priority);
    }
    async identifyUpsellOpportunities(tenantProfile, businessMapping) {
        const opportunities = [];
        // Usage-based upsells
        for (const [stackId, usage] of Object.entries(tenantProfile.usageStats)) {
            if (usage.usageFrequency === 'daily' && usage.userCount > 5) {
                opportunities.push({
                    type: 'upgrade',
                    currentStack: stackId,
                    recommendedStack: `${stackId}-pro`,
                    trigger: 'usage_pattern',
                    confidence: 0.8,
                    expectedRevenue: this.estimateUpgradeRevenue(stackId, usage.userCount),
                    timeframe: 'short_term',
                    reasons: [`High usage (${usage.usageFrequency}) with ${usage.userCount} users suggests need for advanced features`]
                });
            }
        }
        // Pain point-based upsells
        const highSeverityPainPoints = tenantProfile.painPoints
            .filter(p => p.severity === 'high' || p.severity === 'critical')
            .filter(p => p.confidence > 0.7);
        for (const painPoint of highSeverityPainPoints) {
            const relevantAddons = this.findAddonForPainPoint(painPoint.category, tenantProfile.businessType);
            for (const addon of relevantAddons) {
                opportunities.push({
                    type: 'addon',
                    recommendedStack: addon,
                    trigger: 'pain_point',
                    confidence: painPoint.confidence,
                    expectedRevenue: this.estimateAddonRevenue(addon),
                    timeframe: painPoint.severity === 'critical' ? 'immediate' : 'short_term',
                    reasons: [`Addresses critical pain point: ${painPoint.description}`]
                });
            }
        }
        // AI insight-based upsells
        if (tenantProfile.aiInsights?.businessMaturity === 'growth') {
            opportunities.push({
                type: 'integration',
                recommendedStack: 'advanced-analytics-suite',
                trigger: 'ai_insight',
                confidence: 0.75,
                expectedRevenue: 500,
                timeframe: 'medium_term',
                reasons: ['Growing business profile suggests readiness for advanced analytics']
            });
        }
        return opportunities.sort((a, b) => b.confidence - a.confidence);
    }
    async assessRetentionRisks(tenantProfile) {
        const risks = [];
        // Check for low usage stacks
        for (const [stackId, usage] of Object.entries(tenantProfile.usageStats)) {
            if (usage.usageFrequency === 'never' || usage.usageFrequency === 'rare') {
                const daysSinceLastUse = this.calculateDaysSinceLastUse(usage.lastUsed);
                if (daysSinceLastUse > 30) {
                    risks.push({
                        stackId,
                        riskLevel: daysSinceLastUse > 90 ? 'high' : 'medium',
                        reason: 'low_usage',
                        recommendation: daysSinceLastUse > 90 ?
                            'Schedule user training or consider downgrade' :
                            'Provide onboarding assistance to increase adoption'
                    });
                }
            }
        }
        // Check for integration gaps that might lead to churn
        const currentStacks = tenantProfile.currentStacks;
        const criticalIntegrations = this.identifyCriticalIntegrations(tenantProfile.businessType);
        for (const integration of criticalIntegrations) {
            const hasRequiredStacks = integration.requiredStacks.every((stack) => currentStacks.includes(stack));
            if (!hasRequiredStacks) {
                risks.push({
                    stackId: integration.primaryStack,
                    riskLevel: 'medium',
                    reason: 'missing_integration',
                    recommendation: `Consider adding ${integration.name} integration to improve workflow efficiency`
                });
            }
        }
        return risks;
    }
    generateNextActions(missingCapabilities, upsellOpportunities, retentionRisks) {
        const actions = [];
        // High-priority missing capabilities
        const highPriorityMissing = missingCapabilities
            .filter(cap => cap.priority > 70)
            .slice(0, 3); // Top 3 only
        for (const capability of highPriorityMissing) {
            actions.push({
                action: capability.estimatedROI === 'high' ? 'schedule_demo' : 'show_recommendation',
                priority: capability.priority,
                timing: 'within_7_days',
                context: `Missing ${capability.name}: ${capability.reasons[0]}`
            });
        }
        // High-confidence upsells
        const immediateUpsells = upsellOpportunities
            .filter(opp => opp.confidence > 0.8 && opp.timeframe === 'immediate')
            .slice(0, 2);
        for (const upsell of immediateUpsells) {
            actions.push({
                action: upsell.expectedRevenue > 1000 ? 'contact_sales' : 'show_recommendation',
                priority: Math.round(upsell.confidence * 100),
                timing: 'within_3_days',
                context: `Upsell opportunity: ${upsell.recommendedStack} (${upsell.trigger})`
            });
        }
        // High retention risks
        const highRisks = retentionRisks.filter(risk => risk.riskLevel === 'high');
        for (const risk of highRisks) {
            actions.push({
                action: 'contact_sales',
                priority: 90,
                timing: 'within_24_hours',
                context: `Retention risk: ${risk.stackId} - ${risk.reason}`
            });
        }
        return actions.sort((a, b) => b.priority - a.priority);
    }
    // Helper methods
    calculateStackRelevance(stackName, tenantProfile, businessMapping) {
        let score = 0.5; // Base score
        // Check if stack addresses tenant's pain points
        const relevantPainPoints = tenantProfile.painPoints.filter(p => this.stackAddressesPainPoint(stackName, p.category));
        if (relevantPainPoints.length > 0) {
            const avgSeverity = relevantPainPoints.reduce((sum, p) => {
                const severityScore = { low: 1, medium: 2, high: 3, critical: 4 }[p.severity];
                return sum + (severityScore * p.confidence);
            }, 0) / relevantPainPoints.length;
            score += (avgSeverity / 4) * 0.4; // Up to 0.4 boost
        }
        // Business size adjustment
        if (tenantProfile.businessSize === 'large' && stackName.includes('Enterprise')) {
            score += 0.2;
        }
        else if (tenantProfile.businessSize === 'small' && stackName.includes('Starter')) {
            score += 0.1;
        }
        return Math.min(score, 1.0);
    }
    calculateConnectorRelevance(connector, tenantProfile) {
        let score = 0.3; // Base score for connectors
        // Business type match
        if (connector.businessTypes.includes(tenantProfile.businessType)) {
            score += 0.3;
        }
        // Integration complexity vs business maturity
        const maturity = tenantProfile.aiInsights?.integrationReadiness || 'medium';
        if ((maturity === 'high' && connector.integrationComplexity === 'complex') ||
            (maturity === 'medium' && connector.integrationComplexity === 'moderate') ||
            (maturity === 'low' && connector.integrationComplexity === 'simple')) {
            score += 0.2;
        }
        return Math.min(score, 1.0);
    }
    calculateOverallPriority(missingCapabilities, upsellOpportunities, retentionRisks) {
        const hasHighPriorityMissing = missingCapabilities.some(cap => cap.priority > 80);
        const hasHighConfidenceUpsell = upsellOpportunities.some(opp => opp.confidence > 0.8);
        const hasHighRetentionRisk = retentionRisks.some(risk => risk.riskLevel === 'high');
        if (hasHighRetentionRisk)
            return 'critical';
        if (hasHighPriorityMissing && hasHighConfidenceUpsell)
            return 'high';
        if (hasHighPriorityMissing || hasHighConfidenceUpsell)
            return 'medium';
        return 'low';
    }
    // Utility methods (simplified implementations)
    generateStackId(stackName) {
        return stackName.toLowerCase().replace(/\s+/g, '-');
    }
    generateStackReasons(stackName, tenantProfile, businessMapping) {
        return [`Recommended for ${tenantProfile.businessType} businesses`, `Addresses common workflow needs`];
    }
    getAddressedPainPoints(stackName, tenantProfile) {
        return tenantProfile.painPoints
            .filter(p => this.stackAddressesPainPoint(stackName, p.category))
            .map(p => p.category);
    }
    stackAddressesPainPoint(stackName, painPointCategory) {
        const mappings = {
            'Project Management': ['process-inefficiency', 'resource-management'],
            'Document Management': ['data-management', 'compliance'],
            'CRM': ['customer-experience', 'communication'],
            'Accounting Integration': ['process-inefficiency', 'reporting'],
        };
        return mappings[stackName]?.includes(painPointCategory) || false;
    }
    estimateROI(relevanceScore, tenantProfile) {
        if (relevanceScore > 0.7)
            return 'high';
        if (relevanceScore > 0.5)
            return 'medium';
        return 'low';
    }
    estimateConnectorROI(connector, tenantProfile) {
        if (connector.monthlyUsage === 'heavy')
            return 'high';
        if (connector.monthlyUsage === 'moderate')
            return 'medium';
        return 'low';
    }
    estimateImplementationEffort(stackName) {
        const complexStacks = ['ERP System', 'Advanced Analytics'];
        const simpleStacks = ['CRM', 'Project Management'];
        if (complexStacks.some(s => stackName.includes(s)))
            return 'high';
        if (simpleStacks.some(s => stackName.includes(s)))
            return 'low';
        return 'medium';
    }
    estimateUpgradeRevenue(stackId, userCount) {
        return userCount * 25; // $25 per user upgrade estimate
    }
    estimateAddonRevenue(addon) {
        return 200; // Base addon estimate
    }
    calculateDaysSinceLastUse(lastUsed) {
        const lastUseDate = new Date(lastUsed);
        const now = new Date();
        return Math.floor((now.getTime() - lastUseDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    findAddonForPainPoint(category, businessType) {
        const addons = {
            'process-inefficiency': ['workflow-automation', 'advanced-reporting'],
            'data-management': ['data-backup', 'advanced-search'],
            'compliance': ['compliance-monitoring', 'audit-trail'],
        };
        return addons[category] || [];
    }
    identifyCriticalIntegrations(businessType) {
        // Simplified - would be loaded from data files in production
        return [
            {
                name: 'CRM-Accounting Integration',
                primaryStack: 'crm',
                requiredStacks: ['crm', 'accounting']
            }
        ];
    }
}
exports.AIGapAnalysisEngine = AIGapAnalysisEngine;
// Factory function
function createGapAnalysisEngine(mappingsPath, connectorsPath, benchmarksPath) {
    return new AIGapAnalysisEngine(mappingsPath, connectorsPath, benchmarksPath);
}
exports.default = AIGapAnalysisEngine;
