/**
 * StackPro Stripe Integration Service
 * Comprehensive payment processing and customer management
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../utils/logger');

class StripeService {
  constructor() {
    logger.info('🔵 Stripe service initialized');
  }

  /**
   * Creates a Stripe customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const { email, firstName, lastName, company, phone, address } = customerData;

      const customer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        description: `${company} - StackPro Customer`,
        phone,
        address,
        metadata: {
          firstName,
          lastName,
          company,
          source: 'StackPro Platform',
          createdAt: new Date().toISOString()
        }
      });

      logger.info('✅ Stripe customer created:', { 
        customerId: customer.id, 
        email: customer.email 
      });

      return customer;
    } catch (error) {
      logger.error('❌ Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Retrieves a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Stripe customer object
   */
  async getCustomer(customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      logger.error('❌ Error retrieving customer:', error);
      throw error;
    }
  }

  /**
   * Updates a Stripe customer
   * @param {string} customerId - Stripe customer ID
   * @param {Object} updates - Customer updates
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomer(customerId, updates) {
    try {
      const customer = await stripe.customers.update(customerId, updates);
      logger.info('✅ Customer updated:', { customerId });
      return customer;
    } catch (error) {
      logger.error('❌ Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Creates a payment intent for one-time payments
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(paymentData) {
    try {
      const { 
        amount, 
        currency = 'usd', 
        customerId, 
        description,
        metadata = {} 
      } = paymentData;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        description,
        metadata: {
          ...metadata,
          platform: 'StackPro',
          createdAt: new Date().toISOString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info('✅ Payment intent created:', { 
        paymentIntentId: paymentIntent.id,
        amount: amount,
        customerId 
      });

      return paymentIntent;
    } catch (error) {
      logger.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Creates a setup intent for saving payment methods
   * @param {Object} setupData - Setup information
   * @returns {Promise<Object>} Setup intent
   */
  async createSetupIntent(setupData) {
    try {
      const { customerId, paymentMethodTypes = ['card'] } = setupData;

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: paymentMethodTypes,
        usage: 'off_session',
        metadata: {
          purpose: 'payment_method_setup',
          platform: 'StackPro'
        }
      });

      logger.info('✅ Setup intent created:', { 
        setupIntentId: setupIntent.id,
        customerId 
      });

      return setupIntent;
    } catch (error) {
      logger.error('❌ Error creating setup intent:', error);
      throw error;
    }
  }

  /**
   * Creates a subscription for recurring billing
   * @param {Object} subscriptionData - Subscription information
   * @returns {Promise<Object>} Subscription object
   */
  async createSubscription(subscriptionData) {
    try {
      const { 
        customerId, 
        priceId, 
        paymentMethodId,
        trialPeriodDays = 14,
        metadata = {} 
      } = subscriptionData;

      // Attach payment method to customer if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialPeriodDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          ...metadata,
          platform: 'StackPro',
          createdAt: new Date().toISOString()
        }
      });

      logger.info('✅ Subscription created:', { 
        subscriptionId: subscription.id,
        customerId,
        priceId 
      });

      return subscription;
    } catch (error) {
      logger.error('❌ Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Updates a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updates - Subscription updates
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, updates);
      logger.info('✅ Subscription updated:', { subscriptionId });
      return subscription;
    } catch (error) {
      logger.error('❌ Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancels a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} options - Cancellation options
   * @returns {Promise<Object>} Canceled subscription
   */
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const { cancelAtPeriodEnd = false, reason = 'requested_by_customer' } = options;

      let subscription;
      if (cancelAtPeriodEnd) {
        subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: { cancellation_reason: reason }
        });
      } else {
        subscription = await stripe.subscriptions.cancel(subscriptionId, {
          metadata: { cancellation_reason: reason }
        });
      }

      logger.info('✅ Subscription canceled:', { 
        subscriptionId, 
        cancelAtPeriodEnd 
      });

      return subscription;
    } catch (error) {
      logger.error('❌ Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Lists customer payment methods
   * @param {string} customerId - Customer ID
   * @param {string} type - Payment method type
   * @returns {Promise<Array>} Payment methods
   */
  async listPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: type,
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('❌ Error listing payment methods:', error);
      throw error;
    }
  }

  /**
   * Creates a customer session for embedded components
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer session
   */
  async createCustomerSession(customerId) {
    try {
      const session = await stripe.customerSessions.create({
        customer: customerId,
        components: {
          pricing_table: { enabled: true },
          payment_element: { enabled: true },
        },
      });

      return session;
    } catch (error) {
      logger.error('❌ Error creating customer session:', error);
      throw error;
    }
  }

  /**
   * Creates an invoice for custom billing
   * @param {Object} invoiceData - Invoice information
   * @returns {Promise<Object>} Invoice object
   */
  async createInvoice(invoiceData) {
    try {
      const { customerId, items, description, metadata = {} } = invoiceData;

      // Create invoice items first
      for (const item of items) {
        await stripe.invoiceItems.create({
          customer: customerId,
          amount: Math.round(item.amount * 100),
          currency: item.currency || 'usd',
          description: item.description,
        });
      }

      // Create and finalize invoice
      const invoice = await stripe.invoices.create({
        customer: customerId,
        description,
        metadata: {
          ...metadata,
          platform: 'StackPro'
        }
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

      logger.info('✅ Invoice created and finalized:', { 
        invoiceId: finalizedInvoice.id,
        customerId 
      });

      return finalizedInvoice;
    } catch (error) {
      logger.error('❌ Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Creates a refund
   * @param {Object} refundData - Refund information
   * @returns {Promise<Object>} Refund object
   */
  async createRefund(refundData) {
    try {
      const { 
        paymentIntentId, 
        amount, 
        reason = 'requested_by_customer',
        metadata = {} 
      } = refundData;

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
        reason,
        metadata: {
          ...metadata,
          platform: 'StackPro',
          processedAt: new Date().toISOString()
        }
      });

      logger.info('✅ Refund processed:', { 
        refundId: refund.id,
        amount: refund.amount / 100 
      });

      return refund;
    } catch (error) {
      logger.error('❌ Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Retrieves customer's billing history
   * @param {string} customerId - Customer ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Billing history
   */
  async getBillingHistory(customerId, options = {}) {
    try {
      const { limit = 10, startingAfter } = options;

      // Get invoices
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit,
        starting_after: startingAfter
      });

      // Get charges
      const charges = await stripe.charges.list({
        customer: customerId,
        limit,
        starting_after: startingAfter
      });

      return {
        invoices: invoices.data,
        charges: charges.data,
        hasMore: invoices.has_more || charges.has_more
      };
    } catch (error) {
      logger.error('❌ Error retrieving billing history:', error);
      throw error;
    }
  }

  /**
   * Creates a portal session for customer self-service
   * @param {string} customerId - Customer ID
   * @param {string} returnUrl - Return URL after portal session
   * @returns {Promise<Object>} Portal session
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      logger.info('✅ Portal session created:', { 
        customerId, 
        sessionId: portalSession.id 
      });

      return portalSession;
    } catch (error) {
      logger.error('❌ Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Handles incoming webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<Object>} Processed event result
   */
  async handleWebhookEvent(event) {
    try {
      logger.info('🔔 Processing Stripe webhook:', { 
        type: event.type, 
        id: event.id 
      });

      switch (event.type) {
        case 'customer.created':
          return await this.handleCustomerCreated(event.data.object);
          
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
          
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
          
        case 'invoice.payment_succeeded':
          return await this.handleInvoicePaymentSucceeded(event.data.object);
          
        case 'invoice.payment_failed':
          return await this.handleInvoicePaymentFailed(event.data.object);
          
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(event.data.object);
          
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(event.data.object);
          
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event.data.object);
          
        default:
          logger.info('ℹ️ Unhandled webhook event type:', event.type);
          return { processed: false, reason: 'Unhandled event type' };
      }
    } catch (error) {
      logger.error('❌ Error processing webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle customer creation webhook
   */
  async handleCustomerCreated(customer) {
    logger.info('👤 New customer created:', { customerId: customer.id });
    // Add any custom logic here
    return { processed: true, action: 'customer_created' };
  }

  /**
   * Handle successful payment webhook
   */
  async handlePaymentSucceeded(paymentIntent) {
    logger.info('💰 Payment succeeded:', { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100 
    });
    // Add any custom logic here (unlock features, send confirmation, etc.)
    return { processed: true, action: 'payment_succeeded' };
  }

  /**
   * Handle failed payment webhook
   */
  async handlePaymentFailed(paymentIntent) {
    logger.warn('💳 Payment failed:', { 
      paymentIntentId: paymentIntent.id,
      reason: paymentIntent.last_payment_error?.message 
    });
    // Add any custom logic here (send notification, retry logic, etc.)
    return { processed: true, action: 'payment_failed' };
  }

  /**
   * Handle subscription created webhook
   */
  async handleSubscriptionCreated(subscription) {
    logger.info('🔄 Subscription created:', { 
      subscriptionId: subscription.id,
      customerId: subscription.customer 
    });
    // Add any custom logic here (activate features, send welcome email, etc.)
    return { processed: true, action: 'subscription_created' };
  }

  /**
   * Handle subscription updated webhook
   */
  async handleSubscriptionUpdated(subscription) {
    logger.info('🔄 Subscription updated:', { 
      subscriptionId: subscription.id,
      status: subscription.status 
    });
    // Add any custom logic here (update user permissions, etc.)
    return { processed: true, action: 'subscription_updated' };
  }

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(subscription) {
    logger.info('🔄 Subscription canceled:', { 
      subscriptionId: subscription.id,
      customerId: subscription.customer 
    });
    // Add any custom logic here (downgrade features, send retention email, etc.)
    return { processed: true, action: 'subscription_deleted' };
  }

  /**
   * Handle invoice payment succeeded webhook
   */
  async handleInvoicePaymentSucceeded(invoice) {
    logger.info('📄 Invoice payment succeeded:', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription 
    });
    return { processed: true, action: 'invoice_payment_succeeded' };
  }

  /**
   * Handle invoice payment failed webhook
   */
  async handleInvoicePaymentFailed(invoice) {
    logger.warn('📄 Invoice payment failed:', { 
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription 
    });
    return { processed: true, action: 'invoice_payment_failed' };
  }

  /**
   * Get comprehensive customer analytics
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer analytics
   */
  async getCustomerAnalytics(customerId) {
    try {
      const customer = await this.getCustomer(customerId);
      const paymentMethods = await this.listPaymentMethods(customerId);
      const billingHistory = await this.getBillingHistory(customerId);
      
      // Get subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all'
      });

      return {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          created: customer.created,
          balance: customer.balance,
          delinquent: customer.delinquent
        },
        paymentMethods: paymentMethods.length,
        subscriptions: {
          active: subscriptions.data.filter(s => s.status === 'active').length,
          past_due: subscriptions.data.filter(s => s.status === 'past_due').length,
          canceled: subscriptions.data.filter(s => s.status === 'canceled').length,
          total: subscriptions.data.length
        },
        billing: {
          totalInvoices: billingHistory.invoices.length,
          totalCharges: billingHistory.charges.length,
          lifetimeValue: billingHistory.charges.reduce((sum, charge) => 
            sum + (charge.amount / 100), 0
          )
        }
      };
    } catch (error) {
      logger.error('❌ Error getting customer analytics:', error);
      throw error;
    }
  }
}

module.exports = { StripeService };
