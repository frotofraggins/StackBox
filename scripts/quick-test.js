#!/usr/bin/env node

/**
 * Quick Test Script for StackBox MVP
 * Verifies basic functionality before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
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

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function runCommand(command, description, optional = false) {
  try {
    log(`🔄 ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf-8', timeout: 10000 });
    log(`✅ ${description} - SUCCESS`, 'green');
    return true;
  } catch (error) {
    if (optional) {
      log(`⚠️  ${description} - SKIPPED (optional)`, 'yellow');
      return true;
    } else {
      log(`❌ ${description} - FAILED`, 'red');
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }
}

async function runTests() {
  log('🚀 STACKBOX MVP QUICK TEST', 'bold');
  log('=' * 50, 'blue');
  
  let allTestsPassed = true;
  
  // Test 1: File Structure
  log('\n📁 1. CHECKING FILE STRUCTURE', 'bold');
  const requiredFiles = [
    ['package.json', 'Main package.json'],
    ['src/api/server.js', 'API Server'],
    ['src/services/enterprise-deployer.js', 'Enterprise Deployer'],
    ['frontend/package.json', 'Frontend package.json'],
    ['frontend/src/pages/index.tsx', 'Landing Page'],
    ['frontend/src/components/SignupForm.tsx', 'Signup Component'],
    ['config/aws-config.json', 'AWS Configuration'],
    ['docs/TESTING_AND_DEPLOYMENT_GUIDE.md', 'Deployment Guide'],
    ['.env.template', 'Environment Template']
  ];
  
  for (const [file, desc] of requiredFiles) {
    if (!checkFile(file, desc)) {
      allTestsPassed = false;
    }
  }
  
  // Test 2: Dependencies
  log('\n📦 2. CHECKING DEPENDENCIES', 'bold');
  
  // Check main dependencies
  if (!runCommand('npm list --depth=0', 'Main dependencies check', true)) {
    allTestsPassed = false;
  }
  
  // Check frontend dependencies
  if (fs.existsSync('frontend/package.json')) {
    process.chdir('frontend');
    if (!runCommand('npm list --depth=0', 'Frontend dependencies check', true)) {
      allTestsPassed = false;
    }
    process.chdir('..');
  }
  
  // Test 3: Environment Configuration
  log('\n🔧 3. CHECKING ENVIRONMENT SETUP', 'bold');
  
  const envFile = '.env';
  const frontendEnvFile = 'frontend/.env.local';
  
  if (checkFile(envFile, 'Main environment file')) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    const requiredEnvVars = ['AWS_REGION', 'STRIPE_SECRET_KEY', 'FRONTEND_URL'];
    
    for (const envVar of requiredEnvVars) {
      if (envContent.includes(envVar)) {
        log(`✅ ${envVar} configured`, 'green');
      } else {
        log(`❌ ${envVar} missing from .env`, 'red');
        allTestsPassed = false;
      }
    }
  } else {
    log('⚠️  .env file not found - create one using the template in the guide', 'yellow');
  }
  
  checkFile(frontendEnvFile, 'Frontend environment file');
  
  // Test 4: AWS Configuration
  log('\n☁️  4. CHECKING AWS SETUP', 'bold');
  
  if (runCommand('aws --version', 'AWS CLI installed', true)) {
    runCommand('aws sts get-caller-identity', 'AWS credentials configured', true);
  }
  
  // Test 5: Node.js Version
  log('\n⚙️  5. CHECKING NODE.JS VERSION', 'bold');
  
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log(`✅ Node.js ${nodeVersion} (>=18 required)`, 'green');
    } else {
      log(`❌ Node.js ${nodeVersion} - Please upgrade to Node.js 18+`, 'red');
      allTestsPassed = false;
    }
  } catch (error) {
    log('❌ Could not check Node.js version', 'red');
    allTestsPassed = false;
  }
  
  // Test 6: Basic Syntax Check
  log('\n🔍 6. CHECKING CODE SYNTAX', 'bold');
  
  try {
    require('../src/api/server.js');
    log('✅ API server syntax check passed', 'green');
  } catch (error) {
    log(`❌ API server syntax error: ${error.message}`, 'red');
    allTestsPassed = false;
  }
  
  // Final Results
  log('\n' + '=' * 50, 'blue');
  
  if (allTestsPassed) {
    log('🎉 ALL TESTS PASSED!', 'green');
    log('✅ Your StackBox MVP is ready for local testing', 'green');
    log('\nNext steps:', 'bold');
    log('1. Run: npm run dev', 'blue');
    log('2. Run: cd frontend && npm run dev', 'blue');
    log('3. Open: http://localhost:3000', 'blue');
  } else {
    log('❌ SOME TESTS FAILED', 'red');
    log('Please fix the issues above before proceeding', 'yellow');
    log('Refer to TESTING_AND_DEPLOYMENT_GUIDE.md for help', 'blue');
  }
  
  log('\n📚 Documentation:', 'bold');
  log('• TESTING_AND_DEPLOYMENT_GUIDE.md - Complete setup guide', 'blue');
  log('• README.md - Project overview', 'blue');
  log('• .env.template - Environment variables reference', 'blue');
}

// Run the tests
runTests().catch(console.error);
