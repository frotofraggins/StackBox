/**
 * StackBox Trial System Test Script
 * Demonstrates the free trial functionality
 */

const { TrialManager } = require('./src/services/trial-manager');
const { validateClientConfig } = require('./src/config/validation');

// Sample client configuration for testing
const sampleClient = {
  "clientId": "testclient",
  "email": "test@example.com",
  "subdomain": "testclient",
  "features": {
    "espocrm": true,
    "nextcloud": true,
    "calcom": false,
    "mailtrain": false,
    "staticSite": true,
    "cmsSite": false
  },
  "resources": {
    "instanceType": "t2.micro",
    "storageGB": 8
  },
  "branding": {
    "companyName": "Test Company",
    "themeColor": "#1e40af"
  }
};

async function testTrialSystem() {
  console.log('🧪 TESTING STACKBOX TRIAL SYSTEM');
  console.log('='.repeat(50));

  const trialManager = new TrialManager();

  try {
    // Step 1: Validate configuration
    console.log('📋 Step 1: Validating client configuration...');
    const validation = validateClientConfig(sampleClient);
    if (validation.error) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }
    console.log('✅ Configuration valid');

    // Step 2: Create trial account
    console.log('\n🆓 Step 2: Creating trial account...');
    const trialInfo = trialManager.createTrialAccount(validation.value);
    console.log('✅ Trial account created:');
    console.log(`   Client ID: ${trialInfo.clientId}`);
    console.log(`   Status: ${trialInfo.accountStatus}`);
    console.log(`   Trial Duration: ${trialInfo.daysRemaining} days`);
    console.log(`   Storage Limit: ${trialInfo.features.storageLimit}`);
    console.log(`   Email Limit: ${trialInfo.features.emailLimit}/month`);
    console.log(`   Max Users: ${trialInfo.features.maxUsers}`);

    // Step 3: Check trial status
    console.log('\n📊 Step 3: Checking trial status...');
    const status = trialManager.checkTrialStatus(trialInfo.clientId);
    console.log('✅ Trial status:');
    console.log(`   Days Remaining: ${status.daysRemaining}`);
    console.log(`   Expired: ${status.isExpired ? 'Yes' : 'No'}`);
    console.log(`   Requires Payment: ${status.requiresPayment ? 'Yes' : 'No'}`);
    console.log(`   Will Suspend: ${status.willSuspend ? 'Yes' : 'No'}`);

    // Step 4: Generate payment options
    console.log('\n💳 Step 4: Generating payment options...');
    const paymentInfo = trialManager.generatePaymentLink(trialInfo);
    console.log('✅ Payment options available:');
    paymentInfo.plans.forEach(plan => {
      console.log(`   📦 ${plan.name}: $${plan.price}/${plan.interval}`);
      console.log(`      Features: ${plan.features.slice(0, 3).join(', ')}...`);
    });
    console.log(`   Payment URL: ${paymentInfo.paymentUrl}`);

    // Step 5: Test notification system
    console.log('\n📧 Step 5: Testing notification system...');
    const notification = trialManager.sendTrialNotification(status);
    if (notification.emailType) {
      console.log(`✅ Notification would be sent:`);
      console.log(`   Type: ${notification.emailType}`);
      console.log(`   Subject: ${notification.subject}`);
      console.log(`   Message: ${notification.message}`);
    } else {
      console.log('ℹ️  No notification needed at this time');
    }

    // Step 6: Simulate trial conversion
    console.log('\n🎯 Step 6: Simulating trial conversion...');
    const mockPayment = {
      planId: 'basic',
      subscriptionId: 'sub_1234567890',
      amount: 29
    };
    const paidAccount = trialManager.convertToPaid(trialInfo.clientId, mockPayment);
    console.log('✅ Trial converted to paid account:');
    console.log(`   Status: ${paidAccount.accountStatus}`);
    console.log(`   Plan: ${paidAccount.plan}`);
    console.log(`   Next Billing: ${new Date(paidAccount.nextBillingDate).toLocaleDateString()}`);

    console.log('\n🎉 TRIAL SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ TRIAL SYSTEM TEST FAILED:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testTrialSystem();
}

module.exports = { testTrialSystem };
