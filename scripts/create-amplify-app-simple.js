#!/usr/bin/env node

/**
 * Create Simple Amplify Hosting App (No GitHub Connection)
 * You'll connect GitHub manually in the console
 */

const { AmplifyClient, CreateAppCommand } = require('@aws-sdk/client-amplify');

async function createSimpleAmplifyApp() {
  console.log('🚀 Creating Simple Amplify App...\n');
  
  const amplify = new AmplifyClient({
    region: 'us-west-2'  // Profile will be used from environment
  });

  try {
    console.log('📱 Creating Amplify App (no GitHub connection)...');
    const createAppCommand = new CreateAppCommand({
      name: 'StackPro-Frontend',
      description: 'StackPro Frontend - Connect GitHub manually',
      platform: 'WEB',
      environmentVariables: {
        'AMPLIFY_MONOREPO_APP_ROOT': 'frontend'
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
      - frontend/.next/cache/**/*`
    });

    const appResult = await amplify.send(createAppCommand);
    const appId = appResult.app.appId;
    
    console.log('✅ Amplify App Created Successfully!');
    console.log(`📱 App Name: StackPro-Frontend`);
    console.log(`🔗 App ID: ${appId}`);
    console.log(`📊 Account: 304052673868 (Stackbox)`);
    console.log(`🌐 Console URL: https://us-west-2.console.aws.amazon.com/amplify/home?region=us-west-2#/${appId}`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. 🌐 Go to AWS Amplify Console (link above)');
    console.log('2. 🔗 Click "Connect branch" in the app');
    console.log('3. 📁 Select GitHub → frotofraggins/StackBox');
    console.log('4. 🌿 Choose "main" branch');
    console.log('5. 📂 Set root directory to "frontend"');
    console.log('6. ✅ Click "Save and deploy"');
    
    console.log('\n🎉 Your app will now appear in the Amplify Console!');
    
    return appId;
    
  } catch (error) {
    console.error('❌ Error creating Amplify app:', error);
    throw error;
  }
}

if (require.main === module) {
  createSimpleAmplifyApp()
    .then((appId) => {
      console.log(`\n✅ Success! App ID: ${appId}`);
      console.log('🌐 Check Amplify Console to connect GitHub!');
    })
    .catch((error) => {
      console.error('❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createSimpleAmplifyApp };
