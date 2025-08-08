#!/usr/bin/env node

/**
 * Deploy Amplify Hosting App to AWS Console
 * This creates the hosting app that appears in Amplify Console
 */

const { AmplifyClient, CreateAppCommand, CreateBranchCommand, CreateDeploymentCommand } = require('@aws-sdk/client-amplify');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deployAmplifyHosting() {
  console.log('🚀 Creating Amplify Hosting App in Console...\n');
  
  const amplify = new AmplifyClient({
    region: 'us-west-2',
    profile: 'Stackbox'
  });

  try {
    // 1. Create Amplify App
    console.log('📱 Creating Amplify App...');
    const createAppCommand = new CreateAppCommand({
      name: 'StackPro-Frontend',
      description: 'StackPro Frontend with Amplify Gen 2 Backend',
      repository: 'https://github.com/frotofraggins/StackBox',
      platform: 'WEB',
      environmentVariables: {
        '_LIVE_UPDATES': '[{"name":"Amplify CLI","pkg":"@aws-amplify/cli","type":"npm","version":"latest"}]',
        'AMPLIFY_MONOREPO_APP_ROOT': 'frontend',
        'AMPLIFY_DIFF_DEPLOY': 'false',
        'AMPLIFY_DIFF_DEPLOY_ROOT': 'frontend'
      },
      buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
      - frontend/.next/cache/**/*`,
      customRules: [
        {
          source: '/<*>',
          target: '/index.html',
          status: '200'
        }
      ]
    });

    const appResult = await amplify.send(createAppCommand);
    const appId = appResult.app.appId;
    
    console.log(`✅ App created! ID: ${appId}`);
    console.log(`🌐 Console: https://us-west-2.console.aws.amazon.com/amplify/home?region=us-west-2#/${appId}`);
    
    // 2. Create Main Branch
    console.log('\n🌿 Creating main branch...');
    const createBranchCommand = new CreateBranchCommand({
      appId: appId,
      branchName: 'main',
      description: 'Production branch',
      framework: 'Next.js - SSG',
      enableAutoBuild: true,
      environmentVariables: {
        'AMPLIFY_MONOREPO_APP_ROOT': 'frontend'
      }
    });

    await amplify.send(createBranchCommand);
    console.log('✅ Main branch created!');
    
    console.log('\n🎉 SUCCESS! Amplify App created in console:');
    console.log(`📱 App Name: StackPro-Frontend`);
    console.log(`🔗 App ID: ${appId}`);
    console.log(`🌐 Console URL: https://us-west-2.console.aws.amazon.com/amplify/home?region=us-west-2#/${appId}`);
    console.log(`📊 Account: 304052673868 (Stackbox)`);
    
    return appId;
    
  } catch (error) {
    console.error('❌ Error creating Amplify app:', error);
    throw error;
  }
}

if (require.main === module) {
  deployAmplifyHosting()
    .then((appId) => {
      console.log(`\n✅ Deployment complete! App ID: ${appId}`);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployAmplifyHosting };
