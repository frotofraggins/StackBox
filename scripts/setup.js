#!/usr/bin/env node

/**
 * StackBox Setup Script
 * Automated setup for local development environment
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.blue}${question}${colors.reset}`, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupEnvironment() {
  log('🚀 STACKBOX MVP SETUP', 'bold');
  log('Setting up your development environment...\n', 'blue');

  // Step 1: Install dependencies
  log('📦 Step 1: Installing dependencies...', 'bold');
  
  try {
    log('Installing main project dependencies...', 'blue');
    execSync('npm install', { stdio: 'inherit' });
    
    log('Installing frontend dependencies...', 'blue');
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    
    log('✅ Dependencies installed successfully!', 'green');
  } catch (error) {
    log('❌ Failed to install dependencies. Please run manually:', 'red');
    log('  npm install', 'yellow');
    log('  cd frontend && npm install', 'yellow');
    return;
  }

  // Step 2: Create environment file
  log('\n🔧 Step 2: Environment configuration...', 'bold');
  
  if (!fs.existsSync('.env')) {
    log('Creating .env file...', 'blue');
    
    const useStripe = await askQuestion('Do you want to set up Stripe for payments? (y/n): ');
    const useAWS = await askQuestion('Do you have AWS credentials configured? (y/n): ');
    
    let envContent = fs.readFileSync('.env.template', 'utf-8');
    
    if (useStripe.toLowerCase() === 'y') {
      log('\n📋 Please get your Stripe keys from: https://dashboard.stripe.com/test/apikeys', 'yellow');
      const stripeSecret = await askQuestion('Enter your Stripe Secret Key (sk_test_...): ');
      const stripePublic = await askQuestion('Enter your Stripe Publishable Key (pk_test_...): ');
      
      if (stripeSecret && stripePublic) {
        envContent = envContent.replace('sk_test_YOUR_STRIPE_SECRET_KEY_HERE', stripeSecret);
        envContent = envContent.replace('pk_test_YOUR_PUBLISHABLE_KEY_HERE', stripePublic);
      }
    }
    
    fs.writeFileSync('.env', envContent);
    log('✅ .env file created!', 'green');
    
    // Create frontend env file
    const frontendEnv = `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STACKBOX_API_URL=http://localhost:3001
`;
    
    if (!fs.existsSync('frontend/.env.local')) {
      fs.writeFileSync('frontend/.env.local', frontendEnv);
      log('✅ Frontend .env.local created!', 'green');
    }
  } else {
    log('✅ .env file already exists', 'green');
  }

  // Step 3: Test setup
  log('\n🧪 Step 3: Testing setup...', 'bold');
  
  try {
    // Test Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log(`✅ Node.js ${nodeVersion} (compatible)`, 'green');
    } else {
      log(`❌ Node.js ${nodeVersion} - Please upgrade to Node.js 18+`, 'red');
    }
    
    // Test AWS CLI (optional)
    try {
      execSync('aws --version', { stdio: 'ignore' });
      log('✅ AWS CLI installed', 'green');
      
      try {
        execSync('aws sts get-caller-identity', { stdio: 'ignore' });
        log('✅ AWS credentials configured', 'green');
      } catch {
        log('⚠️  AWS credentials not configured (run: aws configure)', 'yellow');
      }
    } catch {
      log('⚠️  AWS CLI not installed (optional)', 'yellow');
    }
    
  } catch (error) {
    log('⚠️  Some tests failed, but you can continue', 'yellow');
  }

  rl.close();

  // Final instructions
  log('\n🎉 SETUP COMPLETE!', 'green');
  log('=' * 50, 'blue');
  
  log('\n📋 Next Steps:', 'bold');
  log('1. Review and update your .env file with real credentials', 'blue');
  log('2. Run the quick test: npm run quick-test', 'blue');
  log('3. Start the API server: npm run dev', 'blue');
  log('4. In a new terminal, start the frontend: cd frontend && npm run dev', 'blue');
  log('5. Open your browser: http://localhost:3000', 'blue');
  
  log('\n📚 Documentation:', 'bold');
  log('• TESTING_AND_DEPLOYMENT_GUIDE.md - Complete guide', 'blue');
  log('• README.md - Project overview', 'blue');
  log('• .env.template - Environment variables reference', 'blue');
  
  log('\n🔧 Useful Commands:', 'bold');
  log('• npm run quick-test - Run all checks', 'blue');
  log('• npm run test-aws - Test AWS connection', 'blue');
  log('• npm run health - Check API server health', 'blue');
  log('• npm run check-domains - Check domain availability', 'blue');
}

// Run setup
setupEnvironment().catch(console.error);
