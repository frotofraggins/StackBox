/**
 * StackBox AWS Provisioner
 * Handles EC2, S3, Route53, and SES resource provisioning for client deployments
 */

const { 
  EC2Client, 
  RunInstancesCommand,
  DescribeInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand 
} = require('@aws-sdk/client-ec2');

const { 
  S3Client, 
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketVersioningCommand 
} = require('@aws-sdk/client-s3');

const { 
  Route53Client, 
  CreateHostedZoneCommand,
  ChangeResourceRecordSetsCommand,
  ListHostedZonesByNameCommand 
} = require('@aws-sdk/client-route-53');

const { 
  SESv2Client, 
  CreateEmailIdentityCommand,
  PutEmailIdentityDkimAttributesCommand,
  SendEmailCommand 
} = require('@aws-sdk/client-sesv2');

const awsConfig = require('../../config/aws-config.json');
const { logger } = require('../utils/logger');

class AWSProvisioner {
  constructor() {
    const clientConfig = {
      region: awsConfig.aws.region,
      profile: awsConfig.aws.profile
    };

    this.ec2Client = new EC2Client(clientConfig);
    this.s3Client = new S3Client(clientConfig);
    this.route53Client = new Route53Client(clientConfig);
    this.sesClient = new SESv2Client({ ...clientConfig, region: awsConfig.ses.region });
  }

  /**
   * Provisions all AWS resources for a client
   * @param {Object} clientConfig - Client configuration object
   * @returns {Promise<Object>} - Provisioning results
   */
  async provisionClient(clientConfig) {
    try {
      logger.info(`Starting AWS provisioning for client: ${clientConfig.clientId}`);

      const results = {
        clientId: clientConfig.clientId,
        domain: `${clientConfig.clientId}.${awsConfig.domain.primary}`,
        resources: {}
      };

      // 1. Ensure hosted zone exists for primary domain
      results.resources.hostedZone = await this.ensureHostedZone();

      // 2. Create S3 bucket for client data
      results.resources.s3Bucket = await this.createS3Bucket(clientConfig.clientId);

      // 3. Provision or assign EC2 instance
      results.resources.ec2Instance = await this.provisionEC2Instance(clientConfig);

      // 4. Create DNS record for client subdomain
      results.resources.dnsRecord = await this.createDNSRecord(
        clientConfig.clientId,
        results.resources.ec2Instance.publicIp
      );

      // 5. Set up SES for client email
      results.resources.sesConfig = await this.configureSES(clientConfig);

      logger.info(`AWS provisioning completed for client: ${clientConfig.clientId}`);
      return results;

    } catch (error) {
      logger.error(`AWS provisioning failed for client ${clientConfig.clientId}:`, error);
      throw error;
    }
  }

  /**
   * Ensures the primary domain hosted zone exists
   * @returns {Promise<Object>} - Hosted zone information
   */
  async ensureHostedZone() {
    try {
      // Check if hosted zone already exists
      const listCommand = new ListHostedZonesByNameCommand({
        DNSName: awsConfig.domain.primary
      });
      
      const listResult = await this.route53Client.send(listCommand);
      
      if (listResult.HostedZones && listResult.HostedZones.length > 0) {
        const existingZone = listResult.HostedZones.find(
          zone => zone.Name === `${awsConfig.domain.primary}.`
        );
        
        if (existingZone) {
          logger.info(`Using existing hosted zone: ${existingZone.Id}`);
          return {
            id: existingZone.Id,
            name: existingZone.Name,
            nameServers: existingZone.Config?.Comment || 'Existing zone'
          };
        }
      }

      // Create new hosted zone if it doesn't exist
      const createCommand = new CreateHostedZoneCommand({
        Name: awsConfig.domain.primary,
        CallerReference: `stackbox-${Date.now()}`
      });

      const result = await this.route53Client.send(createCommand);
      
      logger.info(`Created hosted zone: ${result.HostedZone.Id}`);
      return {
        id: result.HostedZone.Id,
        name: result.HostedZone.Name,
        nameServers: result.DelegationSet?.NameServers || []
      };

    } catch (error) {
      logger.error('Failed to ensure hosted zone:', error);
      throw error;
    }
  }

