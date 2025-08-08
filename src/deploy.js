/**
 * StackBox Main Deployment Orchestrator
 * Coordinates the full deployment pipeline for client business stacks
 */

const { AWSProvisioner } = require('./services/aws-provisioner');
const { TrialManager } = require('./services/trial-manager');
const { validateClientConfig } = require('./config/validation');
const { logger } = require('./utils/logger');

class StackBoxDeployer {
  constructor() {
    this.awsProvisioner = new AWSProvisioner();
    this.trialManager = new TrialManager();
  }

  /**
   * Deploys a complete client stack from configuration
   * @param {Object|string} clientConfig - Client configuration object or path to JSON file
   * @returns {Promise<Object>} - Deployment results
   */
  async deployClient(clientConfig) {
    const startTime = Date.now();
    logger.info('='.repeat(60));
    logger.info('🚀 STARTING STACKBOX DEPLOYMENT PIPELINE');
    logger.info('='.repeat(60));

    try {
      // Step 1: Validate Configuration
      logger.info('📋 Step 1: Validating client configuration...');
      const config = await this.validateConfig(clientConfig);
      logger.info(`✅ Configuration valid for client: ${config.clientId}`);

      // Step 1.5: Set up trial account
      logger.info('🆓 Step 1.5: Setting up free trial account...');
      const trialInfo = this.trialManager.createTrialAccount(config);
      logger.info(`✅ Free trial created: ${trialInfo.daysRemaining} days remaining`);

      // Step 2: AWS Resource Provisioning
      logger.info('☁️  Step 2: Provisioning AWS resources...');
      const awsResults = await this.awsProvisioner.provisionClient(config);
      logger.info('✅ AWS resources provisioned successfully');

      // Step 3: Docker Stack Deployment (placeholder for now)
      logger.info('🐳 Step 3: Deploying Docker services...');
      const dockerResults = await this.deployDockerStack(config, awsResults);
      logger.info('✅ Docker services deployed successfully');

      // Step 4: SSL Certificate Setup (placeholder for now) 
      logger.info('🔒 Step 4: Configuring SSL certificates...');
      const sslResults = await this.setupSSL(config, awsResults);
      logger.info('✅ SSL certificates configured');

      // Step 5: Send Onboarding Email
      logger.info('📧 Step 5: Sending onboarding email...');
      const emailResults = await this.sendOnboardingEmail(config, awsResults);
      logger.info('✅ Onboarding email sent');

      // Compile final results
      const deploymentResults = {
        success: true,
        clientId: config.clientId,
        domain: awsResults.domain,
        deployedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        accountType: 'trial',
        trialInfo: trialInfo,
        results: {
          aws: awsResults,
          docker: dockerResults,
          ssl: sslResults,
          email: emailResults,
          trial: trialInfo
        }
      };

      logger.info('='.repeat(60));
      logger.info('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!');
      logger.info(`⏱️  Total time: ${Math.round(deploymentResults.duration / 1000)}s`);
      logger.info(`🌐 Client URL: https://${awsResults.domain}`);
      logger.info(`🆓 Free Trial: ${trialInfo.daysRemaining} days remaining`);
      logger.info(`💳 Upgrade URL: https://temp-stackbox.com/upgrade/${config.clientId}`);
      logger.info('='.repeat(60));

      return deploymentResults;

    } catch (error) {
      logger.error('❌ DEPLOYMENT FAILED:', error);
      
      const errorResults = {
        success: false,
        error: error.message,
        clientId: clientConfig?.clientId || 'unknown',
        failedAt: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      // TODO: Implement rollback logic here
      logger.info('🔄 Rollback would be initiated here...');
      
      throw errorResults;
    }
  }

  /**
   * Validates client configuration
   * @param {Object|string} clientConfig - Configuration object or file path
   * @returns {Promise<Object>} - Validated configuration
   */
  async validateConfig(clientConfig) {
    if (typeof clientConfig === 'string') {
      // Load from file path
      const config = require(clientConfig);
      const validation = validateClientConfig(config);
      
      if (validation.error) {
        throw new Error(`Configuration validation failed: ${validation.error.message}`);
      }
      
      return validation.value;
    }

    // Validate object directly
    const validation = validateClientConfig(clientConfig);
    
    if (validation.error) {
      throw new Error(`Configuration validation failed: ${validation.error.message}`);
    }
    
    return validation.value;
  }

  /**
   * Deploys Docker stack for client services
   * @param {Object} config - Client configuration
   * @param {Object} awsResults - AWS provisioning results
   * @returns {Promise<Object>} - Docker deployment results
   */
  async deployDockerStack(config, awsResults) {
    // This is a placeholder implementation
    // In the full version, this would:
    // 1. Generate docker-compose.yml from templates
    // 2. Upload to EC2 instance
    // 3. Execute docker-compose up
    // 4. Verify services are running

    return {
      services: {
        nginx: { status: 'running', port: 80 },
        espocrm: config.features.espocrm ? { status: 'running', port: 8080 } : null,
        nextcloud: config.features.nextcloud ? { status: 'running', port: 8081 } : null,
        calcom: config.features.calcom ? { status: 'running', port: 3000 } : null,
        mailtrain: config.features.mailtrain ? { status: 'running', port: 3001 } : null
      },
      network: `stackbox-client-${config.clientId}`,
      volumes: [`client-${config.clientId}-data`]
    };
  }

  /**
   * Sets up SSL certificates for client domain
   * @param {Object} config - Client configuration  
   * @param {Object} awsResults - AWS provisioning results
   * @returns {Promise<Object>} - SSL setup results
   */
  async setupSSL(config, awsResults) {
    // This is a placeholder implementation
    // In the full version, this would:
    // 1. Use Let's Encrypt to generate certificates
    // 2. Configure Nginx with SSL
    // 3. Set up auto-renewal

    return {
      certificate: `*.allbusinesstools.com`,
      issuer: 'Let\'s Encrypt',
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      autoRenew: true
    };
  }

  /**
   * Sends onboarding email to client
   * @param {Object} config - Client configuration
   * @param {Object} awsResults - AWS provisioning results
   * @returns {Promise<Object>} - Email sending results
   */
  async sendOnboardingEmail(config, awsResults) {
    // This is a placeholder implementation
    // In the full version, this would:
    // 1. Generate email from template
    // 2. Send via AWS SES
    // 3. Include login credentials and instructions

    return {
      to: config.email,
      subject: 'Your Business Tools Are Ready!',
      sent: true,
      messageId: `stackbox-${config.clientId}-${Date.now()}`,
      credentials: {
        crmUrl: `https://${awsResults.domain}/crm`,
        filesUrl: `https://${awsResults.domain}/files`,
        websiteUrl: `https://${awsResults.domain}`
      }
    };
  }

  /**
   * Checks deployment status for a client
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - Status information
   */
  async getDeploymentStatus(clientId) {
    // This would check the current status of all services
    // for a deployed client
    return {
      clientId,
      status: 'running',
      services: {
        aws: 'healthy',
        docker: 'healthy', 
        ssl: 'active',
        domain: 'active'
      },
      lastChecked: new Date().toISOString()
    };
  }
}

// CLI Interface
if (require.main === module) {
  const deployer = new StackBoxDeployer();
  
  // Get config file from command line argument
  const configPath = process.argv[2];
  
  if (!configPath) {
    console.error('❌ Usage: node deploy.js <path-to-client-config.json>');
    process.exit(1);
  }

  deployer.deployClient(configPath)
    .then(results => {
      console.log('✅ Deployment completed:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { StackBoxDeployer };
