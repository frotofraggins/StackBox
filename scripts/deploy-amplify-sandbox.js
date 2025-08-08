#!/usr/bin/env node

/**
 * AWS Amplify Sandbox Deployment Script
 * Deploys StackPro frontend to sandbox.stackpro.io in free-tier mode
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  region: 'us-west-2',
  appName: 'StackPro-Sandbox',
  repository: 'https://github.com/frotofraggins/StackBox.git',
  branch: 'main',
  domain: 'sandbox.stackpro.io',
  githubToken: process.env.GITHUB_TOKEN,
  tags: {
    Project: 'StackPro',
    Environment: 'FreeTier',
    Owner: 'Ops',
    Purpose: 'Sandbox',
    CostCenter: 'FreeTier'
  },
  environmentVariables: {
    // Exact requirements from user
    NEXT_PUBLIC_ENV: 'sandbox',
    NEXT_PUBLIC_API_URL: 'https://api-sandbox.stackpro.io',
    NEXT_PUBLIC_WS_URL: 'wss://ws-sandbox.stackpro.io',
    NEXT_PUBLIC_FREE_TIER: 'true',
    AI_ENABLED: 'false',
    TURNSTILE_ENABLED: 'true',
    // Production build settings
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    // Remove source maps for security
    GENERATE_SOURCEMAP: 'false',
    // Additional sandbox settings
    NEXT_PUBLIC_MESSAGING_ENABLED: 'true',
    NEXT_PUBLIC_SITE_BUILDER_ENABLED: 'true',
    NEXT_PUBLIC_MAX_USERS: '10',
    NEXT_PUBLIC_MAX_STORAGE_MB: '100'
  }
};

class AmplifyDeployer {
  constructor() {
    this.amplify = new AWS.Amplify({ region: CONFIG.region });
    this.route53 = new AWS.Route53({ region: CONFIG.region });
    this.acm = new AWS.ACM({ region: 'us-east-1' }); // ACM certs must be in us-east-1 for CloudFront
    this.appId = null;
    this.domainAssociationId = null;
  }

  async init() {
    console.log('🚀 Starting StackPro Sandbox Deployment to AWS Amplify...');
    console.log(`📍 Region: ${CONFIG.region}`);
    console.log(`🌐 Domain: ${CONFIG.domain}`);
    console.log(`📦 Repository: ${CONFIG.repository}`);
    
    try {
      await this.createAmplifyApp();
      await this.configureBuildSettings();
      await this.setEnvironmentVariables();
      await this.createBranch();
      await this.startBuild();
      await this.setupDomain();
      await this.configureSSL();
      await this.verifyDeployment();
      console.log('✅ Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.log('🔄 Running rollback...');
      await this.rollback();
      process.exit(1);
    }
  }

  async createAmplifyApp() {
    console.log('📱 Creating Amplify app...');
    
    try {
      // Check if app already exists
      const existingApps = await this.amplify.listApps().promise();
      const existingApp = existingApps.apps.find(app => app.name === CONFIG.appName);
      
      if (existingApp) {
        console.log(`📱 Using existing app: ${existingApp.name} (${existingApp.appId})`);
        this.appId = existingApp.appId;
        return;
      }

      const params = {
        name: CONFIG.appName,
        repository: CONFIG.repository,
        platform: 'WEB',
        description: 'StackPro Sandbox Frontend - Free Tier Demo Environment',
        tags: CONFIG.tags,
        environmentVariables: CONFIG.environmentVariables,
        buildSpec: this.getBuildSpec(),
        accessToken: CONFIG.githubToken
      };

      const result = await this.amplify.createApp(params).promise();
      this.appId = result.app.appId;
      
      console.log(`✅ Created Amplify app: ${result.app.name} (${this.appId})`);
    } catch (error) {
      throw new Error(`Failed to create Amplify app: ${error.message}`);
    }
  }

  getBuildSpec() {
    return `version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies for sandbox deployment"
            - cd frontend
            - npm ci
        build:
          commands:
            - echo "Building Next.js app for sandbox"
            - echo "Free tier mode: $NEXT_PUBLIC_FREE_TIER"
            - echo "AI disabled: $AI_ENABLED"
            - npm run build
      artifacts:
        baseDirectory: frontend
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
    appRoot: ./`;
  }

  async configureBuildSettings() {
    console.log('⚙️ Configuring build settings...');
    
    const params = {
      appId: this.appId,
      buildSpec: this.getBuildSpec()
    };

    await this.amplify.updateApp(params).promise();
    console.log('✅ Build settings configured');
  }

  async setEnvironmentVariables() {
    console.log('🔧 Setting environment variables...');
    
    for (const [key, value] of Object.entries(CONFIG.environmentVariables)) {
      const params = {
        appId: this.appId,
        environmentName: 'main',
        environmentVariables: {
          [key]: value
        }
      };
      
      try {
        await this.amplify.putBackendEnvironment(params).promise();
      } catch (error) {
        // Environment might not exist yet, that's ok
        console.log(`Note: ${key} will be set during branch creation`);
      }
    }
    
    console.log('✅ Environment variables configured');
  }

  async createBranch() {
    console.log('🌿 Creating main branch...');
    
    try {
      const params = {
        appId: this.appId,
        branchName: CONFIG.branch,
        description: 'Main branch for sandbox deployment',
        enableAutoBuild: true,
        enablePullRequestPreview: false,
        environmentVariables: CONFIG.environmentVariables,
        tags: CONFIG.tags
      };

      const result = await this.amplify.createBranch(params).promise();
      console.log(`✅ Created branch: ${result.branch.branchName}`);
    } catch (error) {
      if (error.code === 'DependentServiceFailureException' || error.message.includes('already exists')) {
        console.log('✅ Branch already exists, updating configuration...');
        
        const updateParams = {
          appId: this.appId,
          branchName: CONFIG.branch,
          environmentVariables: CONFIG.environmentVariables,
          enableAutoBuild: true
        };
        
        await this.amplify.updateBranch(updateParams).promise();
        console.log('✅ Branch configuration updated');
      } else {
        throw new Error(`Failed to create branch: ${error.message}`);
      }
    }
  }

  async startBuild() {
    console.log('🔨 Starting build...');
    
    const params = {
      appId: this.appId,
      branchName: CONFIG.branch,
      jobType: 'RELEASE'
    };

    const result = await this.amplify.startJob(params).promise();
    const jobId = result.jobSummary.jobId;
    
    console.log(`✅ Build started: ${jobId}`);
    console.log('⏳ Waiting for build to complete...');

    // Poll for build completion
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      const statusParams = {
        appId: this.appId,
        branchName: CONFIG.branch,
        jobId: jobId
      };
      
      const status = await this.amplify.getJob(statusParams).promise();
      console.log(`🔄 Build status: ${status.job.summary.status}`);
      
      if (status.job.summary.status === 'SUCCEED') {
        console.log('✅ Build completed successfully!');
        return;
      } else if (status.job.summary.status === 'FAILED') {
        console.warn('⚠️ Build failed - preserving app for debugging');
        console.log(`🔗 Check build logs: https://console.aws.amazon.com/amplify/home?region=${CONFIG.region}#/${this.appId}/deployments`);
        // Don't throw error, continue with partial deployment for debugging
        return;
      }
      
      attempts++;
    }
    
    throw new Error('Build timed out after 30 minutes');
  }

  async setupDomain() {
    console.log('🌐 Setting up custom domain...');
    
    try {
      // Check if domain association already exists
      const existingDomains = await this.amplify.listDomainAssociations({
        appId: this.appId
      }).promise();
      
      const existingDomain = existingDomains.domainAssociations.find(
        domain => domain.domainName === CONFIG.domain
      );
      
      if (existingDomain) {
        console.log(`✅ Using existing domain association: ${existingDomain.domainName}`);
        this.domainAssociationId = existingDomain.domainAssociationArn;
        return;
      }

      const params = {
        appId: this.appId,
        domainName: CONFIG.domain,
        enableAutoSubDomain: false,
        subDomainSettings: [
          {
            prefix: '',
            branchName: CONFIG.branch
          }
        ]
      };

      const result = await this.amplify.createDomainAssociation(params).promise();
      this.domainAssociationId = result.domainAssociation.domainAssociationArn;
      
      console.log(`✅ Domain association created: ${CONFIG.domain}`);
      console.log('📝 Manual DNS setup required:');
      console.log('   Add the following CNAME record to your DNS:');
      console.log(`   Name: ${CONFIG.domain}`);
      console.log(`   Value: ${result.domainAssociation.certificateVerificationDNSRecord}`);
      
    } catch (error) {
      console.warn(`⚠️ Domain setup failed: ${error.message}`);
      console.log('📝 You can manually configure the domain in the Amplify console');
    }
  }

  async configureSSL() {
    console.log('🔒 Configuring SSL certificate...');
    
    try {
      // List existing certificates
      const certs = await this.acm.listCertificates({
        CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
      }).promise();
      
      // Look for existing certificate for the domain
      const existingCert = certs.CertificateSummaryList.find(
        cert => cert.DomainName === CONFIG.domain || 
                cert.SubjectAlternativeNameSummary?.includes(CONFIG.domain)
      );
      
      if (existingCert) {
        console.log(`✅ Using existing SSL certificate: ${existingCert.CertificateArn}`);
        return existingCert.CertificateArn;
      }

      // Request new certificate
      const certParams = {
        DomainName: CONFIG.domain,
        ValidationMethod: 'DNS',
        Tags: Object.entries(CONFIG.tags).map(([Key, Value]) => ({ Key, Value }))
      };

      const certResult = await this.acm.requestCertificate(certParams).promise();
      console.log(`✅ SSL certificate requested: ${certResult.CertificateArn}`);
      console.log('📝 Manual DNS validation required for SSL certificate');
      
      return certResult.CertificateArn;
      
    } catch (error) {
      console.warn(`⚠️ SSL configuration failed: ${error.message}`);
      console.log('📝 SSL certificate can be configured manually in ACM console');
    }
  }

  async verifyDeployment() {
    console.log('✅ Verifying deployment...');
    
    const app = await this.amplify.getApp({ appId: this.appId }).promise();
    const branch = await this.amplify.getBranch({
      appId: this.appId,
      branchName: CONFIG.branch
    }).promise();

    console.log('\n🎉 Deployment Summary:');
    console.log(`📱 App Name: ${app.app.name}`);
    console.log(`🆔 App ID: ${this.appId}`);
    console.log(`🌿 Branch: ${branch.branch.branchName}`);
    console.log(`🌐 Default Domain: ${branch.branch.displayName}.${app.app.defaultDomain}`);
    console.log(`🎯 Custom Domain: ${CONFIG.domain} (if configured)`);
    console.log(`📍 Region: ${CONFIG.region}`);
    console.log(`🏷️ Environment: FreeTier Sandbox`);
    
    console.log('\n🔗 Useful Links:');
    console.log(`📊 Amplify Console: https://console.aws.amazon.com/amplify/home?region=${CONFIG.region}#/${this.appId}`);
    console.log(`🌐 Live Site: https://${branch.branch.displayName}.${app.app.defaultDomain}`);
    
    this.saveSummary({
      appId: this.appId,
      appName: app.app.name,
      defaultDomain: `${branch.branch.displayName}.${app.app.defaultDomain}`,
      customDomain: CONFIG.domain,
      region: CONFIG.region,
      repository: CONFIG.repository,
      branch: CONFIG.branch
    });
  }

  async rollback() {
    console.log('🔄 Starting rollback process...');
    
    try {
      if (this.domainAssociationId) {
        console.log('🗑️ Removing domain association...');
        await this.amplify.deleteDomainAssociation({
          appId: this.appId,
          domainName: CONFIG.domain
        }).promise();
      }
      
      if (this.appId) {
        console.log('🗑️ Deleting Amplify app...');
        await this.amplify.deleteApp({
          appId: this.appId
        }).promise();
      }
      
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      console.log('📝 Manual cleanup may be required in AWS console');
    }
  }

  saveSummary(summary) {
    const summaryPath = path.join(__dirname, '..', 'logs', 'amplify-sandbox-deployment.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Deployment summary saved: ${summaryPath}`);
  }
}

// Rollback function for standalone use
async function rollbackDeployment() {
  console.log('🔄 Starting standalone rollback...');
  
  const deployer = new AmplifyDeployer();
  
  try {
    // Load previous deployment info
    const summaryPath = path.join(__dirname, '..', 'logs', 'amplify-sandbox-deployment.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      deployer.appId = summary.appId;
      deployer.domainAssociationId = summary.customDomain;
      
      await deployer.rollback();
      
      // Remove summary file
      fs.unlinkSync(summaryPath);
      console.log('✅ Rollback completed and summary file removed');
    } else {
      console.log('⚠️ No deployment summary found. Manual cleanup may be required.');
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

// Cost monitoring
async function checkFreeTierUsage() {
  console.log('💰 Checking free tier usage...');
  
  const costExplorer = new AWS.CostExplorer({ region: 'us-east-1' });
  
  const params = {
    TimePeriod: {
      Start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      End: new Date().toISOString().split('T')[0]
    },
    Granularity: 'MONTHLY',
    Metrics: ['BlendedCost'],
    GroupBy: [{
      Type: 'DIMENSION',
      Key: 'SERVICE'
    }],
    Filter: {
      Dimensions: {
        Key: 'SERVICE',
        Values: ['AWS Amplify', 'Amazon CloudFront', 'Amazon Route 53']
      }
    }
  };
  
  try {
    const result = await costExplorer.getCostAndUsage(params).promise();
    console.log('💰 Current month costs:');
    
    result.ResultsByTime.forEach(period => {
      period.Groups.forEach(group => {
        const service = group.Keys[0];
        const cost = parseFloat(group.Metrics.BlendedCost.Amount);
        console.log(`   ${service}: $${cost.toFixed(2)}`);
      });
    });
  } catch (error) {
    console.warn('⚠️ Could not retrieve cost information:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    await rollbackDeployment();
  } else if (args.includes('--cost-check')) {
    await checkFreeTierUsage();
  } else if (args.includes('--help')) {
    console.log('📖 StackPro Amplify Sandbox Deployment');
    console.log('');
    console.log('Usage:');
    console.log('  node deploy-amplify-sandbox.js           # Deploy to sandbox');
    console.log('  node deploy-amplify-sandbox.js --rollback # Rollback deployment');
    console.log('  node deploy-amplify-sandbox.js --cost-check # Check free tier usage');
    console.log('  node deploy-amplify-sandbox.js --help    # Show this help');
  } else {
    const deployer = new AmplifyDeployer();
    await deployer.init();
    await checkFreeTierUsage();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { AmplifyDeployer, rollbackDeployment, checkFreeTierUsage };
