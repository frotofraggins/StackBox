const express = require('express');
const { emailFlags } = require('../../utils/email-flags');
const router = express.Router();

/**
 * Email Stack API Routes (Mock Mode - Phase A)
 * Returns DNS records and provides graceful degradation
 */

/**
 * POST /email/domains/request-setup
 * Request domain setup and get DNS records to configure
 */
router.post('/domains/request-setup', async (req, res) => {
  try {
    const { tenantId, domain, mode, addresses, forwardTo } = req.body;

    // Validate required fields
    if (!tenantId || !domain || !mode || !addresses) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, domain, mode, addresses',
        degraded: false
      });
    }

    // Check if email stack is enabled
    if (!emailFlags.isEmailStackEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('stack', tenantId)
      );
    }

    // Generate setup ID
    const setupId = `setup_${tenantId}_${Date.now()}`;

    // Generate DNS records for verification
    const dnsRecords = generateDNSRecords(domain, mode);

    // Mock response - in production this would:
    // 1. Create SES identity
    // 2. Generate real DKIM tokens
    // 3. Store setup in database
    // 4. Return actual verification tokens

    const response = {
      setupId,
      domain,
      status: 'pending-dns',
      dnsRecords,
      nextSteps: [
        `Add the ${dnsRecords.length} DNS records below to your ${mode === 'delegated-subdomain' ? 'parent domain' : 'domain'} DNS`,
        'Wait 5-15 minutes for DNS propagation',
        `Check verification status: GET /email/domains/${domain}`,
        'Create email addresses once domain is verified',
        'Test email forwarding before going live'
      ],
      estimatedTime: '5-15 minutes after DNS propagation',
      degraded: false
    };

    console.log(`📧 Email domain setup requested:`, {
      tenantId,
      domain,
      mode,
      addresses: addresses.length,
      setupId
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Email domain setup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      degraded: true,
      fallbackGuidance: 'Please try again or configure DNS manually'
    });
  }
});

/**
 * GET /email/domains/:domain
 * Get domain verification status
 */
router.get('/domains/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    if (!emailFlags.isEmailStackEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('stack', tenantId)
      );
    }

    // Mock verification status - in production would check SES
    const mockVerified = domain.includes('stackpro.io') || domain.includes('demo');
    
    const response = {
      domain,
      verified: mockVerified,
      dkimEnabled: mockVerified,
      dkimTokens: mockVerified ? [
        'abc123def456ghi789',
        'jkl012mno345pqr678',
        'stu901vwx234yzab567'
      ] : [],
      spfRecord: 'v=spf1 include:amazonses.com ~all',
      dmarcRecord: `v=DMARC1; p=quarantine; rua=mailto:admin@${domain}`,
      addresses: mockVerified ? getMockAddresses(domain, tenantId) : [],
      lastChecked: new Date().toISOString(),
      degraded: false
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Domain status error:', error);
    res.status(500).json({
      error: 'Unable to check domain status',
      degraded: true,
      fallbackGuidance: 'Check DNS configuration manually'
    });
  }
});

/**
 * POST /email/addresses
 * Create email address route
 */
