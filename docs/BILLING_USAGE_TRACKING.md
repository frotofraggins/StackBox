# StackPro Billing Tiers & Usage Tracking Architecture
## Enterprise-Grade Metering and Billing System

### 🎯 **Executive Summary**
This document outlines the architecture for implementing tiered usage tracking, real-time metering, Stripe integration, and automated billing enforcement for StackPro's multi-tenant platform.

---

## 🏗️ **Architecture Overview**

### **Core Components:**
1. **Usage Metering Engine** - Real-time resource tracking
2. **Billing Tiers Manager** - Plan limits and pricing
3. **CloudWatch Integration** - Metrics collection and alerting
4. **Stripe Synchronization** - Usage-based billing
5. **Enforcement Engine** - Hard/soft limits and notifications
6. **Analytics Dashboard** - Usage insights and forecasting

---

## 💰 **Billing Tiers Structure**

### **1. Plan Definitions**
```javascript
const billingTiers = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: {
      base: 49.00, // Monthly base fee
      currency: 'usd'
    },
    limits: {
      websites: 1,
      storage: 5, // GB
      bandwidth: 50, // GB/month
      aiQueries: 100,
      users: 3,
      customDomains: 1,
      emailsPerMonth: 1000,
      apiCalls: 10000,
      supportLevel: 'email'
    },
    features: [
      'Basic Website Builder',
      'Email Integration', 
      'File Storage',
      'Basic Analytics'
    ]
  },
  
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: {
      base: 149.00,
      overageRates: {
        storage: 0.50, // per GB over limit
        bandwidth: 0.10, // per GB over limit
        aiQueries: 0.02, // per query over limit
        users: 15.00, // per additional user
        emails: 0.001 // per email over limit
      }
    },
    limits: {
      websites: 5,
      storage: 50,
      bandwidth: 500,
      aiQueries: 1000,
      users: 10,
      customDomains: 5,
      emailsPerMonth: 10000,
      apiCalls: 100000,
      supportLevel: 'priority'
    },
    features: [
      'Advanced Website Builder',
      'AI Assistant',
      'Real-time Messaging',
      'Custom Domains',
      'Advanced Analytics',
      'API Access'
    ]
  },
  
  ENTERPRISE: {
    id: 'enterprise', 
    name: 'Enterprise',
    price: {
      base: 349.00,
      overageRates: {
        storage: 0.30,
        bandwidth: 0.05,
        aiQueries: 0.01,
        users: 10.00,
        emails: 0.0005
      }
    },
    limits: {
      websites: 25,
      storage: 200,
      bandwidth: 2000,
      aiQueries: 5000,
      users: 50,
      customDomains: 25,
      emailsPerMonth: 50000,
      apiCalls: 500000,
      supportLevel: 'dedicated'
    },
    features: [
      'Unlimited Website Builder',
      'Advanced AI Features',
      'White-label Options',
      'Custom Integrations',
      'Dedicated Support',
      'SLA Guarantees'
    ]
  }
};
```

### **2. Usage Categories**
```javascript
const usageCategories = {
  STORAGE: {
    metric: 'storage_gb',
    unit: 'GB',
    aggregation: 'MAX', // Peak usage during billing period
    resetPeriod: 'never' // Cumulative
  },
  BANDWIDTH: {
    metric: 'bandwidth_gb', 
    unit: 'GB',
    aggregation: 'SUM',
    resetPeriod: 'monthly'
  },
  AI_QUERIES: {
    metric: 'ai_queries_count',
    unit: 'queries',
    aggregation: 'SUM', 
    resetPeriod: 'monthly'
  },
  USERS: {
    metric: 'active_users',
    unit: 'users',
    aggregation: 'MAX',
    resetPeriod: 'never'
  },
  API_CALLS: {
    metric: 'api_calls_count',
    unit: 'calls',
    aggregation: 'SUM',
    resetPeriod: 'monthly'
  },
  EMAILS: {
    metric: 'emails_sent',
    unit: 'emails',
    aggregation: 'SUM',
    resetPeriod: 'monthly'
  }
};
```

