/**
 * Email Feature Flags Service (JavaScript version for local dev)
 * Simple feature flag system for email stack capabilities
 */

const emailFlags = {
  /**
   * Check if email stack is enabled for tenant
   */
  isEmailStackEnabled(tenantId) {
    // Enable for demo/test tenants, disable for others by default
    return tenantId?.includes('demo') || tenantId?.includes('test') || false;
  },

  /**
   * Check if email forwarding is enabled for tenant
   */
  isForwardingEnabled(tenantId) {
    // Most basic email feature - enabled for demo tenants
    return tenantId?.includes('demo') || tenantId?.includes('test') || false;
  },

  /**
   * Check if marketing campaigns are enabled for tenant
   */
  isMarketingEnabled(tenantId) {
    // Premium feature - only for specific tenants
    return tenantId?.includes('demo') || false;
  },

  /**
   * Get degraded response when feature is disabled
   */
  getDegradedResponse(feature, tenantId) {
    const responses = {
      stack: {
        error: 'Email stack not available',
        degraded: true,
        message: 'Email features are currently disabled for your account',
        upgrade: 'Contact support to enable email capabilities'
      },
      forwarding: {
        error: 'Email forwarding not available', 
        degraded: true,
        message: 'Email forwarding is not enabled for your account',
        upgrade: 'Upgrade your plan to enable email forwarding'
      },
      marketing: {
        error: 'Marketing campaigns not available',
        degraded: true, 
        message: 'Marketing features require a premium plan',
        upgrade: 'Upgrade to enable marketing campaigns'
      }
    };

    return responses[feature] || {
      error: 'Feature not available',
      degraded: true,
      message: 'This feature is not enabled for your account'
    };
  }
};

module.exports = { emailFlags };
