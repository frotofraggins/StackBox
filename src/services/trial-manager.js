/**
 * StackBox Trial Management System
 * Handles free trial periods, expiration, and payment conversion
 */

const { logger } = require('../utils/logger');

class TrialManager {
  constructor() {
    this.trialDuration = 14; // 14 days free trial
    this.gracePeriod = 3; // 3 days grace period after expiration
  }

  /**
   * Creates a new trial account
   * @param {Object} clientConfig - Client configuration
   * @returns {Object} - Trial information
   */
  createTrialAccount(clientConfig) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + this.trialDuration);

    const trialInfo = {
      clientId: clientConfig.clientId,
      accountStatus: 'trial',
      trialStartDate: startDate.toISOString(),
      trialEndDate: endDate.toISOString(),
      daysRemaining: this.trialDuration,
      features: {
        ...clientConfig.features,
        // Limit trial features
        maxSubdomains: 1,
        maxUsers: 3,
        storageLimit: '1GB',
        emailLimit: 100 // emails per month
      },
      upgradeRequired: false,
      paymentStatus: 'pending'
    };

    logger.info(`Created trial account for client: ${clientConfig.clientId}`);
    return trialInfo;
  }

  /**
   * Checks trial status and returns current state
   * @param {string} clientId - Client identifier
   * @returns {Object} - Current trial status
   */
  checkTrialStatus(clientId) {
    // In production, this would query a database
    // For now, we'll simulate the check
    const mockTrialData = {
      clientId,
      accountStatus: 'trial',
      trialStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      daysRemaining: 7,
      upgradeRequired: false
    };

    const now = new Date();
    const endDate = new Date(mockTrialData.trialEndDate);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    const status = {
      ...mockTrialData,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: daysRemaining <= 0,
      isInGracePeriod: daysRemaining <= 0 && daysRemaining > -this.gracePeriod,
      requiresPayment: daysRemaining <= 3, // Show payment prompt 3 days before expiration
      willSuspend: daysRemaining <= -this.gracePeriod
    };

    return status;
  }

  /**
   * Generates payment link for trial conversion
   * @param {Object} trialInfo - Trial account information
   * @returns {Object} - Payment information
   */
  generatePaymentLink(trialInfo) {
    // This would integrate with Stripe in production
    const paymentInfo = {
      clientId: trialInfo.clientId,
      paymentUrl: `https://checkout.stripe.com/pay/trial-upgrade-${trialInfo.clientId}`,
      plans: [
        {
          id: 'basic',
          name: 'Basic Plan',
          price: 29,
          currency: 'USD',
          interval: 'month',
          features: [
            'Professional website',
            'CRM system',
            'File sharing portal', 
            '5 GB storage',
            '500 emails/month',
            '1 custom subdomain'
          ]
        },
        {
          id: 'professional',
          name: 'Professional Plan',
          price: 59,
          currency: 'USD', 
          interval: 'month',
          features: [
            'Everything in Basic',
            'Booking system (Cal.com)',
            'Email marketing',
            '20 GB storage',
            'Unlimited emails',
            '3 custom subdomains',
            'Priority support'
          ]
        }
      ]
    };

    return paymentInfo;
  }

  /**
   * Suspends services for expired trial accounts
   * @param {string} clientId - Client identifier
   * @returns {Object} - Suspension result
   */
  suspendTrialServices(clientId) {
    logger.warn(`Suspending services for expired trial: ${clientId}`);
    
    return {
      clientId,
      action: 'suspended',
      suspendedAt: new Date().toISOString(),
      suspendedServices: [
        'Website access',
        'CRM login',
        'File portal access',
        'Email sending'
      ],
      retainedData: [
        'Configuration backup',
        'Database snapshot',
        'File backup (30 days)'
      ],
      reactivationUrl: `https://temp-stackbox.com/reactivate/${clientId}`,
      dataRetentionDays: 30
    };
  }

  /**
   * Converts trial account to paid account with migration
   * @param {string} clientId - Client identifier
   * @param {Object} paymentInfo - Payment confirmation
   * @param {Object} awsProvisioner - AWS provisioner instance for migration
   * @returns {Promise<Object>} - Conversion result
   */
  async convertToPaid(clientId, paymentInfo, awsProvisioner = null) {
    logger.info(`Converting trial to paid account: ${clientId}`);

    const paidAccount = {
      clientId,
      accountStatus: 'active',
      plan: paymentInfo.planId,
      paymentStatus: 'active',
      subscriptionId: paymentInfo.subscriptionId,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: this.getPaidFeatures(paymentInfo.planId),
      trialGraduatedAt: new Date().toISOString(),
      migrationRequired: true
    };

    // Trigger migration from shared to dedicated instance
    if (awsProvisioner) {
      try {
        logger.info(`Starting migration from shared to dedicated instance for: ${clientId}`);
        const migrationResult = await awsProvisioner.migrateToDecicated(clientId);
        
        paidAccount.migration = {
          success: migrationResult.success,
          completedAt: migrationResult.migratedAt,
          newInstance: migrationResult.newInstance,
          deploymentType: 'dedicated'
        };
        paidAccount.migrationRequired = false;
        
        logger.info(`Migration completed for converted client: ${clientId}`);
      } catch (error) {
        logger.error(`Migration failed for converted client ${clientId}:`, error);
        paidAccount.migration = {
          success: false,
          error: error.message,
          requiresManualIntervention: true
        };
      }
    }

    return paidAccount;
  }

  /**
   * Gets feature set for paid plans
   * @param {string} planId - Plan identifier
   * @returns {Object} - Feature configuration
   */
  getPaidFeatures(planId) {
    const featureSets = {
      basic: {
        deploymentType: 'dedicated',
        instanceType: 't2.micro',
        maxSubdomains: 1,
        maxUsers: 10,
        storageLimit: '8GB',
        emailLimit: 500,
        customDomain: false,
        prioritySupport: false,
        migrationIncluded: true
      },
      professional: {
        deploymentType: 'dedicated',
        instanceType: 't3.small',
        maxSubdomains: 3,
        maxUsers: 50,
        storageLimit: '20GB',
        emailLimit: -1, // unlimited
        customDomain: true,
        prioritySupport: true,
        migrationIncluded: true
      }
    };

    return featureSets[planId] || featureSets.basic;
  }

  /**
   * Checks if client needs migration from shared to dedicated
   * @param {string} clientId - Client identifier
   * @returns {Object} - Migration status
   */
  checkMigrationStatus(clientId) {
    // This would query the database in production
    return {
      clientId,
      currentDeployment: 'shared',
      targetDeployment: 'dedicated',
      migrationRequired: true,
      estimatedDowntime: '5-10 minutes',
      backupRequired: true,
      migrationSteps: [
        'Backup client data from shared instance',
        'Provision dedicated EC2 instance',
        'Restore data to dedicated instance', 
        'Update DNS records',
        'Verify services are running',
        'Clean up shared instance resources'
      ]
    };
  }

  /**
   * Handles trial expiration with grace period
   * @param {string} clientId - Client identifier
   * @returns {Object} - Expiration handling result
   */
  handleTrialExpiration(clientId) {
    const trialStatus = this.checkTrialStatus(clientId);
    
    if (trialStatus.isInGracePeriod) {
      logger.warn(`Client ${clientId} is in grace period: ${Math.abs(trialStatus.daysRemaining)} days overdue`);
      return {
        action: 'grace_period',
        message: 'Trial expired but in grace period',
        daysOverdue: Math.abs(trialStatus.daysRemaining),
        suspensionDate: new Date(Date.now() + (this.gracePeriod - Math.abs(trialStatus.daysRemaining)) * 24 * 60 * 60 * 1000).toISOString()
      };
    } else if (trialStatus.willSuspend) {
      logger.error(`Suspending services for client ${clientId}: grace period exceeded`);
      return this.suspendTrialServices(clientId);
    }
    
    return {
      action: 'no_action',
      message: 'Trial still active'
    };
  }

  /**
   * Sends trial notification emails
   * @param {Object} trialStatus - Current trial status
   * @returns {Object} - Email notification result
   */
  sendTrialNotification(trialStatus) {
    const { clientId, daysRemaining, requiresPayment, isExpired } = trialStatus;

    let emailType = '';
    let subject = '';
    let message = '';

    if (daysRemaining === 7) {
      emailType = 'trial_reminder_7_days';
      subject = 'Your StackBox trial expires in 7 days';
      message = 'Don\'t lose your business tools! Upgrade now to keep everything running.';
    } else if (daysRemaining === 3) {
      emailType = 'trial_reminder_3_days';
      subject = 'Only 3 days left in your StackBox trial';
      message = 'Your trial ends soon. Choose a plan to continue using your business tools.';
    } else if (daysRemaining === 1) {
      emailType = 'trial_final_warning';
      subject = 'Your StackBox trial expires tomorrow!';
      message = 'Last chance! Your trial expires in 24 hours. Upgrade now to avoid interruption.';
    } else if (isExpired) {
      emailType = 'trial_expired';
      subject = 'Your StackBox trial has expired';
      message = 'Your trial has ended. Upgrade now to restore access to your business tools.';
    }

    return {
      clientId,
      emailType,
      subject,
      message,
      sentAt: new Date().toISOString()
    };
  }
}

module.exports = { TrialManager };