---

## 📊 **Usage Tracking Implementation**

### **1. Real-Time Metering Service**
```javascript
class UsageMeteringService {
  constructor() {
    this.cloudWatch = new AWS.CloudWatch();
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async trackUsage(clientId, category, amount, metadata = {}) {
    const timestamp = new Date();
    const hour = new Date(timestamp).setMinutes(0, 0, 0);
    
    try {
      // 1. Send to CloudWatch for aggregation
      await this.sendToCloudWatch(clientId, category, amount, timestamp);
      
      // 2. Update real-time counters in Redis
      await this.updateRedisCounters(clientId, category, amount, hour);
      
      // 3. Store detailed event for analysis
      await this.storeUsageEvent(clientId, category, amount, metadata, timestamp);
      
      // 4. Check limits and trigger alerts if needed
      await this.checkLimitsAndAlert(clientId, category);
      
    } catch (error) {
      console.error('Usage tracking failed:', error);
      // Don't fail the main operation if tracking fails
    }
  }

  async sendToCloudWatch(clientId, category, amount, timestamp) {
    const params = {
      Namespace: 'StackPro/Usage',
      MetricData: [
        {
          MetricName: category,
          Dimensions: [
            { Name: 'ClientId', Value: clientId }
          ],
          Value: amount,
          Timestamp: timestamp,
          Unit: usageCategories[category].unit
        }
      ]
    };
    
    return await this.cloudWatch.putMetricData(params).promise();
  }

  async updateRedisCounters(clientId, category, amount, hour) {
    const pipeline = this.redis.pipeline();
    
    // Current month counter
    const monthKey = `usage:${clientId}:${category}:${new Date().toISOString().slice(0, 7)}`;
    pipeline.incrby(monthKey, amount);
    pipeline.expire(monthKey, 2678400); // 31 days
    
    // Current hour counter (for rate limiting)
    const hourKey = `usage:${clientId}:${category}:hour:${hour}`;
    pipeline.incrby(hourKey, amount);
    pipeline.expire(hourKey, 3600); // 1 hour
    
    // Real-time total
    const totalKey = `usage:${clientId}:${category}:total`;
    if (usageCategories[category].resetPeriod === 'never') {
      pipeline.incrby(totalKey, amount);
    }
    
    await pipeline.exec();
  }

  async storeUsageEvent(clientId, category, amount, metadata, timestamp) {
    const event = {
      PK: `CLIENT#${clientId}`,
      SK: `USAGE#${category}#${timestamp.toISOString()}`,
      clientId,
      category,
      amount,
      metadata,
      timestamp: timestamp.toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days
    };
    
    await this.dynamodb.put({
      TableName: 'StackPro-UsageEvents',
      Item: event
    }).promise();
  }

  async getCurrentUsage(clientId) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = {};
    
    const pipeline = this.redis.pipeline();
    
    for (const [category, config] of Object.entries(usageCategories)) {
      if (config.resetPeriod === 'monthly') {
        pipeline.get(`usage:${clientId}:${category}:${currentMonth}`);
      } else {
        pipeline.get(`usage:${clientId}:${category}:total`);
      }
    }
    
    const results = await pipeline.exec();
    
    let i = 0;
    for (const category of Object.keys(usageCategories)) {
      usage[category] = parseInt(results[i][1]) || 0;
      i++;
    }
    
    return usage;
  }

  async checkLimitsAndAlert(clientId, category) {
    const client = await this.getClientPlan(clientId);
    const currentUsage = await this.getCurrentUsage(clientId);
    const limit = billingTiers[client.plan].limits[category.toLowerCase()];
    
    if (!limit) return;
    
    const usageAmount = currentUsage[category];
    const usagePercent = (usageAmount / limit) * 100;
    
    // Trigger alerts at different thresholds
    if (usagePercent >= 100) {
      await this.handleLimitExceeded(clientId, category, usageAmount, limit);
    } else if (usagePercent >= 90) {
      await this.sendUsageAlert(clientId, category, usagePercent, 'warning');
    } else if (usagePercent >= 75) {
      await this.sendUsageAlert(clientId, category, usagePercent, 'info');
    }
  }
}

