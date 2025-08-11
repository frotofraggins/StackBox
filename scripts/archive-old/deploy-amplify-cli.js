#!/usr/bin/env node

/**
 * AWS Amplify CLI Sandbox Deployment Script
 * Simplified deployment using Amplify CLI instead of SDK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StackPro Amplify CLI Deployment');
console.log('📍 This approach uses the Amplify CLI for simpler deployment');

// Check if Amplify CLI is installed
try {
  execSync('amplify --version', { stdio: 'pipe' });
  console.log('✅ Amplify CLI detected');
} catch (error) {
  console.log('📦 Installing Amplify CLI...');
  execSync('npm install -g @aws-amplify/cli', { stdio: 'inherit' });
}

// Environment variables for sandbox
const envVars = {
  NEXT_PUBLIC_ENV: 'sandbox',
  NEXT_PUBLIC_API_URL: 'https://api-sandbox.stackpro.io',
  NEXT_PUBLIC_WS_URL: 'wss://ws-sandbox.stackpro.io', 
  NEXT_PUBLIC_FREE_TIER: 'true',
  AI_ENABLED: 'false',
  TURNSTILE_ENABLED: 'true',
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  GENERATE_SOURCEMAP: 'false'
};

console.log('\n📋 **AMPLIFY CLI DEPLOYMENT STEPS**');
console.log('Run these commands in order:\n');

console.log('1️⃣ **Navigate to frontend directory**:');
console.log('   cd frontend\n');

console.log('2️⃣ **Initialize Amplify project**:');
console.log('   amplify init --yes --project StackPro-Sandbox\n');

console.log('3️⃣ **Add hosting with environment variables**:');
console.log('   amplify add hosting');
console.log('   # Select: Amazon CloudFront and S3');
console.log('   # Choose: DEV (S3 + CloudFront)\n');

console.log('4️⃣ **Set environment variables**:');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   amplify env set ${key} ${value}`);
});

console.log('\n5️⃣ **Configure build settings** (create amplify.yml):');
console.log(`   # Create frontend/amplify.yml with:`);
console.log(`
version: 1
applications:
  - appRoot: .
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
`);

console.log('\n6️⃣ **Deploy**:');
console.log('   amplify publish\n');

console.log('7️⃣ **Add custom domain** (after first deploy):');
console.log('   amplify add hosting');
console.log('   # Update to use custom domain: sandbox.stackpro.io\n');

// Create the amplify.yml file
const amplifyYml = `version: 1
applications:
  - appRoot: .
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
`;

fs.writeFileSync(path.join(__dirname, '..', 'frontend', 'amplify.yml'), amplifyYml);
console.log('✅ Created frontend/amplify.yml');

console.log('\n🎯 **BENEFITS OF CLI APPROACH**:');
console.log('✅ Handles Next.js build configuration automatically');
console.log('✅ Better error handling and debugging');
console.log('✅ Built-in environment management');
console.log('✅ Automatic SSL certificate management');
console.log('✅ Simplified domain configuration');

console.log('\n💡 **READY TO USE CLI?**');
console.log('The Amplify CLI approach will be much more reliable!');
