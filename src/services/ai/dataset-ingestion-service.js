const { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const axios = require('axios');
const { logger } = require('../logger');

/**
 * Dataset Ingestion Service
 * Pulls public datasets and merges with tenant documents for AI analysis
 * 
 * Phase 3+ Feature: AI-First Platform Enhancement
 * - Census data for demographic insights
 * - BBB data for competitor analysis  
 * - Yelp API for local market data
 * - LinkedIn API for industry insights
 */
class DatasetIngestionService {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-2' });
    this.bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-west-2' });
    this.baseBucket = process.env.AI_DOCS_BUCKET || 'stackpro-ai-docs';
    this.datasetBucket = process.env.DATASET_BUCKET || 'stackpro-public-datasets';
  }

  /**
   * Main ingestion orchestration
   */
  async ingestDatasets(options = {}) {
    logger.info(`Starting dataset ingestion for tenant: ${this.tenantId}`);
    
    const results = {
      tenantId: this.tenantId,
      timestamp: new Date().toISOString(),
      datasets: {},
      insights: null,
      success: false
    };

    try {
      // 1. Ingest public datasets
      if (options.includeCensus !== false) {
        results.datasets.census = await this.ingestCensusData();
      }
      
      if (options.includeBBB !== false) {
        results.datasets.bbb = await this.ingestBBBData();  
      }
      
      if (options.includeYelp !== false) {
        results.datasets.yelp = await this.ingestYelpData();
      }
      
      if (options.includeLinkedIn !== false) {
        results.datasets.linkedin = await this.ingestLinkedInData();
      }

      // 2. Merge with existing tenant documents
      const tenantDocs = await this.getTenantDocuments();
      results.tenantDocumentCount = tenantDocs.length;

      // 3. Generate AI insights from combined data
      results.insights = await this.generateAIInsights(results.datasets, tenantDocs);

      // 4. Store insights in tenant bucket
      await this.storeInsights(results.insights);

      results.success = true;
      logger.info(`Dataset ingestion completed successfully for tenant: ${this.tenantId}`);
      
      return results;

    } catch (error) {
      logger.error(`Dataset ingestion failed for tenant ${this.tenantId}:`, error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Ingest Census demographic data
   */
  async ingestCensusData() {
    logger.info('Ingesting Census data...');
    
    try {
      // Get tenant business location for targeted data
      const businessInfo = await this.getTenantBusinessInfo();
      const state = businessInfo.state || 'CA';
      const zipCode = businessInfo.zipCode || '90210';

      // Census API endpoints
      const censusApiKey = process.env.CENSUS_API_KEY;
      const year = '2022';
      
      const endpoints = [
        // Population and demographics
        `https://api.census.gov/data/${year}/acs/acs5?get=B01003_001E,B25001_001E,B19013_001E&for=zip%20code%20tabulation%20area:${zipCode}&key=${censusApiKey}`,
        // Business statistics  
        `https://api.census.gov/data/${year}/cbp?get=EMP,PAYANN,ESTAB&for=zipcode:${zipCode}&key=${censusApiKey}`,
        // Education levels
        `https://api.census.gov/data/${year}/acs/acs5?get=B15003_017E,B15003_018E,B15003_019E,B15003_020E,B15003_021E,B15003_022E,B15003_023E,B15003_024E,B15003_025E&for=zip%20code%20tabulation%20area:${zipCode}&key=${censusApiKey}`
      ];

      const censusData = {};
      
      for (let i = 0; i < endpoints.length; i++) {
        try {
          const response = await axios.get(endpoints[i], { timeout: 10000 });
          censusData[`dataset_${i}`] = response.data;
        } catch (error) {
          logger.warn(`Census API endpoint ${i} failed:`, error.message);
          // Use mock data for demo
          censusData[`dataset_${i}`] = this.getMockCensusData(i);
        }
      }

      // Process and store census data
      await this.storeDataset('census', censusData, {
        source: 'US Census Bureau',
        location: `${zipCode}, ${state}`,
        year: year
      });

      return {
        status: 'success',
        recordCount: Object.keys(censusData).length,
        location: `${zipCode}, ${state}`
      };

    } catch (error) {
      logger.error('Census data ingestion failed:', error);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Ingest Better Business Bureau data
   */
  async ingestBBBData() {
    logger.info('Ingesting BBB data...');
    
    try {
      const businessInfo = await this.getTenantBusinessInfo();
      const industry = businessInfo.industry || 'professional-services';
      const location = `${businessInfo.city}, ${businessInfo.state}` || 'Los Angeles, CA';

      // BBB doesn't have a public API, so we'll simulate with industry data
      const bbbData = {
        industryRatings: await this.getIndustryRatings(industry),
        competitorAnalysis: await this.getCompetitorAnalysis(industry, location),
        complaintsData: await this.getComplaintsData(industry)
      };

      await this.storeDataset('bbb', bbbData, {
        source: 'Better Business Bureau (simulated)',
        industry: industry,
        location: location
      });

      return {
        status: 'success',
        industry: industry,
        competitorCount: bbbData.competitorAnalysis?.length || 0
      };

    } catch (error) {
      logger.error('BBB data ingestion failed:', error);
      return {
        status: 'failed', 
        error: error.message
      };
    }
  }

  /**
   * Ingest Yelp business data
   */
  async ingestYelpData() {
    logger.info('Ingesting Yelp data...');
    
    try {
      const businessInfo = await this.getTenantBusinessInfo();
      const yelpApiKey = process.env.YELP_API_KEY;
      
      if (!yelpApiKey) {
        logger.warn('Yelp API key not configured, using mock data');
        return await this.getMockYelpData();
      }

      const searchParams = {
        term: businessInfo.industry || 'professional services',
        location: `${businessInfo.city}, ${businessInfo.state}` || 'Los Angeles, CA',
        limit: 50,
        sort_by: 'rating'
      };

      const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
        headers: { 'Authorization': `Bearer ${yelpApiKey}` },
        params: searchParams,
        timeout: 10000
      });

      const yelpData = {
        businesses: response.data.businesses,
        total: response.data.total,
        searchParams: searchParams
      };

      await this.storeDataset('yelp', yelpData, {
        source: 'Yelp Fusion API',
        searchTerm: searchParams.term,
        location: searchParams.location
      });

      return {
        status: 'success',
        businessCount: yelpData.businesses?.length || 0,
        totalAvailable: yelpData.total
      };

    } catch (error) {
      logger.error('Yelp data ingestion failed:', error);
      // Fallback to mock data
      return await this.getMockYelpData();
    }
  }

  /**
   * Ingest LinkedIn industry insights
   */
  async ingestLinkedInData() {
    logger.info('Ingesting LinkedIn data...');
    
    try {
      const businessInfo = await this.getTenantBusinessInfo();
      
      // LinkedIn API requires OAuth, so we'll simulate with industry insights
      const linkedinData = {
        industryInsights: await this.getIndustryInsights(businessInfo.industry),
        talentPool: await this.getTalentPoolData(businessInfo.location),
        skillsData: await this.getSkillsData(businessInfo.industry),
        salaryData: await this.getSalaryData(businessInfo.industry, businessInfo.location)
      };

      await this.storeDataset('linkedin', linkedinData, {
        source: 'LinkedIn (simulated)',
        industry: businessInfo.industry,
        location: businessInfo.location
      });

      return {
        status: 'success',
        industry: businessInfo.industry,
        insights: Object.keys(linkedinData).length
      };

    } catch (error) {
      logger.error('LinkedIn data ingestion failed:', error);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Get tenant business information
   */
  async getTenantBusinessInfo() {
    try {
      // Try to get from tenant metadata
      const metadataKey = `tenants/${this.tenantId}/metadata/business-info.json`;
      const command = new GetObjectCommand({
        Bucket: this.baseBucket,
        Key: metadataKey
      });
      const response = await this.s3.send(command);
      
      return JSON.parse(response.Body.toString());
    } catch (error) {
      // Return default business info
      return {
        industry: 'professional-services',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        size: 'small'
      };
    }
  }

  /**
   * Get existing tenant documents
   */
  async getTenantDocuments() {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.baseBucket,
        Prefix: `tenants/${this.tenantId}/docs/`
      });

      const result = await this.s3.send(listCommand);
      return result.Contents || [];
    } catch (error) {
      logger.error('Failed to get tenant documents:', error);
      return [];
    }
  }

  /**
   * Generate AI insights from combined data
   */
  async generateAIInsights(datasets, tenantDocs) {
    logger.info('Generating AI insights from combined datasets...');
    
    try {
      // Prepare prompt for Claude
      const prompt = this.buildInsightsPrompt(datasets, tenantDocs);
      
      const claudeParams = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      };

      const command = new InvokeModelCommand(claudeParams);
      const response = await this.bedrock.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      const insights = {
        summary: responseBody.content[0].text,
        datasets_analyzed: Object.keys(datasets),
        tenant_docs_count: tenantDocs.length,
        generated_at: new Date().toISOString(),
        recommendations: this.extractRecommendations(responseBody.content[0].text)
      };

      return insights;

    } catch (error) {
      logger.error('AI insights generation failed:', error);
      return {
        summary: 'AI insights generation temporarily unavailable',
        error: error.message,
        generated_at: new Date().toISOString()
      };
    }
  }

  /**
   * Build prompt for AI insights generation
   */
  buildInsightsPrompt(datasets, tenantDocs) {
    return `Analyze the following datasets and provide business insights:

DATASETS AVAILABLE:
${Object.keys(datasets).map(key => `- ${key.toUpperCase()}: ${datasets[key].status || 'Available'}`).join('\n')}

TENANT DOCUMENTS: ${tenantDocs.length} files available

Please provide:
1. Market opportunity analysis
2. Competitive landscape insights  
3. Target audience demographics
4. Growth recommendations
5. Risk factors to consider

Focus on actionable insights that can help improve business performance.`;
  }

  /**
   * Extract recommendations from AI response
   */
  extractRecommendations(aiText) {
    // Simple extraction - could be enhanced with NLP
    const recommendations = [];
    const lines = aiText.split('\n');
    
    for (const line of lines) {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Store dataset in S3
   */
  async storeDataset(type, data, metadata) {
    const key = `tenants/${this.tenantId}/datasets/${type}/${Date.now()}.json`;
    
    const document = {
      type: type,
      data: data,
      metadata: metadata,
      ingested_at: new Date().toISOString(),
      tenant_id: this.tenantId
    };

    const putCommand = new PutObjectCommand({
      Bucket: this.baseBucket,
      Key: key,
      Body: JSON.stringify(document, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms'
    });

    await this.s3.send(putCommand);
    logger.info(`Dataset stored: ${type} -> ${key}`);
  }

  /**
   * Store AI insights
   */
  async storeInsights(insights) {
    const key = `tenants/${this.tenantId}/insights/combined-analysis-${Date.now()}.json`;
    
    const putCommand = new PutObjectCommand({
      Bucket: this.baseBucket,
      Key: key,
      Body: JSON.stringify(insights, null, 2),
      ContentType: 'application/json',
      ServerSideEncryption: 'aws:kms'
    });

    await this.s3.send(putCommand);
    logger.info(`Insights stored: ${key}`);
  }

  // Mock data methods for demo/development
  getMockCensusData(index) {
    const mockData = [
      [['Population', 'Housing Units', 'Median Income'], ['45234', '18567', '75432']],
      [['Employees', 'Payroll', 'Establishments'], ['12450', '890000000', '1834']],
      [['High School', 'Associates', 'Bachelors', 'Masters', 'Doctorate'], ['8934', '3421', '5678', '2341', '567']]
    ];
    return mockData[index] || mockData[0];
  }

  async getMockYelpData() {
    return {
      status: 'success',
      businessCount: 25,
      totalAvailable: 1250,
      note: 'Using mock data - Yelp API key not configured'
    };
  }

  async getIndustryRatings(industry) {
    return {
      avgRating: 4.2,
      reviewCount: 1847,
      industry: industry
    };
  }

  async getCompetitorAnalysis(industry, location) {
    return [
      { name: 'Competitor A', rating: 4.5, reviews: 234 },
      { name: 'Competitor B', rating: 4.1, reviews: 156 }
    ];
  }

  async getComplaintsData(industry) {
    return {
      totalComplaints: 23,
      resolvedRate: 0.87,
      avgResolutionDays: 12
    };
  }

  async getIndustryInsights(industry) {
    return {
      growth_rate: '12%',
      hiring_trend: 'increasing',
      top_skills: ['project management', 'communication', 'analysis']
    };
  }

  async getTalentPoolData(location) {
    return {
      available_professionals: 12450,
      avg_experience: '5.3 years',
      location: location
    };
  }

  async getSkillsData(industry) {
    return {
      in_demand: ['digital marketing', 'data analysis', 'client management'],
      emerging: ['AI/ML', 'automation', 'remote collaboration']
    };
  }

  async getSalaryData(industry, location) {
    return {
      median_salary: 75000,
      salary_range: '45000-120000',
      location: location
    };
  }
}

module.exports = { DatasetIngestionService };
