/**
 * AWS Secrets Manager Loader for StackPro
 * Node 22 compatible secret loading with fallback to environment variables
 */

const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

class SecretLoader {
  constructor(region = process.env.AWS_REGION || "us-west-2") {
    this.client = new SecretsManagerClient({ region });
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getSecretJSON(name) {
    // Check cache first
    if (this.cache.has(name)) {
      const cached = this.cache.get(name);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }
    }

    try {
      console.log(`🔐 Loading secret: ${name}`);
      const command = new GetSecretValueCommand({ SecretId: name });
      const response = await this.client.send(command);
      
      const secret = response.SecretString ? JSON.parse(response.SecretString) : {};
      
      // Cache the result
      this.cache.set(name, {
        value: secret,
        timestamp: Date.now()
      });
      
      console.log(`✅ Secret loaded: ${name}`);
      return secret;
      
    } catch (error) {
      console.warn(`⚠️  Failed to load secret ${name}: ${error.message}`);
      console.log(`🔄 Falling back to environment variables for ${name}`);
      return {};
    }
  }

  async getSecret(name) {
    try {
      const command = new GetSecretValueCommand({ SecretId: name });
      const response = await this.client.send(command);
      return response.SecretString || '';
    } catch (error) {
      console.warn(`⚠️  Failed to load secret ${name}: ${error.message}`);
      return null;
    }
  }

  // Helper methods for specific secret types
  async getYelpConfig() {
    const secret = await this.getSecretJSON('stackpro/sandbox/api/yelp');
    return {
      apiKey: secret.api_key || process.env.YELP_API_KEY,
      baseUrl: secret.base_url || 'https://api.yelp.com/v3'
    };
  }

  async getCensusConfig() {
    const secret = await this.getSecretJSON('stackpro/sandbox/api/census');
    return {
      apiKey: secret.api_key || process.env.CENSUS_API_KEY,
      baseUrl: secret.base_url || 'https://api.census.gov/data'
    };
  }

  async getStripeConfig() {
    const secret = await this.getSecretJSON('stackpro/sandbox/stripe/test');
    return {
      publishableKey: secret.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: secret.secret_key || process.env.STRIPE_SECRET_KEY,
      webhookSecret: secret.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET
    };
  }
}

// Singleton instance
const secretLoader = new SecretLoader();

module.exports = { 
  SecretLoader, 
  secretLoader,
  getSecretJSON: (name) => secretLoader.getSecretJSON(name),
  getSecret: (name) => secretLoader.getSecret(name)
};
