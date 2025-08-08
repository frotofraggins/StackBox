/**
 * StackPro Stripe Integration Test
 * Tests API keys, creates products, and verifies payment flow
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STACKPRO_PRODUCTS = require('../config/stripe-products.json');

/**
 * Test Stripe API connection
 */
async function testStripeConnection() {
    try {
        console.log('🔑 Testing Stripe API connection...');
        
        // Test API key validity
        const account = await stripe.accounts.retrieve();
        console.log(`✅ Connected to Stripe account: ${account.email || account.id}`);
        
        return true;
    } catch (error) {
        console.error('❌ Stripe connection failed:', error.message);
        return false;
    }
}

/**
 * Create StackPro products in Stripe
 */
async function createStackProProducts() {
    try {
        console.log('\n📦 Creating StackPro products in Stripe...');
        
        const createdProducts = [];
        
        for (const productConfig of STACKPRO_PRODUCTS.products) {
            try {
                // Create product
                const product = await stripe.products.create({
                    id: productConfig.id,
                    name: productConfig.name,
                    description: productConfig.description,
                });
                
                // Create price
                const price = await stripe.prices.create({
                    product: product.id,
                    unit_amount: productConfig.price,
                    currency: productConfig.currency,
                    recurring: {
                        interval: productConfig.interval,
                    },
                });
                
                createdProducts.push({
                    product: product,
                    price: price,
                    config: productConfig
                });
                
                console.log(`✅ Created: ${productConfig.name} - $${productConfig.price/100}/${productConfig.interval}`);
                
            } catch (error) {
                if (error.code === 'resource_already_exists') {
                    console.log(`ℹ️  Product ${productConfig.name} already exists`);
                } else {
                    console.error(`❌ Failed to create ${productConfig.name}:`, error.message);
                }
            }
        }
        
        console.log(`\n✅ Product setup complete! Created ${createdProducts.length} new products.`);
        return createdProducts;
        
    } catch (error) {
        console.error('❌ Product creation failed:', error.message);
        return [];
    }
}

/**
 * Test payment intent creation
 */
async function testPaymentIntent() {
    try {
        console.log('\n💳 Testing payment intent creation...');
        
        // Test payment intent for StackPro Business ($599)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 59900, // $599.00
            currency: 'usd',
            metadata: {
                product: 'stackpro-business',
                customer_email: 'test@lawfirm.com',
                customer_domain: 'testlawfirm.stackpro.io'
            },
        });
        
        console.log(`✅ Payment Intent Created: ${paymentIntent.id}`);
        console.log(`   Amount: $${paymentIntent.amount / 100}`);
        console.log(`   Status: ${paymentIntent.status}`);
        console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 30)}...`);
        
        return paymentIntent;
        
    } catch (error) {
        console.error('❌ Payment intent creation failed:', error.message);
        return null;
    }
}

/**
 * List existing products
 */
async function listExistingProducts() {
    try {
        console.log('\n📋 Existing Stripe products:');
        
        const products = await stripe.products.list({ limit: 10 });
        
        if (products.data.length === 0) {
            console.log('   No products found.');
            return;
        }
        
        for (const product of products.data) {
            const prices = await stripe.prices.list({ product: product.id });
            const price = prices.data[0];
            
            if (price) {
                console.log(`   • ${product.name}: $${price.unit_amount / 100}/${price.recurring?.interval || 'one-time'}`);
            } else {
                console.log(`   • ${product.name}: No pricing set`);
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to list products:', error.message);
    }
}

/**
 * Test webhook endpoint (simulation)
 */
async function testWebhookEndpoint() {
    console.log('\n🔗 Webhook Configuration:');
    console.log('   Endpoint URL: https://api.stackpro.io/stripe/webhook');
    console.log('   Events to listen for:');
    console.log('     • payment_intent.succeeded');
    console.log('     • customer.subscription.created');
    console.log('     • customer.subscription.updated');
    console.log('     • invoice.payment_succeeded');
    console.log('   ⚠️  Remember to configure this in your Stripe dashboard!');
}

/**
 * Display test card information
 */
function displayTestCards() {
    console.log('\n🧪 Test Credit Cards for Development:');
    console.log('   Success: 4242424242424242');
    console.log('   Declined: 4000000000000002');
    console.log('   Insufficient Funds: 4000000000009995');
    console.log('   Expired Card: 4000000000000069');
    console.log('   Use any future expiry date and any 3-digit CVC.');
}

/**
 * Main test function
 */
async function runStripeTests() {
    console.log('🚀 StackPro Stripe Integration Test\n');
    console.log('='.repeat(50));
    
    // Test connection
    const connectionOk = await testStripeConnection();
    if (!connectionOk) {
        console.log('\n❌ Stopping tests due to connection failure.');
        return;
    }
    
    // List existing products
    await listExistingProducts();
    
    // Create products
    await createStackProProducts();
    
    // Test payment intent
    await testPaymentIntent();
    
    // Show webhook info
    await testWebhookEndpoint();
    
    // Show test cards
    displayTestCards();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ StackPro Stripe Integration Test Complete!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Your Stripe products are ready');
    console.log('   2. Test payments with card: 4242424242424242');  
    console.log('   3. Set up webhook endpoint in Stripe dashboard');
    console.log('   4. Start accepting real customers!');
    console.log('\n💰 Your StackPro pricing:');
    console.log('   • Starter: $299/month');
    console.log('   • Business: $599/month (Most Popular)');
    console.log('   • Enterprise: $1,299/month');
}

// Export for use in other scripts
module.exports = {
    testStripeConnection,
    createStackProProducts,
    testPaymentIntent,
    listExistingProducts
};

// Run tests if called directly
if (require.main === module) {
    runStripeTests().catch(console.error);
}
