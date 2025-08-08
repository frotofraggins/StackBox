/**
 * StackBox AWS Secrets Manager Service
 * Handles secure storage and rotation of database credentials and API keys
 */

const { 
  SecretsManagerClient, 
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  DescribeSecretCommand,
  ListSecretsCommand,
  PutSecretValueCommand
} = require('@aws-sdk/client-secrets-manager');

const awsConfig = require('../../config/aws-config.json');
const { logger } = require('../utils/logger');

class SecretsManagerService {
  constructor() {
    this.secretsClient = new SecretsManagerClient({
      region: awsConfig.aws.region,
      profile: awsConfig.aws.profile
    });
  }

  /**
   * Stores database credentials securely
   * @param {string} clientId - Client identifier
   * @param {Object} dbCredentials - Database credentials
   * @returns {Promise<Object>} - Secret storage result
   */
  async storeDBCredentials(clientId, dbCredentials) {
    try {
      const secretName = `stackbox/client/${clientId}/database`;
      
      const secretValue = {
        engine: 'mysql',
        host: dbCredentials.endpoint,
        port: dbCredentials.port,
        username: dbCredentials.username,
        password: dbCredentials.password,
        dbname: dbCredentials.databaseName,
        // Additional databases
        databases: dbCredentials.databases || {}
      };

      const command = new CreateSecretCommand({
        Name: secretName,
        Description: `Database credentials for StackBox client: ${clientId}`,
        SecretString: JSON.stringify(secretValue),
        Tags: [
          { Key: 'Client', Value: clientId },
          { Key: 'Project', Value: 'StackBox' },
          { Key: 'Type', Value: 'DatabaseCredentials' },
          { Key: 'Environment', Value: 'Production' }
        ]
      });

      const result = await this.secretsClient.send(command);
      
      logger.info(`Stored database credentials for client: ${clientId}`);
      
      return {
        secretName,
        secretArn: result.ARN,
        versionId: result.VersionId,
        clientId,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      if (error.name === 'ResourceExistsException') {
        // Secret already exists, update it instead
        logger.info(`Database secret exists, updating for client: ${clientId}`);
        return await this.updateDBCredentials(clientId, dbCredentials);
      }
      
      logger.error(`Failed to store database credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Updates existing database credentials
   * @param {string} clientId - Client identifier
   * @param {Object} dbCredentials - Updated database credentials
   * @returns {Promise<Object>} - Update result
   */
  async updateDBCredentials(clientId, dbCredentials) {
    try {
      const secretName = `stackbox/client/${clientId}/database`;
      
      const secretValue = {
        engine: 'mysql',
        host: dbCredentials.endpoint,
        port: dbCredentials.port,
        username: dbCredentials.username,
        password: dbCredentials.password,
        dbname: dbCredentials.databaseName,
        databases: dbCredentials.databases || {},
        lastUpdated: new Date().toISOString()
      };

      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue)
      });

      const result = await this.secretsClient.send(command);
      
      logger.info(`Updated database credentials for client: ${clientId}`);
      
      return {
        secretName,
        secretArn: result.ARN,
        versionId: result.VersionId,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to update database credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Stores API keys and service credentials
   * @param {string} clientId - Client identifier
   * @param {Object} apiCredentials - API keys and service credentials
   * @returns {Promise<Object>} - Secret storage result
   */
  async storeAPICredentials(clientId, apiCredentials) {
    try {
      const secretName = `stackbox/client/${clientId}/api-keys`;
      
      const secretValue = {
        stripe: apiCredentials.stripe || null,
        smtp: apiCredentials.smtp || null,
        storage: apiCredentials.storage || null,
        integrations: apiCredentials.integrations || {},
        createdAt: new Date().toISOString()
      };

      const command = new CreateSecretCommand({
        Name: secretName,
        Description: `API credentials for StackBox client: ${clientId}`,
        SecretString: JSON.stringify(secretValue),
        Tags: [
          { Key: 'Client', Value: clientId },
          { Key: 'Project', Value: 'StackBox' },
          { Key: 'Type', Value: 'APICredentials' }
        ]
      });

      const result = await this.secretsClient.send(command);
      
      logger.info(`Stored API credentials for client: ${clientId}`);
      
      return {
        secretName,
        secretArn: result.ARN,
        versionId: result.VersionId
      };

    } catch (error) {
      if (error.name === 'ResourceExistsException') {
        return await this.updateAPICredentials(clientId, apiCredentials);
      }
      
      logger.error(`Failed to store API credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Updates API credentials
   * @param {string} clientId - Client identifier
   * @param {Object} apiCredentials - Updated API credentials
   * @returns {Promise<Object>} - Update result
   */
  async updateAPICredentials(clientId, apiCredentials) {
    try {
      const secretName = `stackbox/client/${clientId}/api-keys`;
      
      // Get existing credentials first
      const existing = await this.getSecret(secretName);
      const currentCredentials = existing ? JSON.parse(existing.SecretString) : {};
      
      // Merge with new credentials
      const secretValue = {
        ...currentCredentials,
        ...apiCredentials,
        lastUpdated: new Date().toISOString()
      };

      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue)
      });

      const result = await this.secretsClient.send(command);
      
      logger.info(`Updated API credentials for client: ${clientId}`);
      
      return {
        secretName,
        secretArn: result.ARN,
        versionId: result.VersionId
      };

    } catch (error) {
      logger.error(`Failed to update API credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves stored credentials
   * @param {string} secretName - Secret name or ARN
   * @returns {Promise<Object>} - Retrieved secret
   */
  async getSecret(secretName) {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName
      });

      const result = await this.secretsClient.send(command);
      
      return {
        secretName: result.Name,
        secretArn: result.ARN,
        versionId: result.VersionId,
        secretString: result.SecretString,
        createdDate: result.CreatedDate
      };

    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        logger.warn(`Secret not found: ${secretName}`);
        return null;
      }
      
      logger.error(`Failed to get secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Gets database credentials for client
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - Database credentials
   */
  async getDBCredentials(clientId) {
    try {
      const secretName = `stackbox/client/${clientId}/database`;
      const secret = await this.getSecret(secretName);
      
      if (!secret) {
        throw new Error(`Database credentials not found for client: ${clientId}`);
      }

      const credentials = JSON.parse(secret.secretString);
      
      return {
        engine: credentials.engine,
        host: credentials.host,
        port: credentials.port,
        username: credentials.username,
        password: credentials.password,
        database: credentials.dbname,
        databases: credentials.databases,
        connectionString: `mysql://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.dbname}`
      };

    } catch (error) {
      logger.error(`Failed to get database credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Gets API credentials for client
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - API credentials
   */
  async getAPICredentials(clientId) {
    try {
      const secretName = `stackbox/client/${clientId}/api-keys`;
      const secret = await this.getSecret(secretName);
      
      if (!secret) {
        logger.warn(`API credentials not found for client: ${clientId}`);
        return null;
      }

      return JSON.parse(secret.secretString);

    } catch (error) {
      logger.error(`Failed to get API credentials for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Stores SSL certificate private key
   * @param {string} domain - Domain name
   * @param {string} privateKey - SSL private key
   * @returns {Promise<Object>} - Storage result
   */
  async storeSSLPrivateKey(domain, privateKey) {
    try {
      const secretName = `stackbox/ssl/${domain}/private-key`;
      
      const command = new CreateSecretCommand({
        Name: secretName,
        Description: `SSL private key for domain: ${domain}`,
        SecretString: privateKey,
        Tags: [
          { Key: 'Project', Value: 'StackBox' },
          { Key: 'Type', Value: 'SSLPrivateKey' },
          { Key: 'Domain', Value: domain }
        ]
      });

      const result = await this.secretsClient.send(command);
      
      logger.info(`Stored SSL private key for domain: ${domain}`);
      
      return {
        secretName,
        secretArn: result.ARN,
        domain
      };

    } catch (error) {
      logger.error(`Failed to store SSL private key for domain ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Lists all secrets for a client
   * @param {string} clientId - Client identifier
   * @returns {Promise<Array>} - List of client secrets
   */
  async listClientSecrets(clientId) {
    try {
      const command = new ListSecretsCommand({
        Filters: [
          {
            Key: 'tag-key',
            Values: ['Client']
          },
          {
            Key: 'tag-value', 
            Values: [clientId]
          }
        ]
      });

      const result = await this.secretsClient.send(command);
      
      return result.SecretList.map(secret => ({
        name: secret.Name,
        arn: secret.ARN,
        description: secret.Description,
        createdDate: secret.CreatedDate,
        lastChangedDate: secret.LastChangedDate,
        tags: secret.Tags
      }));

    } catch (error) {
      logger.error(`Failed to list secrets for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Rotates database password
   * @param {string} clientId - Client identifier
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - Rotation result
   */
  async rotateDBPassword(clientId, newPassword) {
    try {
      // Get current credentials
      const currentCreds = await this.getDBCredentials(clientId);
      
      // Update with new password
      const updatedCreds = {
        endpoint: currentCreds.host,
        port: currentCreds.port,
        username: currentCreds.username,
        password: newPassword,
        databaseName: currentCreds.database,
        databases: currentCreds.databases
      };

      // Store updated credentials
      const result = await this.updateDBCredentials(clientId, updatedCreds);
      
      logger.info(`Rotated database password for client: ${clientId}`);
      
      return {
        clientId,
        rotatedAt: new Date().toISOString(),
        secretArn: result.secretArn,
        versionId: result.versionId
      };

    } catch (error) {
      logger.error(`Failed to rotate database password for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Generates secure connection strings for applications
   * @param {string} clientId - Client identifier
   * @param {string} service - Service name (espocrm, nextcloud, etc)
   * @returns {Promise<Object>} - Connection configuration
   */
  async getServiceConnectionConfig(clientId, service) {
    try {
      const dbCreds = await this.getDBCredentials(clientId);
      const apiCreds = await this.getAPICredentials(clientId);
      
      const baseConfig = {
        database: {
          host: dbCreds.host,
          port: dbCreds.port,
          username: dbCreds.username,
          password: dbCreds.password,
          database: dbCreds.databases[service] || dbCreds.database
        }
      };

      // Service-specific configurations
      switch (service) {
        case 'espocrm':
          return {
            ...baseConfig,
            siteUrl: `https://${clientId}.${awsConfig.domain.primary}/crm`,
            smtpSettings: apiCreds?.smtp || null
          };
          
        case 'nextcloud':
          return {
            ...baseConfig,
            dataDirectory: '/var/www/html/data',
            trustedDomains: [`${clientId}.${awsConfig.domain.primary}`]
          };
          
        default:
          return baseConfig;
      }

    } catch (error) {
      logger.error(`Failed to get connection config for ${service}, client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Cleans up secrets when client account is deleted
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupClientSecrets(clientId) {
    try {
      const clientSecrets = await this.listClientSecrets(clientId);
      const deletionResults = [];

      for (const secret of clientSecrets) {
        try {
          const command = new DeleteSecretCommand({
            SecretId: secret.arn,
            RecoveryWindowInDays: 30 // 30-day recovery window
          });

          await this.secretsClient.send(command);
          
          deletionResults.push({
            secretName: secret.name,
            status: 'scheduled_for_deletion',
            recoveryWindowDays: 30
          });

          logger.info(`Scheduled secret for deletion: ${secret.name}`);
        } catch (error) {
          logger.error(`Failed to delete secret ${secret.name}:`, error);
          deletionResults.push({
            secretName: secret.name,
            status: 'deletion_failed',
            error: error.message
          });
        }
      }

      return {
        clientId,
        secretsProcessed: clientSecrets.length,
        deletionResults,
        cleanupAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to cleanup secrets for client ${clientId}:`, error);
      throw error;
    }
  }
}

module.exports = { SecretsManagerService };
