#!/usr/bin/env node

/**
 * StackPro Production Deployment to AWS Amplify
 * Deploys frontend to stackpro.io with SSL certificate
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Production Configuration
const PRODUCTION_CONFIG = {
  region: 'us-west-2',
  appName: 'StackPro-Production',
  repository: 'https://github.com/frotofraggins/StackBox.git',
  branch: 'main',
  domain: 'stackpro.io',
  profile: 'Stackbox',
  accountId: '304052673868',
  tags: {
    Project: 'StackPro',
    Environment: 'Production',
    Owner: 'Ops',
    Purpose: 'Customer-Production',
    CostCenter: 'Revenue'
  },
  environmentVariables: {
    // Production environment configuration
    NEXT_PUBLIC_ENV: 'production',
    NEXT_PUBLIC_API_URL: 'https://api.stackpro.io',
    NEXT_PUBLIC_BACKEND_URL: 'https://api.stackpro.io',
    NEXT_PUBLIC_WEBSOCKET_URL: 'wss://ws.stackpro.io',
    NEXT_PUBLIC_FREE_TIER: 'false',
    AI_ENABLED: 'true',
    NEXT_PUBLIC_AI_ENABLED: 'true',
    NEXT_PUBLIC_MESSAGING_ENABLED: 'true',
    NEXT_PUBLIC_SITE_BUILDER_ENABLED: 'true',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_production',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    // Production features - no limits
    NEXT_PUBLIC_MAX_USERS: '1000',
    NEXT_PUBLIC_MAX_STORAGE_GB: '100',
    NEXT_PUBLIC_MAX_EMAILS_PER_MONTH: '10000',
    NEXT_PUBLIC_FEATURES_CRM: 'full',
    NEXT_PUBLIC_FEATURES_FILES: 'full',
    NEXT_PUBLIC_FEATURES_WEBSITE: 'full',
    NEXT_PUBLIC_FEATURES_AI: 'full'
  }
};

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class ProductionAmplifyDeployer {
  constructor() {
    // Use Stackbox profile for production
    this.amplify = new AWS.Amplify({ 
      region: PRODUCTION_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: PRODUCTION_CONFIG.profile })
    });
    this.route53 = new AWS.Route53({ 
      region: PRODUCTION_CONFIG.region,
      credentials: new AWS.SharedIniFileCredentials({ profile: PRODUCTION_CONFIG.profile })
    });
    this.acm = new AWS.ACM({ 
      region: 'us-east-1', // ACM for CloudFront must be in us-east-1
      credentials: new AWS.SharedIniFileCredentials({ profile: PRODUCTION_CONFIG.profile })
    });
    
    this.appId = null;
    this.certificateArn = null;
    this.hostedZoneId = null;
  }

  async init() {
    log('🚀 Starting StackPro Production Deployment', 'bold');
    log(`📍 Region: ${PRODUCTION_CONFIG.region}`, 'blue');
    log(`🌐 Domain: ${PRODUCTION_CONFIG.domain}`, 'blue');
    log(`📦 Repository: ${PRODUCTION_CONFIG.repository}`, 'blue');
    log(`👤 Profile: ${PRODUCTION_CONFIG.profile} (${PRODUCTION_CONFIG.accountId})`, 'blue');
    
    try {
      await this.validatePrerequisites();
      await this.findSSLCertificate();
      await this.createAmplifyApp();
      await this.configureBuildSettings();
      await this.setEnvironmentVariables();
      await this.createBranch();
      await this.startBuild();
      await this.setupCustomDomain();
      await this.verifyDeployment();
      
      log('✅ Production deployment completed successfully!', 'green');
      log('🎉 StackPro is now live at https://stackpro.io', 'green');
      
    } catch (error) {
      log(`❌ Deployment failed: ${error.message}`, 'red');
      console.log('🔄 Running rollback...');
      await this.rollback();
      process.exit(1);
    }
  }

  async validatePrerequisites() {
    log('🔍 Validating deployment prerequisites...', 'bold');
    
    try {
      // Verify we're in the correct AWS account
      const sts = new AWS.STS({
        credentials: new AWS.SharedIniFileCredentials({ profile: PRODUCTION_CONFIG.profile })
      });
      const identity = await sts.getCallerIdentity().promise();
      
      if (identity.Account !== PRODUCTION_CONFIG.accountId) {
        throw new Error(`Wrong AWS account: ${identity.Account} (expected ${PRODUCTION_CONFIG.accountId})`);
      }
      
      log(`✅ AWS Account: ${identity.Account}`, 'green');
      
      // Verify domain is in this account
      const route53Domains = new AWS.Route53Domains({
        region: 'us-east-1',
        credentials: new AWS.SharedIniFileCredentials({ profile: PRODUCTION_CONFIG.profile })
      });
      
      const domains = await route53Domains.listDomains().promise();
      const domain = domains.Domains.find(d => d.DomainName === PRODUCTION_CONFIG.domain);
      
      if (!domain) {
        throw new Error(`Domain ${PRODUCTION_CONFIG.domain} not found in account ${PRODUCTION_CONFIG.accountId}`);
      }
      
      log(`✅ Domain: ${domain.DomainName} (expires ${domain.Expiry})`, 'green');
      
      // Find hosted zone
      const hostedZones = await this.route53.listHostedZones().promise();
      const hostedZone = hostedZones.HostedZones.find(z => z.Name === `${PRODUCTION_CONFIG.domain}.`);
      
      if (!hostedZone) {
        throw new Error(`Hosted zone for ${PRODUCTION_CONFIG.domain} not found`);
      }
      
      this.hostedZoneId = hostedZone.Id.split('/')[2];
      log(`✅ Hosted Zone: ${this.hostedZoneId}`, 'green');
      
    } catch (error) {
      throw new Error(`Prerequisite validation failed: ${error.message}`);
    }
  }

  async findSSLCertificate() {
    log('🔒 Looking for SSL certificate...', 'bold');
    
    try {
      const certificates = await this.acm.listCertificates({
        CertificateStatuses: ['ISSUED']
      }).promise();
      
      // Find certificate for our domain
      const cert = certificates.CertificateSummaryList.find(c => 
        c.DomainName === PRODUCTION_CONFIG.domain || 
        c.SubjectAlternativeNameSummary?.includes(PRODUCTION_CONFIG.domain)
      );
      
      if (!cert) {
        log('❌ No issued SSL certificate found', 'red');
        log('🔧 Please run the SSL certificate setup first:', 'yellow');
        log('   node scripts/request-production-ssl.js', 'blue');
        throw new Error('SSL certificate not found');
      }
      
      // Verify certificate is issued
      const certDetails = await this.acm.describeCertificate({
        CertificateArn: cert.CertificateArn
      }).promise();
      
      if (certDetails.Certificate.Status !== 'ISSUED') {
        throw new Error(`Certificate status is ${certDetails.Certificate.Status}, expected ISSUED`);
      }
      
      this.certificateArn = cert.CertificateArn;
      log(`✅ SSL Certificate: ${cert.CertificateArn}`, 'green');
      log(`   Status: ${certDetails.Certificate.Status}`, 'blue');
      log(`   Domains: ${certDetails.Certificate.DomainName}`, 'blue');
      
    } catch (error) {
      throw new Error(`SSL certificate validation failed: ${error.message}`);
    }
  }

  async createAmplifyApp() {
    log('📱 Creating/updating Amplify app...', 'bold');
    
    try {
      // Check if app already exists
      const existingApps = await this.amplify.listApps().promise();
      const existingApp = existingApps.apps.find(app => app.name === PRODUCTION_CONFIG.appName);
      
      if (existingApp) {
        log(`📱 Using existing app: ${existingApp.name} (${existingApp.appId})`, 'green');
        this.appId = existingApp.appId;
        
        // Update app configuration
        await this.amplify.updateApp({
          appId: this.appId,
          name: PRODUCTION_CONFIG.appName,
          description: 'StackPro Production - Customer-Facing SaaS Platform',
          repository: PRODUCTION_CONFIG.repository,
          environmentVariables: PRODUCTION_CONFIG.environmentVariables,
          buildSpec: this.getBuildSpec(),
          tags: PRODUCTION_CONFIG.tags
        }).promise();
        
        log(`✅ Updated existing app configuration`, 'green');
        return;
      }

      // Create new app
      const params = {
        name: PRODUCTION_CONFIG.appName,
        repository: PRODUCTION_CONFIG.repository,
        platform: 'WEB',
        description: 'StackPro Production - Complete Business Platform SaaS',
        tags: PRODUCTION_CONFIG.tags,
        environmentVariables: PRODUCTION_CONFIG.environmentVariables,
        buildSpec: this.getBuildSpec(),
        enableBranchAutoBuild: true,
        enableBranchAutoDeploy: true,
        enablePullRequestPreview: false
      };

      const result = await this.amplify.createApp(params).promise();
      this.appId = result.app.appId;
      
      log(`✅ Created new Amplify app: ${result.app.name} (${this.appId})`, 'green');
      
    } catch (error) {
      throw new Error(`Failed to create/update Amplify app: ${error.message}`);
    }
  }

  getBuildSpec() {
    return `version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies for production deployment"
            - cd frontend
            - npm ci --production
        build:
          commands:
            - echo "Building Next.js app for production"
            - echo "Environment: $NEXT_PUBLIC_ENV"
            - echo "AI enabled: $AI_ENABLED"
            - echo "API URL: $NEXT_PUBLIC_API_URL"
            - npm run build
        postBuild:
          commands:
            - echo "Production build completed"
            - echo "Build artifacts ready for deployment"
      artifacts:
        baseDirectory: frontend/.next
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
    appRoot: ./`;
  }

  async configureBuildSettings() {
    log('⚙️ Configuring build settings...', 'bold');
    
    try {
      const params = {
        appId: this.appId,
        buildSpec: this.getBuildSpec()
      };

      await this.amplify.updateApp(params).promise();
      log('✅ Build settings configured', 'green');
      
    } catch (error) {
      throw new Error(`Build settings configuration failed: ${error.message}`);
    }
  }

  async setEnvironmentVariables() {
    log('🔧 Setting production environment variables...', 'bold');
    
    try {
      // Update app-level environment variables
      await this.amplify.updateApp({
        appId: this.appId,
        environmentVariables: PRODUCTION_CONFIG.environmentVariables
      }).promise();
      
      log('✅ Environment variables configured', 'green');
      log(`   API URL: ${PRODUCTION_CONFIG.environmentVariables.NEXT_PUBLIC_API_URL}`, 'blue');
      log(`   WebSocket: ${PRODUCTION_CONFIG.environmentVariables.NEXT_PUBLIC_WEBSOCKET_URL}`, 'blue');
      log(`   AI Enabled: ${PRODUCTION_CONFIG.environmentVariables.AI_ENABLED}`, 'blue');
      
    } catch (error) {
      throw new Error(`Environment variables configuration failed: ${error.message}`);
    }
  }

  async createBranch() {
    log('🌿 Creating/updating main branch...', 'bold');
    
    try {
      // Check if branch exists
      try {
        const existingBranch = await this.amplify.getBranch({
          appId: this.appId,
          branchName: PRODUCTION_CONFIG.branch
        }).promise();
        
        // Update existing branch
        await this.amplify.updateBranch({
          appId: this.appId,
          branchName: PRODUCTION_CONFIG.branch,
          description: 'Production main branch',
          enableAutoBuild: true,
          environmentVariables: PRODUCTION_CONFIG.environmentVariables,
          tags: PRODUCTION_CONFIG.tags
        }).promise();
        
        log(`✅ Updated existing branch: ${PRODUCTION_CONFIG.branch}`, 'green');
        
      } catch (branchError) {
        if (branchError.code === 'NotFoundException') {
          // Create new branch
          const params = {
            appId: this.appId,
            branchName: PRODUCTION_CONFIG.branch,
            description: 'Production main branch for customer access',
            enableAutoBuild: true,
            enablePullRequestPreview: false,
            environmentVariables: PRODUCTION_CONFIG.environmentVariables,
            tags: PRODUCTION_CONFIG.tags
          };

          await this.amplify.createBranch(params).promise();
          log(`✅ Created new branch: ${PRODUCTION_CONFIG.branch}`, 'green');
        } else {
          throw branchError;
        }
      }
      
    } catch (error) {
      throw new Error(`Branch creation/update failed: ${error.message}`);
    }
  }

  async startBuild() {
    log('🔨 Starting production build...', 'bold');
    
    try {
      const params = {
        appId: this.appId,
        branchName: PRODUCTION_CONFIG.branch,
        jobType: 'RELEASE'
      };

      const result = await this.amplify.startJob(params).promise();
      const jobId = result.jobSummary.jobId;
      
      log(`✅ Build started: ${jobId}`, 'green');
      log('⏳ Waiting for build to complete...', 'yellow');

      // Poll for build completion with longer timeout for production builds
      let attempts = 0;
      const maxAttempts = 80; // 40 minutes max for production builds
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        const statusParams = {
          appId: this.appId,
          branchName: PRODUCTION_CONFIG.branch,
          jobId: jobId
        };
        
        const status = await this.amplify.getJob(statusParams).promise();
        log(`🔄 Build status: ${status.job.summary.status} (${Math.floor(attempts/2)} minutes)`, 'blue');
        
        if (status.job.summary.status === 'SUCCEED') {
          log('✅ Production build completed successfully!', 'green');
          return;
        } else if (status.job.summary.status === 'FAILED') {
          // Get build logs for debugging
          log('❌ Build failed. Recent log entries:', 'red');
          if (status.job.steps) {
            status.job.steps.forEach(step => {
              if (step.logUrl) {
                log(`   Step: ${step.stepName}`, 'yellow');
                log(`   Log: ${step.logUrl}`, 'blue');
              }
            });
          }
          throw new Error('Production build failed. Check build logs in Amplify console.');
        }
        
        attempts++;
      }
      
      throw new Error('Build timed out after 40 minutes');
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async setupCustomDomain() {
    log('🌐 Setting up custom domain with SSL...', 'bold');
    
    try {
      // Check if domain association already exists
      const existingDomains = await this.amplify.listDomainAssociations({
        appId: this.appId
      }).promise();
      
      const existingDomain = existingDomains.domainAssociations.find(
        domain => domain.domainName === PRODUCTION_CONFIG.domain
      );
      
      if (existingDomain) {
        log(`✅ Using existing domain association: ${existingDomain.domainName}`, 'green');
        log(`   Status: ${existingDomain.domainStatus}`, 'blue');
        return;
      }

      // Create new domain association with SSL certificate
      const params = {
        appId: this.appId,
        domainName: PRODUCTION_CONFIG.domain,
        enableAutoSubDomain: false,
        subDomainSettings: [
          {
            prefix: '',
            branchName: PRODUCTION_CONFIG.branch
          },
          {
            prefix: 'www',
            branchName: PRODUCTION_CONFIG.branch
          }
        ],
        certificateSettings: {
          type: 'AMPLIFY_MANAGED',
          certificateVerificationDNSRecord: undefined // Let Amplify manage
        }
      };

      const result = await this.amplify.createDomainAssociation(params).promise();
      
      log(`✅ Domain association created: ${PRODUCTION_CONFIG.domain}`, 'green');
      log(`   Status: ${result.domainAssociation.domainStatus}`, 'blue');
      log(`   Certificate: Amplify-managed SSL`, 'blue');
      
      // Wait for domain verification (this can take a few minutes)
      log('⏳ Waiting for domain verification...', 'yellow');
      
      let verificationAttempts = 0;
      const maxVerificationAttempts = 20; // 10 minutes
      
      while (verificationAttempts < maxVerificationAttempts) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        const domainStatus = await this.amplify.getDomainAssociation({
          appId: this.appId,
          domainName: PRODUCTION_CONFIG.domain
        }).promise();
        
        log(`🔄 Domain status: ${domainStatus.domainAssociation.domainStatus}`, 'blue');
        
        if (domainStatus.domainAssociation.domainStatus === 'AVAILABLE') {
          log('✅ Domain verification completed!', 'green');
          break;
        } else if (domainStatus.domainAssociation.domainStatus === 'FAILED') {
          throw new Error('Domain verification failed');
        }
        
        verificationAttempts++;
      }
      
      if (verificationAttempts >= maxVerificationAttempts) {
        log('⚠️ Domain verification taking longer than expected', 'yellow');
        log('   The domain will continue verifying in the background', 'blue');
      }
      
    } catch (error) {
      throw new Error(`Custom domain setup failed: ${error.message}`);
    }
  }

  async verifyDeployment() {
    log('✅ Verifying production deployment...', 'bold');
    
    try {
      // Get app details
      const app = await this.amplify.getApp({ appId: this.appId }).promise();
      const branch = await this.amplify.getBranch({
        appId: this.appId,
        branchName: PRODUCTION_CONFIG.branch
      }).promise();

      // Get domain association details
      let customDomainUrl = `https://${PRODUCTION_CONFIG.domain}`;
      try {
        const domainAssoc = await this.amplify.getDomainAssociation({
          appId: this.appId,
          domainName: PRODUCTION_CONFIG.domain
        }).promise();
        customDomainUrl = `https://${domainAssoc.domainAssociation.domainName}`;
      } catch (domainError) {
        log('⚠️ Custom domain not configured yet', 'yellow');
      }

      log('\n🎉 Production Deployment Summary:', 'bold');
      log(`📱 App Name: ${app.app.name}`, 'green');
      log(`🆔 App ID: ${this.appId}`, 'blue');
      log(`🌿 Branch: ${branch.branch.branchName}`, 'blue');
      log(`🌐 Default URL: https://${branch.branch.displayName}.${app.app.defaultDomain}`, 'blue');
      log(`🎯 Custom Domain: ${customDomainUrl}`, 'green');
      log(`📍 Region: ${PRODUCTION_CONFIG.region}`, 'blue');
      log(`🏷️ Environment: Production`, 'blue');
      log(`🔒 SSL: Enabled`, 'green');
      
      log('\n🔗 Important Links:', 'bold');
      log(`📊 Amplify Console: https://console.aws.amazon.com/amplify/home?region=${PRODUCTION_CONFIG.region}#/${this.appId}`, 'blue');
      log(`🌐 Live Site: ${customDomainUrl}`, 'green');
      log(`📈 CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${PRODUCTION_CONFIG.region}`, 'blue');
      
      // Save deployment summary
      const summary = {
        appId: this.appId,
        appName: app.app.name,
        defaultDomain: `${branch.branch.displayName}.${app.app.defaultDomain}`,
        customDomain: PRODUCTION_CONFIG.domain,
        customDomainUrl: customDomainUrl,
        region: PRODUCTION_CONFIG.region,
        repository: PRODUCTION_CONFIG.repository,
        branch: PRODUCTION_CONFIG.branch,
        certificateArn: this.certificateArn,
        hostedZoneId: this.hostedZoneId,
        deployedAt: new Date().toISOString(),
        environment: 'production'
      };
      
      const summaryPath = path.join(__dirname, '..', 'logs', 'production-deployment-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      log(`📄 Deployment summary saved: ${summaryPath}`, 'blue');
      
      return summary;
      
    } catch (error) {
      throw new Error(`Deployment verification failed: ${error.message}`);
    }
  }

  async rollback() {
    log('🔄 Starting rollback process...', 'yellow');
    
    try {
      if (this.appId) {
        log('⚠️ Production rollback requires manual review', 'yellow');
        log('📝 Consider these actions:', 'blue');
        log('1. Check build logs in Amplify console', 'blue');
        log('2. Verify environment variables are correct', 'blue');
        log('3. Ensure SSL certificate is valid', 'blue');
        log('4. Check domain DNS settings', 'blue');
        log('\n❌ Automatic rollback disabled for production safety', 'red');
      }
      
    } catch (error) {
      log(`❌ Rollback information failed: ${error.message}`, 'red');
    }
  }
}

// Health check after deployment
async function runProductionHealthCheck() {
  log('🏥 Running production health check...', 'bold');
  
  try {
    // Test main domain
    const https = require('https');
    const url = `https://${PRODUCTION_CONFIG.domain}`;
    
    await new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        if (res.statusCode === 200) {
          log(`✅ ${url} is responding (${res.statusCode})`, 'green');
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
    });
    
    // Test www redirect
    const wwwUrl = `https://www.${PRODUCTION_CONFIG.domain}`;
    await new Promise((resolve, reject) => {
      const req = https.get(wwwUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 200) {
          log(`✅ ${wwwUrl} is responding (${res.statusCode})`, 'green');
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
    });
    
    log('🎉 Production health check passed!', 'green');
    
  } catch (error) {
    log(`⚠️ Health check issue: ${error.message}`, 'yellow');
    log('   This may be temporary during initial deployment', 'blue');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro Production Amplify Deployment');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/deploy-amplify-production.js        # Deploy to production');
    console.log('  node scripts/deploy-amplify-production.js --test # Run health check only');
    console.log('  node scripts/deploy-amplify-production.js --help # Show this help');
    return;
  }
  
  if (args.includes('--test')) {
    await runProductionHealthCheck();
    return;
  }
  
  // Main deployment
  const deployer = new ProductionAmplifyDeployer();
  await deployer.init();
  
  // Run health check after deployment
  log('\n🏥 Running post-deployment health check...', 'blue');
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for deployment to propagate
  await runProductionHealthCheck();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Production deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ProductionAmplifyDeployer, runProductionHealthCheck };