// Usage tracking middleware for API endpoints
const trackApiUsage = (category) => {
  return async (req, res, next) => {
    const clientId = req.user?.clientId;
    
    if (clientId) {
      // Track the API call
      await usageMeteringService.trackUsage(
        clientId,
        'API_CALLS',
        1,
        {
          endpoint: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        }
      );
      
      // Track specific category if provided
      if (category) {
        res.on('finish', async () => {
          if (res.statusCode < 400) {
            await usageMeteringService.trackUsage(clientId, category, 1);
          }
        });
      }
    }
    
    next();
  };
};
```

### **2. CloudWatch Custom Metrics**
```javascript
class CloudWatchMetrics {
  constructor() {
    this.cloudWatch = new AWS.CloudWatch();
  }

  async createCustomDashboard(clientId) {
    const dashboardBody = {
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              ['StackPro/Usage', 'storage_gb', 'ClientId', clientId],
              ['StackPro/Usage', 'bandwidth_gb', 'ClientId', clientId],
              ['StackPro/Usage', 'ai_queries_count', 'ClientId', clientId]
            ],
            period: 3600,
            stat: 'Sum',
            region: process.env.AWS_REGION,
            title: 'Usage Metrics'
          }
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['StackPro/Performance', 'ResponseTime', 'ClientId', clientId],
              ['StackPro/Performance', 'ErrorRate', 'ClientId', clientId]
            ],
            period: 300,
            stat: 'Average',
            region: process.env.AWS_REGION,
            title: 'Performance Metrics'
          }
        }
      ]
    };

    await this.cloudWatch.putDashboard({
      DashboardName: `StackPro-Client-${clientId}`,
      DashboardBody: JSON.stringify(dashboardBody)
    }).promise();
  }

  async setupUsageAlarms(clientId, limits) {
    const alarms = [];
    
    for (const [category, limit] of Object.entries(limits)) {
      if (typeof limit === 'number') {
        // Create alarm at 90% of limit
        const alarmName = `StackPro-${clientId}-${category}-90pct`;
        
        alarms.push({
          AlarmName: alarmName,
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 1,
          MetricName: category,
          Namespace: 'StackPro/Usage',
          Period: 3600,
          Statistic: 'Sum',
          Threshold: limit * 0.9,
          ActionsEnabled: true,
          AlarmActions: [
            `arn:aws:sns:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT}:stackpro-usage-alerts`
          ],
          AlarmDescription: `Usage alarm for ${category} at 90% of limit`,
          Dimensions: [
            { Name: 'ClientId', Value: clientId }
          ]
        });
      }
    }

    // Create all alarms
    for (const alarm of alarms) {
      await this.cloudWatch.putMetricAlarm(alarm).promise();
    }
  }
}
```

---

## 💳 **Stripe Integration & Billing**

### **1. Usage-Based Billing Sync**
```javascript
class StripeBillingService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.usageService = new UsageMeteringService();
  }

  async syncUsageToStripe(clientId) {
    try {
      const client = await this.getClientPlan(clientId);
      const usage = await this.usageService.getCurrentUsage(clientId);
      const plan = billingTiers[client.plan];
      
      // Get current subscription
      const subscription = await this.stripe.subscriptions.retrieve(client.stripeSubscriptionId);
      
      // Report usage for metered items
      for (const [category, amount] of Object.entries(usage)) {
        const limit = plan.limits[category.toLowerCase()];
        const overage = Math.max(0, amount - limit);
        
        if (overage > 0 && plan.price.overageRates?.[category.toLowerCase()]) {
          // Find the usage record for this metric
          const usageRecord = subscription.items.data.find(
            item => item.price.metadata.usage_type === category
          );
          
          if (usageRecord) {
            await this.stripe.subscriptionItems.createUsageRecord(
              usageRecord.id,
              {
                quantity: overage,
                timestamp: Math.floor(Date.now() / 1000),
                action: 'set' // Replace previous usage
              }
            );
          }
        }
      }
      
      console.log(`✅ Synced usage to Stripe for client ${clientId}`);
      
    } catch (error) {
      console.error('Failed to sync usage to Stripe:', error);
    }
  }

  async createUsageBasedSubscription(clientId, planId) {
    const plan = billingTiers[planId];
    
    // Create base subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: client.stripeCustomerId,
      items: [
        {
          price_data: {
            currency: 'usd',
            product: process.env.STRIPE_PRODUCT_ID,
            unit_amount: plan.price.base * 100,
            recurring: { interval: 'month' }
          }
        }
      ],
      metadata: {
        clientId,
        plan: planId
      }
    });
    
    // Add metered usage items
    if (plan.price.overageRates) {
      for (const [category, rate] of Object.entries(plan.price.overageRates)) {
        await this.stripe.subscriptionItems.create({
          subscription: subscription.id,
          price_data: {
            currency: 'usd',
            product: process.env.STRIPE_PRODUCT_ID,
            unit_amount: Math.round(rate * 100),
            recurring: {
              interval: 'month',
              usage_type: 'metered'
            },
            metadata: {
              usage_type: category
            }
          }
        });
      }
    }
    
    return subscription;
  }

  // Daily usage sync job
  async dailyUsageSync() {
    const clients = await this.getAllActiveClients();
    
    for (const client of clients) {
      try {
        await this.syncUsageToStripe(client.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Failed to sync usage for client ${client.id}:`, error);
      }
    }
  }
}

// Lambda function for daily billing sync
exports.dailyBillingSync = async (event) => {
  const billingService = new StripeBillingService();
  await billingService.dailyUsageSync();
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Daily billing sync completed' })
  };
};
```

### **2. Real-Time Pricing Calculator**
```javascript
class PricingCalculator {
  static calculateMonthlyBill(clientId, usage, planId) {
    const plan = billingTiers[planId];
    let totalCost = plan.price.base;
    let breakdown = {
      base: plan.price.base,
      overages: {},
      total: plan.price.base
    };
    
    // Calculate overages
    if (plan.price.overageRates) {
      for (const [category, rate] of Object.entries(plan.price.overageRates)) {
        const limit = plan.limits[category];
        const usageAmount = usage[category.toUpperCase()] || 0;
        const overage = Math.max(0, usageAmount - limit);
        
        if (overage > 0) {
          const overageCost = overage * rate;
          totalCost += overageCost;
          breakdown.overages[category] = {
            usage: usageAmount,
            limit,
            overage,
            rate,
            cost: overageCost
          };
        }
      }
    }
    
    breakdown.total = totalCost;
    return breakdown;
  }

  static projectMonthlyBill(clientId, currentUsage, daysIntoMonth) {
    const projection = {};
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - daysIntoMonth;
    
    // Project usage for rest of month
    for (const [category, amount] of Object.entries(currentUsage)) {
      if (usageCategories[category].resetPeriod === 'monthly') {
        const dailyAverage = amount / daysIntoMonth;
        projection[category] = Math.round(amount + (dailyAverage * remainingDays));
      } else {
        projection[category] = amount; // No projection for cumulative metrics
      }
    }
    
    return projection;
  }
}
```

---

## 🚨 **Enforcement & Limit Management**

### **1. Hard vs Soft Limits**
```javascript
class LimitEnforcementService {
  constructor() {
    this.usageService = new UsageMeteringService();
    this.notificationService = new NotificationService();
  }

  async enforceLimit(clientId, category, requestedAmount = 1) {
    const client = await this.getClientPlan(clientId);
    const plan = billingTiers[client.plan];
    const limit = plan.limits[category.toLowerCase()];
    
    if (!limit) return { allowed: true };
    
    const currentUsage = await this.usageService.getCurrentUsage(clientId);
    const categoryUsage = currentUsage[category] || 0;
    const newTotal = categoryUsage + requestedAmount;
    
    // Check if this would exceed the limit
    if (newTotal > limit) {
      const enforcement = this.getEnforcementPolicy(category, client.plan);
      
      switch (enforcement.type) {
        case 'HARD_LIMIT':
          return {
            allowed: false,
            reason: 'LIMIT_EXCEEDED',
            message: `${category} limit of ${limit} exceeded. Upgrade plan or contact support.`,
            currentUsage: categoryUsage,
            limit,
            upgradeUrl: `/billing/upgrade?reason=limit_${category.toLowerCase()}`
          };
          
        case 'SOFT_LIMIT':
          // Allow but charge overage
          await this.notificationService.sendOverageNotification(clientId, category, newTotal, limit);
          return {
            allowed: true,
            warning: true,
            message: `${category} limit exceeded. Overage charges will apply.`,
            overageRate: plan.price.overageRates?.[category.toLowerCase()]
          };
          
        case 'WARNING_ONLY':
          if (newTotal > limit * 0.9) { // 90% threshold
            await this.notificationService.sendUsageWarning(clientId, category, newTotal, limit);
          }
          return { allowed: true };
          
        default:
          return { allowed: true };
      }
    }
    
    return { allowed: true };
  }

  getEnforcementPolicy(category, plan) {
    const policies = {
      STORAGE: { type: 'SOFT_LIMIT' }, // Allow overage with billing
      BANDWIDTH: { type: 'SOFT_LIMIT' },
      AI_QUERIES: { type: 'HARD_LIMIT' }, // Block after limit
      USERS: { type: 'HARD_LIMIT' },
      API_CALLS: { type: 'HARD_LIMIT' },
      EMAILS: { type: 'SOFT_LIMIT' }
    };
    
    // Enterprise gets more lenient policies
    if (plan === 'ENTERPRISE') {
      return { type: 'SOFT_LIMIT' }; // Enterprise gets overages for everything
    }
    
    return policies[category] || { type: 'WARNING_ONLY' };
  }

  // Middleware for API endpoints
  static limitMiddleware(category) {
    return async (req, res, next) => {
      const clientId = req.user?.clientId;
      
      if (!clientId) {
        return res.status(403).json({ error: 'Client ID required' });
      }
      
      const enforcement = new LimitEnforcementService();
      const result = await enforcement.enforceLimit(clientId, category);
      
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Usage limit exceeded',
          details: result
        });
      }
      
      if (result.warning) {
        res.set('X-Usage-Warning', result.message);
      }
      
      next();
    };
  }
}

// Usage in API routes
app.post('/api/ai/chat', 
  LimitEnforcementService.limitMiddleware('AI_QUERIES'),
  trackApiUsage('AI_QUERIES'),
  handleAIChat
);

app.post('/api/sites', 
  LimitEnforcementService.limitMiddleware('WEBSITES'),
  trackApiUsage('WEBSITES'),
  createSite
);
```

### **2. Auto-Upgrade & Notifications**
```javascript
class AutoUpgradeService {
  async checkAutoUpgradeEligibility(clientId) {
    const client = await this.getClientPlan(clientId);
    const usage = await this.usageService.getCurrentUsage(clientId);
    const currentPlan = billingTiers[client.plan];
    
    // Check if client consistently exceeds limits
    const exceedsCount = this.countLimitExceeds(usage, currentPlan.limits);
    
    if (exceedsCount >= 3) { // Exceeds 3+ categories
      const nextTier = this.getNextTier(client.plan);
      
      if (nextTier && client.autoUpgradeEnabled) {
        return await this.proposeAutoUpgrade(clientId, nextTier, usage);
      }
    }
    
    return null;
  }

  async proposeAutoUpgrade(clientId, targetPlan, usage) {
    const currentCost = this.calculateCurrentCost(clientId, usage);
    const newCost = PricingCalculator.calculateMonthlyBill(clientId, usage, targetPlan);
    
    const proposal = {
      currentPlan: client.plan,
      targetPlan,
      currentCost: currentCost.total,
      newCost: newCost.base, // Base cost of new plan
      savings: currentCost.total - newCost.base,
      benefits: this.comparePlanFeatures(client.plan, targetPlan)
    };
    
    // Send upgrade proposal email
    await this.notificationService.sendUpgradeProposal(clientId, proposal);
    
    return proposal;
  }

  getNextTier(currentPlan) {
    const tiers = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const currentIndex = tiers.indexOf(currentPlan);
    return tiers[currentIndex + 1] || null;
  }
}
```

---

## 📈 **Analytics Dashboard**

### **1. Usage Analytics API**
```javascript
// API endpoint for usage analytics
app.get('/api/analytics/usage/:clientId', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { period = '30d' } = req.query;
    
    // Validate client access
    if (req.user.clientId !== clientId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const analytics = await generateUsageAnalytics(clientId, period);
    
    res.json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

const generateUsageAnalytics = async (clientId, period) => {
  const cloudWatch = new AWS.CloudWatch();
  const endTime = new Date();
  const startTime = new Date(endTime - (parsePeriod(period) * 1000));
  
  // Get usage trends
  const metrics = await Promise.all(
    Object.keys(usageCategories).map(async (category) => {
      const result = await cloudWatch.getMetricStatistics({
        Namespace: 'StackPro/Usage',
        MetricName: category.toLowerCase(),
        Dimensions: [
          { Name: 'ClientId', Value: clientId }
        ],
        StartTime: startTime,
        EndTime: endTime,
        Period: 86400, // Daily
        Statistics: ['Sum', 'Maximum']
      }).promise();
      
      return {
        category,
        datapoints: result.Datapoints.sort((a, b) => a.Timestamp - b.Timestamp),
        current: await this.usageService.getCurrentUsage(clientId)[category] || 0
      };
    })
  );
  
  // Calculate trends
  const trends = metrics.map(metric => ({
    ...metric,
    trend: calculateTrend(metric.datapoints),
    prediction: predictUsage(metric.datapoints, 30) // 30 day forecast
  }));
  
  return {
    period,
    metrics: trends,
    summary: {
      totalCost: await PricingCalculator.calculateMonthlyBill(clientId, await this.usageService.getCurrentUsage(clientId)),
      topCategories: trends.sort((a, b) => b.current - a.current).slice(0, 3),
      alerts: await this.getActiveUsageAlerts(clientId)
    }
  };
};
```

### **2. Frontend Analytics Components**
```typescript
// React component for usage dashboard
const UsageAnalytics: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [clientId]);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/usage/${clientId}`);
      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="usage-analytics">
      <div className="summary-cards">
        <div className="card">
          <h3>Current Bill</h3>
          <div className="amount">${analytics.summary.totalCost.total}</div>
          <div className="breakdown">
            Base: ${analytics.summary.totalCost.base}
            {Object.keys(analytics.summary.totalCost.overages).length > 0 && (
              <span>Overages: ${Object.values(analytics.summary.totalCost.overages).reduce((sum, o) => sum + o.cost, 0)}</span>
            )}
          </div>
        </div>
        
        {analytics.summary.topCategories.map(metric => (
          <div key={metric.category} className="card">
            <h3>{metric.category}</h3>
            <div className="usage">
              {metric.current} / {getCurrentLimit(metric.category)} {getUnit(metric.category)}
            </div>
            <div className="trend">
              {metric.trend > 0 ? '↗️' : '↘️'} {Math.abs(metric.trend)}% vs last month
            </div>
          </div>
        ))}
      </div>
      
      <div className="charts">
        {analytics.metrics.map(metric => (
          <UsageChart 
            key={metric.category} 
            data={metric.datapoints} 
            title={metric.category}
            prediction={metric.prediction}
          />
        ))}
      </div>
      
      {analytics.summary.alerts.length > 0 && (
        <div className="alerts">
          <h3>Usage Alerts</h3>
          {analytics.summary.alerts.map(alert => (
            <div key