  /**
   * Creates S3 bucket for client data storage
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - S3 bucket information
   */
  async createS3Bucket(clientId) {
    try {
      const bucketName = awsConfig.s3.bucketPattern
        .replace('{prefix}', awsConfig.s3.bucketPrefix)
        .replace('{clientId}', clientId)
        .replace('{suffix}', awsConfig.s3.bucketSuffix);

      const createCommand = new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: awsConfig.aws.region
        }
      });

      await this.s3Client.send(createCommand);

      // Enable versioning
      const versioningCommand = new PutBucketVersioningCommand({
        Bucket: bucketName,
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });

      await this.s3Client.send(versioningCommand);

      // Set bucket policy for client access
      await this.setBucketPolicy(bucketName, clientId);

      logger.info(`Created S3 bucket: ${bucketName}`);
      return {
        bucketName,
        region: awsConfig.aws.region,
        url: `https://${bucketName}.s3.${awsConfig.aws.region}.amazonaws.com`
      };

    } catch (error) {
      logger.error(`Failed to create S3 bucket for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Sets S3 bucket policy for client access
   * @param {string} bucketName - Bucket name
   * @param {string} clientId - Client identifier
   */
  async setBucketPolicy(bucketName, clientId) {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ClientAccess',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${await this.getAccountId()}:root`
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject'
          ],
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };

    const policyCommand = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    });

    await this.s3Client.send(policyCommand);
  }

  /**
   * Provisions or assigns EC2 instance for client
   * @param {Object} clientConfig - Client configuration
   * @param {string} accountType - 'trial' or 'paid'
   * @returns {Promise<Object>} - EC2 instance information
   */
  async provisionEC2Instance(clientConfig, accountType = 'trial') {
    try {
      if (accountType === 'trial') {
        // Trial users go to shared instance
        return await this.assignSharedInstance(clientConfig);
      } else {
        // Paid users get dedicated instance
        return await this.createDedicatedInstance(clientConfig);
      }
    } catch (error) {
      logger.error(`Failed to provision EC2 instance for client ${clientConfig.clientId}:`, error);
      throw error;
    }
  }

  /**
   * Assigns client to shared trial instance
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<Object>} - Shared instance information
   */
  async assignSharedInstance(clientConfig) {
    try {
      // Look for existing shared instance with capacity
      const sharedInstance = await this.findAvailableSharedInstance();
      
      if (sharedInstance) {
        logger.info(`Assigned client ${clientConfig.clientId} to existing shared instance: ${sharedInstance.instanceId}`);
        return {
          ...sharedInstance,
          deploymentType: 'shared',
          maxClients: awsConfig.resources.shared.maxClientsPerInstance,
          containerPath: `/opt/stackbox/trial-clients/${clientConfig.clientId}`
        };
      } else {
        // Create new shared instance
        return await this.createSharedInstance(clientConfig);
      }
    } catch (error) {
      logger.error(`Failed to assign shared instance for client ${clientConfig.clientId}:`, error);
      throw error;
    }
  }

  /**
   * Finds available shared instance with capacity
   * @returns {Promise<Object|null>} - Available instance or null
   */
  async findAvailableSharedInstance() {
    try {
      const describeCommand = new DescribeInstancesCommand({
        Filters: [
          { Name: 'tag:Name', Values: [awsConfig.resources.shared.instanceTag] },
          { Name: 'instance-state-name', Values: ['running'] },
          { Name: 'tag:ClientCount', Values: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] } // Less than 10
        ]
      });

      const result = await this.ec2Client.send(describeCommand);
      
      if (result.Reservations && result.Reservations.length > 0) {
        const instance = result.Reservations[0].Instances[0];
        return {
          instanceId: instance.InstanceId,
          publicIp: instance.PublicIpAddress,
          privateIp: instance.PrivateIpAddress,
          state: instance.State.Name,
          instanceType: instance.InstanceType
        };
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to find available shared instance:', error);
      return null;
    }
  }

  /**
   * Creates new shared instance for trial clients
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<Object>} - New shared instance information
   */
  async createSharedInstance(clientConfig) {
    const userData = this.generateSharedUserData();
    
    const runCommand = new RunInstancesCommand({
      ImageId: awsConfig.resources.amiId,
      InstanceType: awsConfig.resources.sharedInstanceType,
      MinCount: 1,
      MaxCount: 1,
      KeyName: awsConfig.resources.keyPairName,
      SecurityGroupIds: [awsConfig.resources.securityGroups.web],
      UserData: Buffer.from(userData).toString('base64'),
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: awsConfig.resources.shared.instanceTag },
            { Key: 'Type', Value: 'SharedTrial' },
            { Key: 'Project', Value: 'StackBox' },
            { Key: 'ClientCount', Value: '1' },
            { Key: 'MaxClients', Value: awsConfig.resources.shared.maxClientsPerInstance.toString() }
          ]
        }
      ]
    });

    const result = await this.ec2Client.send(runCommand);
    const instanceId = result.Instances[0].InstanceId;

    // Wait for instance to be running
    const instanceInfo = await this.waitForInstance(instanceId);

    logger.info(`Created new shared trial instance: ${instanceId} for client ${clientConfig.clientId}`);
    return {
      ...instanceInfo,
      deploymentType: 'shared',
      maxClients: awsConfig.resources.shared.maxClientsPerInstance,
      containerPath: `/opt/stackbox/trial-clients/${clientConfig.clientId}`
    };
  }

  /**
   * Creates dedicated instance for paid client
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<Object>} - Dedicated instance information
   */
  async createDedicatedInstance(clientConfig) {
    const userData = this.generateDedicatedUserData(clientConfig);
    
    const runCommand = new RunInstancesCommand({
      ImageId: awsConfig.resources.amiId,
      InstanceType: awsConfig.resources.dedicatedInstanceType,
      MinCount: 1,
      MaxCount: 1,
      KeyName: awsConfig.resources.keyPairName,
      SecurityGroupIds: [awsConfig.resources.securityGroups.web],
      UserData: Buffer.from(userData).toString('base64'),
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: `${awsConfig.resources.dedicated.instanceTag}-${clientConfig.clientId}` },
            { Key: 'Client', Value: clientConfig.clientId },
            { Key: 'Type', Value: 'Dedicated' },
            { Key: 'Project', Value: 'StackBox' }
          ]
        }
      ]
    });

    const result = await this.ec2Client.send(runCommand);
    const instanceId = result.Instances[0].InstanceId;

    // Wait for instance to be running
    const instanceInfo = await this.waitForInstance(instanceId);

    logger.info(`Created dedicated instance: ${instanceId} for client ${clientConfig.clientId}`);
    return {
      ...instanceInfo,
      deploymentType: 'dedicated',
      containerPath: `/opt/stackbox/clients/${clientConfig.clientId}`
    };
  }

  /**
   * Migrates client from shared to dedicated instance
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} - Migration result
   */
  async migrateToDecicated(clientId) {
    logger.info(`Starting migration from shared to dedicated for client: ${clientId}`);
    
    try {
      // 1. Create backup of client data from shared instance
      const backupResult = await this.backupClientData(clientId, 'shared');
      
      // 2. Create new dedicated instance
      const clientConfig = await this.getClientConfig(clientId);
      const dedicatedInstance = await this.createDedicatedInstance(clientConfig);
      
      // 3. Restore client data to dedicated instance
      await this.restoreClientData(clientId, backupResult, dedicatedInstance);
      
      // 4. Update DNS to point to new instance
      await this.updateDNSRecord(clientId, dedicatedInstance.publicIp);
      
      // 5. Clean up from shared instance
      await this.cleanupSharedInstance(clientId);
      
      logger.info(`Migration completed for client: ${clientId}`);
      return {
        success: true,
        clientId,
        oldDeployment: 'shared',
        newDeployment: 'dedicated',
        newInstance: dedicatedInstance,
        migratedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error(`Migration failed for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Generates user data for shared trial instance
   * @returns {string} - User data script
   */
  generateSharedUserData() {
    return `#!/bin/bash
# StackBox Shared Trial Instance Initialization
yum update -y
yum install -y docker docker-compose git nginx

# Start services
systemctl start docker nginx
systemctl enable docker nginx
usermod -a -G docker ec2-user

# Create directory structure for trial clients
mkdir -p /opt/stackbox/trial-clients
mkdir -p /opt/stackbox/shared-data
mkdir -p /opt/stackbox/templates

# Set permissions
chown -R ec2-user:ec2-user /opt/stackbox
chmod -R 755 /opt/stackbox

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "StackBox shared trial instance initialized" > /var/log/stackbox-shared-init.log
`;
  }

  /**
   * Generates user data for dedicated instance
   * @param {Object} clientConfig - Client configuration
   * @returns {string} - User data script
   */
  generateDedicatedUserData(clientConfig) {
    return `#!/bin/bash
# StackBox Dedicated Instance Initialization for ${clientConfig.clientId}
yum update -y
yum install -y docker docker-compose git nginx

# Start services
systemctl start docker nginx
systemctl enable docker nginx
usermod -a -G docker ec2-user

# Create directory for client
mkdir -p /opt/stackbox/clients/${clientConfig.clientId}
cd /opt/stackbox/clients/${clientConfig.clientId}

# Set permissions
chown -R ec2-user:ec2-user /opt/stackbox
chmod -R 755 /opt/stackbox

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "StackBox dedicated instance initialized for: ${clientConfig.clientId}" > /var/log/stackbox-dedicated-init.log
`;
  }

  /**
   * Generates user data script for EC2 instance initialization
   * @param {Object} clientConfig - Client configuration
   * @returns {string} - User data script
   */
  generateUserData(clientConfig) {
    return `#!/bin/bash
# StackBox Client Instance Initialization
yum update -y
yum install -y docker docker-compose git

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Install Nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create directory for client
mkdir -p /opt/stackbox/clients/${clientConfig.clientId}
cd /opt/stackbox/clients/${clientConfig.clientId}

# Download docker-compose configuration
# This will be populated by the deployment orchestrator

# Log initialization complete
echo "StackBox initialization complete for client: ${clientConfig.clientId}" > /var/log/stackbox-init.log
`;
  }

  /**
   * Waits for EC2 instance to be running and returns instance info
   * @param {string} instanceId - Instance ID
   * @returns {Promise<Object>} - Instance information
   */
  async waitForInstance(instanceId) {
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes maximum wait

    while (attempts < maxAttempts) {
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });

      const result = await this.ec2Client.send(describeCommand);
      const instance = result.Reservations[0].Instances[0];

      if (instance.State.Name === 'running' && instance.PublicIpAddress) {
        return {
          instanceId: instance.InstanceId,
          publicIp: instance.PublicIpAddress,
          privateIp: instance.PrivateIpAddress,
          state: instance.State.Name,
          instanceType: instance.InstanceType
        };
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    throw new Error(`Instance ${instanceId} did not start within expected time`);
  }

  /**
   * Creates DNS record for client subdomain
   * @param {string} clientId - Client identifier
   * @param {string} ipAddress - IP address to point to
   * @returns {Promise<Object>} - DNS record information
   */
  async createDNSRecord(clientId, ipAddress) {
    try {
      const subdomain = `${clientId}.${awsConfig.domain.primary}`;
      
      // Get hosted zone ID (assuming it exists from ensureHostedZone)
      const hostedZoneId = await this.getHostedZoneId();

      const changeCommand = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: subdomain,
                Type: 'A',
                TTL: awsConfig.route53.ttl,
                ResourceRecords: [
                  { Value: ipAddress }
                ]
              }
            }
          ]
        }
      });

      const result = await this.route53Client.send(changeCommand);

      logger.info(`Created DNS record: ${subdomain} -> ${ipAddress}`);
      return {
        subdomain,
        ipAddress,
        changeId: result.ChangeInfo.Id,
        status: result.ChangeInfo.Status
      };

    } catch (error) {
      logger.error(`Failed to create DNS record for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Configures SES for client email sending
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<Object>} - SES configuration
   */
  async configureSES(clientConfig) {
    try {
      // Verify the primary domain for SES (one-time setup)
      const identityCommand = new CreateEmailIdentityCommand({
        EmailIdentity: awsConfig.domain.primary
      });

      try {
        await this.sesClient.send(identityCommand);
        logger.info(`Verified SES identity: ${awsConfig.domain.primary}`);
      } catch (error) {
        // Identity might already exist, which is fine
        if (!error.message.includes('Already exists')) {
          throw error;
        }
      }

      return {
        fromEmail: awsConfig.ses.fromEmail,
        replyToEmail: awsConfig.ses.replyToEmail,
        region: awsConfig.ses.region,
        verified: true
      };

    } catch (error) {
      logger.error(`Failed to configure SES for client ${clientConfig.clientId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to get AWS account ID
   * @returns {Promise<string>} - Account ID
   */
  async getAccountId() {
    // This is a simplified implementation
    // In production, you'd use STS to get the account ID
    return '123456789012'; // Placeholder
  }

  /**
   * Helper method to get hosted zone ID
   * @returns {Promise<string>} - Hosted zone ID
   */
  async getHostedZoneId() {
    const listCommand = new ListHostedZonesByNameCommand({
      DNSName: awsConfig.domain.primary
    });
    
    const result = await this.route53Client.send(listCommand);
    const zone = result.HostedZones.find(zone => zone.Name === `${awsConfig.domain.primary}.`);
    
    if (!zone) {
      throw new Error(`Hosted zone not found for ${awsConfig.domain.primary}`);
    }
    
    return zone.Id.split('/').pop(); // Remove the '/hostedzone/' prefix
  }
}

module.exports = { AWSProvisioner };
