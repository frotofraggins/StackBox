/**
 * StackPro API Server - Simplified Version for Testing
 * Express server with authentication endpoints only
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateClientConfig } = require('../config/validation');
const { logger } = require('../utils/logger');

// Database and Auth
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Services
const { DatabaseService } = require('../services/database-service');
const { StripeService } = require('../services/stripe-service');

// Stripe configuration  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
const dbService = new DatabaseService();
const stripeService = new StripeService();

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

    // Log successful signup
    logger.info('✅ New user signed up:', { 
      clientId: user.clientId,
      email: user.email,
      plan: user.plan
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully - Infrastructure provisioning started!',
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

    logger.info('✅ User logged in:', { 
      clientId: user.clientId,
      email: user.email
    });

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

    // Mock deployment status and trial status
    const mockDeploymentStatus = {
      status: 'running',
      services: {
        website: 'running',
        crm: 'running', 
        filePortal: 'running',
        email: 'running'
      }
    };

    const mockTrialStatus = {
      accountStatus: user.status,
      daysRemaining: user.status === 'trial' ? 7 : 0,
      isExpired: false,
      requiresPayment: user.status === 'trial'
    };

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
        status: mockDeploymentStatus.status,
        url: `https://${clientId}.stackpro.io`,
        services: mockDeploymentStatus.services
      },
      trial: mockTrialStatus,
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

// Basic deployment status endpoint (mock)
app.get('/api/deployment-status/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    res.json({
      success: true,
      clientId,
      status: {
        overall: 'running',
        website: 'running',
        crm: 'running',
        filePortal: 'running',
        email: 'running',
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to check deployment status'
    });
  }
});

// ====================================================================
// STRIPE PAYMENT ENDPOINTS
// ====================================================================

// Create Stripe customer
app.post('/api/stripe/create-customer', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const customerData = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      phone: req.body.phone,
      address: req.body.address
    };

    const stripeCustomer = await stripeService.createCustomer(customerData);
    
    // Update user with Stripe customer ID
    await dbService.updateUser(user.id, { stripeCustomerId: stripeCustomer.id });

    res.json({
      success: true,
      customer: {
        id: stripeCustomer.id,
        email: stripeCustomer.email,
        name: stripeCustomer.name
      }
    });

  } catch (error) {
    logger.error('❌ Error creating Stripe customer:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create customer account'
    });
  }
});

// Create payment intent for one-time payment
app.post('/api/stripe/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, description, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const user = await dbService.getUserById(req.user.userId);
    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company
      });
      
      stripeCustomerId = stripeCustomer.id;
      await dbService.updateUser(user.id, { stripeCustomerId });
    }

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      customerId: stripeCustomerId,
      description: description || `Payment for ${user.company} - StackPro`,
      metadata: {
        userId: user.id,
        clientId: user.clientId,
        plan: user.plan,
        ...metadata
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    logger.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create payment intent'
    });
  }
});

// Create subscription for recurring billing
app.post('/api/stripe/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { priceId, paymentMethodId, trialPeriodDays = 14 } = req.body;
    
    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Price ID is required'
      });
    }

    const user = await dbService.getUserById(req.user.userId);
    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company
      });
      
      stripeCustomerId = stripeCustomer.id;
      await dbService.updateUser(user.id, { stripeCustomerId });
    }

    const subscription = await stripeService.createSubscription({
      customerId: stripeCustomerId,
      priceId,
      paymentMethodId,
      trialPeriodDays,
      metadata: {
        userId: user.id,
        clientId: user.clientId,
        plan: user.plan
      }
    });

    // Update user status
    await dbService.updateUser(user.id, { 
      status: 'active',
      subscriptionId: subscription.id 
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        trial_end: subscription.trial_end
      },
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
    });

  } catch (error) {
    logger.error('❌ Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create subscription'
    });
  }
});

// Cancel subscription
app.post('/api/stripe/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true, reason } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    const subscription = await stripeService.cancelSubscription(subscriptionId, {
      cancelAtPeriodEnd,
      reason
    });

    // Update user status if immediately canceled
    if (!cancelAtPeriodEnd) {
      await dbService.updateUser(req.user.userId, { status: 'canceled' });
    }

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        canceled_at: subscription.canceled_at,
        cancel_at_period_end: subscription.cancel_at_period_end
      }
    });

  } catch (error) {
    logger.error('❌ Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to cancel subscription'
    });
  }
});

// Create customer portal session
app.post('/api/stripe/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const { returnUrl } = req.body;
    
    const user = await dbService.getUserById(req.user.userId);
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No payment account found'
      });
    }

    const portalSession = await stripeService.createPortalSession(
      user.stripeCustomerId,
      returnUrl || `${process.env.FRONTEND_URL}/dashboard?client=${user.clientId}`
    );

    res.json({
      success: true,
      url: portalSession.url
    });

  } catch (error) {
    logger.error('❌ Error creating portal session:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create billing portal session'
    });
  }
});

// Get customer billing history
app.get('/api/stripe/billing-history', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, startingAfter } = req.query;
    
    const user = await dbService.getUserById(req.user.userId);
    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        invoices: [],
        charges: [],
        hasMore: false
      });
    }

    const billingHistory = await stripeService.getBillingHistory(user.stripeCustomerId, {
      limit: parseInt(limit),
      startingAfter
    });

    res.json({
      success: true,
      ...billingHistory
    });

  } catch (error) {
    logger.error('❌ Error getting billing history:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve billing history'
    });
  }
});

// Get customer analytics
app.get('/api/stripe/customer-analytics', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.userId);
    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        analytics: {
          customer: null,
          paymentMethods: 0,
          subscriptions: { active: 0, past_due: 0, canceled: 0, total: 0 },
          billing: { totalInvoices: 0, totalCharges: 0, lifetimeValue: 0 }
        }
      });
    }

    const analytics = await stripeService.getCustomerAnalytics(user.stripeCustomerId);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    logger.error('❌ Error getting customer analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve customer analytics'
    });
  }
});

// Create setup intent for saving payment methods
app.post('/api/stripe/create-setup-intent', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.userId);
    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const stripeCustomer = await stripeService.createCustomer({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company
      });
      
      stripeCustomerId = stripeCustomer.id;
      await dbService.updateUser(user.id, { stripeCustomerId });
    }

    const setupIntent = await stripeService.createSetupIntent({
      customerId: stripeCustomerId
    });

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    });

  } catch (error) {
    logger.error('❌ Error creating setup intent:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to create setup intent'
    });
  }
});

// Stripe webhook endpoint (no authentication required)
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process the webhook event
    const result = await stripeService.handleWebhookEvent(event);

    res.json({
      success: true,
      processed: result.processed,
      action: result.action
    });

  } catch (error) {
    logger.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

// ====================================================================
// SITE BUILDER ENDPOINTS
// ====================================================================

// Import site builder routes
const siteBuilderRoutes = require('./routes/site-builder');

// Site builder routes
app.use('/api/site-builder', siteBuilderRoutes);

// Get payment methods for customer
app.get('/api/stripe/payment-methods', authenticateToken, async (req, res) => {
  try {
    const user = await dbService.getUserById(req.user.userId);
    if (!user.stripeCustomerId) {
      return res.json({
        success: true,
        paymentMethods: []
      });
    }

    const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);

    res.json({
      success: true,
      paymentMethods: paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        } : null,
        created: pm.created
      }))
    });

  } catch (error) {
    logger.error('❌ Error listing payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to retrieve payment methods'
    });
  }
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

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 StackPro API server (simplified) running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`👤 Demo user: demo@stackpro.io / demo123`);
});

module.exports = app;
