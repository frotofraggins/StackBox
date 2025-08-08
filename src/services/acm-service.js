/**
 * StackBox AWS Certificate Manager (ACM) Service
 * Handles SSL certificate provisioning and management
 */

const { 
  ACMClient, 
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand 
} = require('@aws-sdk/client-acm');

const awsConfig = require('../../config/aws-config.json');
const { logger } = require('../utils/logger');

class ACMService {
  constructor() {
    this.acmClient = new ACMClient({
      region: 'us-east-1', // ACM for CloudFront must be in us-east-1
      profile: awsConfig.aws.profile
    });
  }

  /**
   * Requests wildcard SSL certificate for domain
   * @param {string} domain - Primary domain (e.g., allbusinesstools.com)
   * @returns {Promise<Object>} - Certificate information
   */
  async requestWildcardCertificate(domain) {
    try {
      // Check if certificate already exists
      const existingCert = await this.findExistingCertificate(domain);
      if (existingCert) {
        logger.info(`Using existing wildcard certificate for ${domain}`);
        return existingCert;
      }

      const command = new RequestCertificateCommand({
        DomainName: domain,
        SubjectAlternativeNames: [`*.${domain}`], // Wildcard for subdomains
        ValidationMethod: 'DNS',
        Tags: [
          { Key: 'Project', Value: 'StackBox' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Type', Value: 'Wildcard' }
        ]
      });

      const result = await this.acmClient.send(command);

      logger.info(`Requested wildcard SSL certificate for ${domain}: ${result.CertificateArn}`);
      
      return {
        certificateArn: result.CertificateArn,
        domain: domain,
        wildcardDomain: `*.${domain}`,
        validationMethod: 'DNS',
        status: 'PENDING_VALIDATION',
        validationRecords: await this.getValidationRecords(result.CertificateArn)
      };

    } catch (error) {
      logger.error(`Failed to request SSL certificate for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Finds existing certificate for domain
   * @param {string} domain - Domain to search for
   * @returns {Promise<Object|null>} - Existing certificate or null
   */
  async findExistingCertificate(domain) {
    try {
      const command = new ListCertificatesCommand({
        CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
      });

      const result = await this.acmClient.send(command);
      
      const matchingCert = result.CertificateSummaryList?.find(cert => 
        cert.DomainName === domain || 
        cert.SubjectAlternativeNameSummary?.includes(`*.${domain}`)
      );

      if (matchingCert) {
        const details = await this.getCertificateDetails(matchingCert.CertificateArn);
        return {
          certificateArn: matchingCert.CertificateArn,
          domain: matchingCert.DomainName,
          status: matchingCert.Status,
          ...details
        };
      }

      return null;
    } catch (error) {
      logger.error(`Failed to find existing certificate for ${domain}:`, error);
      return null;
    }
  }

  /**
   * Gets certificate details and validation information
   * @param {string} certificateArn - Certificate ARN
   * @returns {Promise<Object>} - Certificate details
   */
  async getCertificateDetails(certificateArn) {
    try {
      const command = new DescribeCertificateCommand({
        CertificateArn: certificateArn
      });

      const result = await this.acmClient.send(command);
      const cert = result.Certificate;

      return {
        status: cert.Status,
        issuedAt: cert.IssuedAt,
        notBefore: cert.NotBefore,
        notAfter: cert.NotAfter,
        keyAlgorithm: cert.KeyAlgorithm,
        signatureAlgorithm: cert.SignatureAlgorithm,
        domainValidationOptions: cert.DomainValidationOptions,
        inUse: cert.InUseBy?.length > 0
      };

    } catch (error) {
      logger.error(`Failed to get certificate details for ${certificateArn}:`, error);
      throw error;
    }
  }

  /**
   * Gets DNS validation records that need to be created
   * @param {string} certificateArn - Certificate ARN
   * @returns {Promise<Array>} - DNS validation records
   */
  async getValidationRecords(certificateArn) {
    try {
      const details = await this.getCertificateDetails(certificateArn);
      
      return details.domainValidationOptions?.map(option => ({
        domain: option.DomainName,
        validationStatus: option.ValidationStatus,
        dnsRecord: {
          name: option.ResourceRecord?.Name,
          type: option.ResourceRecord?.Type,
          value: option.ResourceRecord?.Value
        }
      })) || [];

    } catch (error) {
      logger.error(`Failed to get validation records for ${certificateArn}:`, error);
      return [];
    }
  }

  /**
   * Creates Route53 DNS validation records automatically
   * @param {string} certificateArn - Certificate ARN
   * @param {Object} route53Service - Route53 service instance
   * @returns {Promise<Object>} - Validation setup result
   */
  async setupDNSValidation(certificateArn, route53Service) {
    try {
      const validationRecords = await this.getValidationRecords(certificateArn);
      const results = [];

      for (const record of validationRecords) {
        if (record.dnsRecord.name && record.dnsRecord.value) {
          try {
            const dnsResult = await route53Service.createValidationRecord(
              record.dnsRecord.name,
              record.dnsRecord.type,
              record.dnsRecord.value
            );
            
            results.push({
              domain: record.domain,
              dnsRecord: record.dnsRecord,
              created: true,
              changeId: dnsResult.changeId
            });

            logger.info(`Created DNS validation record for ${record.domain}`);
          } catch (error) {
            logger.error(`Failed to create DNS validation record for ${record.domain}:`, error);
            results.push({
              domain: record.domain,
              created: false,
              error: error.message
            });
          }
        }
      }

      return {
        certificateArn,
        validationRecords: results,
        allCreated: results.every(r => r.created),
        pendingValidation: results.length > 0
      };

    } catch (error) {
      logger.error(`Failed to setup DNS validation for ${certificateArn}:`, error);
      throw error;
    }
  }

  /**
   * Waits for certificate validation to complete
   * @param {string} certificateArn - Certificate ARN
   * @param {number} maxWaitMinutes - Maximum wait time in minutes
   * @returns {Promise<Object>} - Validation result
   */
  async waitForValidation(certificateArn, maxWaitMinutes = 30) {
    try {
      const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
      let attempts = 0;

      while (attempts < maxAttempts) {
        const details = await this.getCertificateDetails(certificateArn);
        
        if (details.status === 'ISSUED') {
          logger.info(`Certificate validated successfully: ${certificateArn}`);
          return {
            success: true,
            status: 'ISSUED',
            certificateArn,
            validatedAt: new Date().toISOString(),
            totalWaitTime: attempts * 30 // seconds
          };
        } else if (details.status === 'FAILED') {
          throw new Error(`Certificate validation failed: ${certificateArn}`);
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        if (attempts % 4 === 0) { // Log every 2 minutes
          logger.info(`Still waiting for certificate validation... (${Math.round(attempts/2)} minutes)`);
        }
      }

      throw new Error(`Certificate validation timeout after ${maxWaitMinutes} minutes`);

    } catch (error) {
      logger.error(`Certificate validation failed for ${certificateArn}:`, error);
      throw error;
    }
  }

  /**
   * Gets certificate ARN for use with other AWS services
   * @param {string} domain - Domain name
   * @returns {Promise<string>} - Certificate ARN
   */
  async getCertificateArn(domain) {
    try {
      const cert = await this.findExistingCertificate(domain);
      if (cert && cert.status === 'ISSUED') {
        return cert.certificateArn;
      }
      
      throw new Error(`No valid certificate found for domain: ${domain}`);
    } catch (error) {
      logger.error(`Failed to get certificate ARN for ${domain}:`, error);
      throw error;
    }
  }
}

module.exports = { ACMService };