router.post('/addresses', async (req, res) => {
  try {
    const { tenantId, domain, address, type, forwardTo, displayName } = req.body;

    if (!tenantId || !domain || !address || !type) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, domain, address, type',
        degraded: false
      });
    }

    if (!emailFlags.isForwardingEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('forwarding', tenantId)
      );
    }

    // Mock address creation - in production would create SES receipt rule
    const emailAddress = {
      id: `addr_${address}_${tenantId}_${Date.now()}`,
      tenantId,
      address,
      domain,
      fullAddress: `${address}@${domain}`,
      type,
      forwardTo: forwardTo || null,
      displayName: displayName || `${address}@${domain}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };

    console.log(`📧 Email address created:`, {
      tenantId,
      fullAddress: emailAddress.fullAddress,
      type,
      forwardTo
    });

    res.status(201).json(emailAddress);

  } catch (error) {
    console.error('❌ Email address creation error:', error);
    res.status(500).json({
      error: 'Failed to create email address',
      degraded: true,
      fallbackGuidance: 'Configure email forwarding manually'
    });
  }
});

/**
 * POST /email/campaigns
 * Create marketing campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const { tenantId, subject, html, text, fromAddress, fromName, listId, tags } = req.body;

    if (!tenantId || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, subject, html',
        degraded: false
      });
    }

    if (!emailFlags.isMarketingEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('marketing', tenantId)
      );
    }

    // Mock campaign creation
    const campaign = {
      id: `camp_${tenantId}_${Date.now()}`,
      tenantId,
      subject,
      status: 'draft',
      fromAddress: fromAddress || `info@${tenantId}.stackpro.io`,
      fromName: fromName || 'StackPro Team',
      recipientCount: 0,
      createdAt: new Date().toISOString(),
      scheduledAt: null,
      sentAt: null
    };

    console.log(`📧 Campaign created:`, {
      tenantId,
      campaignId: campaign.id,
      subject,
      status: campaign.status
    });

    res.status(201).json(campaign);

  } catch (error) {
    console.error('❌ Campaign creation error:', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      degraded: true,
      fallbackGuidance: 'Use external email marketing service'
    });
  }
});

/**
 * GET /email/campaigns/:campaignId/metrics
 * Get campaign analytics
 */
router.get('/campaigns/:campaignId/metrics', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const tenantId = req.headers['x-tenant-id'];

    if (!emailFlags.isMarketingEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('marketing', tenantId)
      );
    }

    // Mock metrics - in production would query S3/CloudWatch
    const mockMetrics = {
      campaignId,
      sent: 1250,
      delivered: 1200,
      opens: 480,
      uniqueOpens: 320,
      clicks: 85,
      uniqueClicks: 62,
      bounces: 15,
      complaints: 2,
      unsubscribes: 8,
      openRate: 0.267,
      clickRate: 0.052,
      lastUpdated: new Date().toISOString()
    };

    res.json(mockMetrics);

  } catch (error) {
    console.error('❌ Campaign metrics error:', error);
    res.status(500).json({
      error: 'Unable to retrieve campaign metrics',
      degraded: true,
      fallbackGuidance: 'Check campaign performance manually'
    });
  }
});

/**
 * POST /email/identity/test
 * Test email identity and forwarding
 */
router.post('/identity/test', async (req, res) => {
  try {
    const { tenantId, domain, testType = 'full' } = req.body;

    if (!tenantId || !domain) {
      return res.status(400).json({
        error: 'Missing required fields: tenantId, domain',
        degraded: false
      });
    }

    if (!emailFlags.isForwardingEnabled(tenantId)) {
      return res.status(503).json(
        emailFlags.getDegradedResponse('forwarding', tenantId)
      );
    }

    // Mock test - in production would send actual test email
    const testId = `test_${tenantId}_${Date.now()}`;
    const mockSuccess = domain.includes('stackpro.io') || tenantId.includes('demo');

    const response = {
      testId,
      status: mockSuccess ? 'sent' : 'failed',
      message: mockSuccess 
        ? `Test email sent successfully for ${testType} test`
        : 'Domain not verified - test email failed',
      degraded: false
    };

    console.log(`📧 Email test initiated:`, {
      tenantId,
      domain,
      testType,
      testId,
      status: response.status
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      error: 'Test email failed',
      degraded: true,
      fallbackGuidance: 'Verify domain and forwarding configuration manually'
    });
  }
});

/**
 * Helper: Generate DNS records for domain setup
 */
function generateDNSRecords(domain, mode) {
  const records = [
    {
      name: `_amazonses.${domain}`,
      type: 'TXT',
      value: 'MOCK_VERIFICATION_TOKEN_12345',
      ttl: 300,
      description: 'SES domain verification record'
    },
    {
      name: domain,
      type: 'TXT', 
      value: 'v=spf1 include:amazonses.com ~all',
      ttl: 300,
      description: 'SPF record for email authentication'
    },
    {
      name: `_dmarc.${domain}`,
      type: 'TXT',
      value: `v=DMARC1; p=quarantine; rua=mailto:admin@${domain}`,
      ttl: 300,
      description: 'DMARC policy record'
    }
  ];

  // Add DKIM records (mock tokens)
  const dkimTokens = ['abc123def456', 'ghi789jkl012', 'mno345pqr678'];
  dkimTokens.forEach((token, index) => {
    records.push({
      name: `${token}._domainkey.${domain}`,
      type: 'CNAME',
      value: `${token}.dkim.amazonses.com`,
      ttl: 300,
      description: `DKIM signing record ${index + 1}/3`
    });
  });

  // Add MX record for receiving (if full zone mode)
  if (mode === 'full-zone') {
    records.push({
      name: domain,
      type: 'MX',
      value: '10 inbound-smtp.us-west-2.amazonaws.com',
      ttl: 300,
      priority: 10,
      description: 'MX record for email receiving'
    });
  }

  // Add NS records for subdomain delegation
  if (mode === 'delegated-subdomain') {
    const nsRecords = [
      'ns-123.awsdns-12.com',
      'ns-456.awsdns-34.net', 
      'ns-789.awsdns-56.org',
      'ns-012.awsdns-78.co.uk'
    ];
    
    nsRecords.forEach(ns => {
      records.push({
        name: domain,
        type: 'NS',
        value: ns,
        ttl: 300,
        description: 'NS record for subdomain delegation'
      });
    });
  }

  return records;
}

/**
 * Helper: Get mock email addresses for verified domain
 */
function getMockAddresses(domain, tenantId) {
  const defaultAddresses = ['admin', 'info', 'support', 'noreply'];
  
  return defaultAddresses.map(address => ({
    id: `addr_${address}_${tenantId}`,
    tenantId,
    address,
    domain,
    fullAddress: `${address}@${domain}`,
    type: address === 'noreply' ? 'no-reply' : 'forwarding',
    forwardTo: address === 'noreply' ? null : `owner@${tenantId}.com`,
    displayName: `${address.charAt(0).toUpperCase() + address.slice(1)} Team`,
    enabled: true,
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null
  }));
}

module.exports = router;
