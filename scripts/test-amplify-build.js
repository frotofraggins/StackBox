#!/usr/bin/env node

/**
 * Test script to verify Amplify build configuration works locally
 * Run this before deploying to catch issues early
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Amplify Build Configuration...\n');

function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes timeout
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function checkFile(filePath) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${filePath} ${exists ? 'exists' : 'missing'}`);
  return exists;
}

function main() {
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  console.log('📋 Pre-flight checks:');
  
  // Check required files
  const requiredFiles = [
    'frontend/package.json',
    'frontend/next.config.js',
    'frontend/tailwind.config.js',
    'amplify.yml'
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (!checkFile(file)) {
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    console.error('❌ Missing required files. Cannot proceed.');
    process.exit(1);
  }
  
  console.log('\n🚀 Testing build process:');
  
  // Test 1: Check Node version
  console.log('\n1️⃣  Checking Node.js version:');
  if (!runCommand('node --version')) {
    process.exit(1);
  }
  
  // Test 2: Check pnpm
  console.log('\n2️⃣  Checking pnpm:');
  if (!runCommand('pnpm --version')) {
    console.log('Installing pnpm...');
    if (!runCommand('corepack enable') || !runCommand('corepack prepare pnpm@9.12.3 --activate')) {
      process.exit(1);
    }
  }
  
  // Test 3: Install dependencies
  console.log('\n3️⃣  Installing frontend dependencies:');
  if (!runCommand('pnpm install --frozen-lockfile', frontendDir)) {
    console.error('❌ Dependency installation failed');
    process.exit(1);
  }
  
  // Test 4: Run the actual build (with fallback like Amplify)
  console.log('\n4️⃣  Running build:');
  if (!runCommand('pnpm run build:amplify:fixed || pnpm run build', frontendDir)) {
    console.error('❌ Build failed');
    process.exit(1);
  }
  
  // Test 5: Check build output
  console.log('\n5️⃣  Checking build output:');
  const buildOutput = path.join(frontendDir, '.next');
  if (!checkFile(buildOutput)) {
    console.error('❌ Build output missing');
    process.exit(1);
  }
  
  console.log('\n✅ All tests passed! The build configuration should work on Amplify.');
  console.log('\n🚀 Next steps:');
  console.log('1. Commit and push changes');
  console.log('2. Monitor Amplify deployment');
  
  console.log('\n📋 Commands to deploy:');
  console.log('git add .');
  console.log('git commit -m "fix(amplify): critical build fixes - Node 20.x + removed invalid flags"');
  console.log('git push origin main');
}

if (require.main === module) {
  main();
}
