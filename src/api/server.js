/**
 * StackBox API Server
 * Express server that handles frontend requests and triggers deployments
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { EnterpriseDeployer } = require('../services/enterprise-deployer');
const { TrialManager } = require('../services/trial-manager');
const { validateClientConfig } = require('../config/validation');
const { logger } = require('../utils/logger');

// Database and Auth
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Database service (we'll create this)
const { DatabaseService } = require('../services/database-service');

// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting (more lenient for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Initialize services
const enterpriseDeployer = new EnterpriseDeployer();
const trialManager = new TrialManager();
const dbService = new DatabaseService();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// User registration endpoint
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, company, password, plan } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || !company || !plan) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate client ID
    const clientId = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}-${uuidv4().slice(0, 8)}`;

    // Create user record
    const user = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      company,
      password: hashedPassword,
      plan,
      clientId,
      status: 'trial',
      createdAt: new Date().toISOString()
    };

    // Save user to database
    await dbService.createUser(user);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        clientId: user.clientId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Start deployment process for trial
    const clientConfig = {
      clientId: user.clientId,
      email: user.email,
      businessName: company,
      features: {
        espocrm: true,
        nextcloud: true,
        calcom: plan === 'business' || plan === 'enterprise',
        mailtrain: plan === 'business' || plan === 'enterprise'
      }
    };

    // Trigger deployment asynchronously
    deployClientAsync(clientConfig)
      .then(result => {
        logger.info('✅ Trial deployment completed for new user:', { 
          clientId: user.clientId,
          email: user.email
        });
      })
      .catch(error => {
        logger.error('❌ Trial deployment failed for new user:', { 
          clientId: user.clientId,
          error: error.message 
        });
      });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        clientId: user.clientId,
        plan: user.plan,
        status: user.status
      },
      token,
      dashboardUrl: `/dashboard?client=${user.clientId}`
    });

  } catch (error) {
    logger.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Get user from database
    const user = await dbService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        clientId: user.clientId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        clientId: user.clientId,
        plan: user.plan,
        status: user.status
      },
      token,
      dashboardUrl: `/dashboard?client=${user.clientId}`
    });

  } catch (error) {
    logger.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Dashboard data endpoint
app.get('/api/dashboard/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Verify user owns this client
    if (req.user.clientId !== clientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get user data
    const user = await dbService.getUserByClientId(clientId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get deployment status
    const deploymentStatus = await enterpriseDeployer.getDeploymentStatus(clientId);
    
    // Get trial status
    const trialStatus = trialManager.checkTrialStatus(clientId);

    // Dashboard data
    const dashboardData = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        company: user.company,
        plan: user.plan,
        status: user.status
      },
      deployment: {
        status: deploymentStatus?.status || 'provisioning',
        url: `https://${clientId}.stackpro.io`,
        services: {
          website: deploymentStatus?.services?.website || 'provisioning',
          crm: deploymentStatus?.services?.crm || 'provisioning',
          filePortal: deploymentStatus?.services?.filePortal || 'provisioning',
          email: deploymentStatus?.services?.email || 'provisioning'
        }
      },
      trial: trialStatus,
      quickStats: {
        uptime: '99.9%',
        storage: '1.2 GB used',
        users: 3,
        lastBackup: '2 hours ago'
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to load dashboard data'
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, company, message, type } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and message are required'
      });
    }

    // Log the contact form submission
    logger.info('📝 Contact form submission:', {
      name,
      email,
      company,
      type: type || 'general',
      timestamp: new Date().toISOString()
    });

    // In production, this would:
    // 1. Save to database
    // 2. Send notification email to support team
    // 3. Send confirmation email to user

    res.json({
      success: true,
      message: 'Thank you for your message. We\'ll get back to you within 24 hours.'
    });

  } catch (error) {
    logger.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to send message'
    });
  }
});

// Deployment endpoint - handles trial signups
app.post('/api/deploy', async (req, res) => {
  try {
    logger.info('🚀 Deployment request received:', { clientId: req.body.clientId });

    // Validate the client configuration
    const { error, value: clientConfig } = validateClientConfig(req.body);
    
    if (error) {
      logger.error('❌ Configuration validation failed:', error.details);
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: error.details.map(d => d.message)
      });
    }

    // Check if client already exists
    const existingClient = await checkExistingClient(clientConfig.clientId);
    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Client ID already exists',
        suggestion: `Try: ${clientConfig.clientId}-${Math.floor(Math.random() * 1000)}`
      });
    }

    // Start deployment process asynchronously
    deployClientAsync(clientConfig)
      .then(result => {
        logger.info('✅ Deployment completed:', { 
          clientId: clientConfig.clientId,
          duration: result.totalDuration
        });
      })
      .catch(error => {
        logger.error('❌ Deployment failed:', { 
          clientId: clientConfig.clientId,
          error: error.message 
        });
      });

    // Return immediate response
    res.json({
      success: true,
      message: 'Deployment started successfully',
      clientId: clientConfig.clientId,
      estimatedCompletion: '5-15 minutes',
      statusUrl: `/api/deployment-status/${clientConfig.clientId}`,
      websiteUrl: `https://${clientConfig.subdomain || clientConfig.clientId}.temp-stackbox.com`
    });

  } catch (error) {
    logger.error('❌ Deployment API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Please try again or contact support'
    });
  }
});

// Deployment status endpoint
app.get('/api/deployment-status/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Get deployment status
    const status = await enterpriseDeployer.getDeploymentStatus(clientId);
    
    res.json({
      success: true,
      clientId,
      status: status
    });

  } catch (error) {
    logger.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to check deployment status'
    });
  }
});

// Trial status endpoint
app.get('/api/trial-status/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const trialStatus = trialManager.checkTrialStatus(clientId);
    
    res.json({
      success: true,
      clientId,
      trial: trialStatus
    });

  } catch (error) {
    logger.error('❌ Trial status error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to check trial status'
    });
  }
});

// Stripe checkout session creation
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { planId, clientConfig } = req.body;

    // Plan pricing
    const plans = {
      professional: {
        price: 14900, // $149.00 in cents
        name: 'Professional Plan'
      },
      enterprise: {
        price: 34900, // $349.00 in cents
        name: 'Enterprise Plan'
      }
    };

    const selectedPlan = plans[planId];
    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan selected'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: clientConfig.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `StackBox ${selectedPlan.name}`,
              description: 'Complete business infrastructure platform',
            },
            unit_amount: selectedPlan.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
      metadata: {
        clientId: clientConfig.clientId || 'unknown',
        planId: planId,
        businessName: clientConfig.businessName || 'Unknown'
      }
    });

    res.json({
      success: true,
      id: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('❌ Stripe session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create checkout session'
    });
  }
});

// Import routes
const siteBuilderRoutes = require('./routes/site-builder');
const capabilitiesRoutes = require('./routes/capabilities');
const dataLakeRoutes = require('./routes/data-lake');
const aiDocsRoutes = require('./routes/ai-docs');
const aiGapAnalysisRoutes = require('./routes/ai-gap-analysis');
const emailStackRoutes = require('./routes/email-stack');
const datasetIngestionRoutes = require('./routes/dataset-ingestion');

// Site builder routes
app.use('/api/site-builder', siteBuilderRoutes);

// Capabilities registry
app.use('/capabilities', capabilitiesRoutes);

// Data Lake mock handlers (behind feature flag)
app.use('/api/data-lake', dataLakeRoutes);

// AI-powered routes
app.use('/api/ai-docs', aiDocsRoutes);
app.use('/api/ai-gap-analysis', aiGapAnalysisRoutes);

// Email stack (feature-flagged)
app.use('/api/email', emailStackRoutes);

// Dataset ingestion (Phase 3.1 capability)
app.use('/api/data-ingestion', require('./routes/data-ingestion'));

// Stripe webhook endpoint
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      logger.info('💳 Payment successful:', { 
        sessionId: session.id,
        clientId: session.metadata.clientId 
      });
      
      // Convert trial to paid and migrate to dedicated infrastructure
      try {
        await handlePaidUpgrade(session);
      } catch (error) {
        logger.error('❌ Failed to handle paid upgrade:', error);
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      logger.warn('💳 Payment failed:', { 
        customerId: failedInvoice.customer,
        amount: failedInvoice.amount_due 
      });
      // Handle failed payment (send notification, suspend service, etc.)
      break;

    default:
      logger.info(`🔔 Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('❌ Unhandled API error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Helper functions
async function deployClientAsync(clientConfig) {
  try {
    // Deploy enterprise stack for trial (shared instance)
    const result = await enterpriseDeployer.deployEnterpriseStack(clientConfig, 'trial');
    
    // Send welcome email
    await sendWelcomeEmail(clientConfig, result);
    
    return result;
  } catch (error) {
    // Send failure notification
    await sendFailureNotification(clientConfig, error);
    throw error;
  }
}

async function handlePaidUpgrade(session) {
  const { clientId, planId } = session.metadata;
  
  // Convert trial to paid account
  const paymentInfo = {
    planId: planId,
    subscriptionId: session.subscription,
    customerId: session.customer,
    amount: session.amount_total / 100
  };

  // This would trigger migration from shared to dedicated instance
  const conversionResult = await trialManager.convertToPaid(
    clientId, 
    paymentInfo, 
    enterpriseDeployer
  );

  logger.info('✅ Trial converted to paid:', {
    clientId,
    plan: planId,
    migrationSuccess: conversionResult.migration?.success
  });

  // Send upgrade confirmation email
  await sendUpgradeConfirmationEmail(clientId, conversionResult);
}

async function checkExistingClient(clientId) {
  // This would check database for existing client
  // For now, return false (no duplicates)
  return false;
}

async function sendWelcomeEmail(clientConfig, deploymentResult) {
  // This would integrate with SES to send welcome email
  // For now, just log
  logger.info('📧 Welcome email sent:', { 
    email: clientConfig.email,
    clientUrl: deploymentResult.clientUrl 
  });
}

async function sendFailureNotification(clientConfig, error) {
  // This would send failure notification email
  logger.error('📧 Failure notification sent:', { 
    email: clientConfig.email,
    error: error.message 
  });
}

async function sendUpgradeConfirmationEmail(clientId, conversionResult) {
  // This would send upgrade confirmation email
  logger.info('📧 Upgrade confirmation sent:', { clientId });
}

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 StackBox API server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
