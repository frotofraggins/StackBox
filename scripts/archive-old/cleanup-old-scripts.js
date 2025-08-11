#!/usr/bin/env node

/**
 * Script Cleanup Utility
 * Identifies and removes old/unused scripts to clean up the project
 */

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = 'scripts';

// Scripts to KEEP (current architecture)
const KEEP_SCRIPTS = [
  // Core E2E & Testing
  'e2e-test-suite.js',
  'test-dataset-ingestion.js',
  
  // Cross-Account Architecture (newly created)
  'cleanup-wrong-account-resources.js',
  'deploy-cross-account.sh',
  'deploy-to-correct-account.js',
  'verify-correct-aws-account.js',
  'manual-cleanup-commands.sh',
  
  // Current Infrastructure
  'setup-sandbox-dns.js',
  'setup-sandbox-email-forwarding.js',
  
  // Local Development
  'start-local-dev.sh',
  'start-local-dev.bat', 
  'stop-local-dev.bat',
  
  // SQL
  'sql/',
  
  // Production Health
  'production-health-check.js',
  'cost-sanity-check.js'
];

// Scripts to REMOVE (legacy/deprecated)
const REMOVE_SCRIPTS = [
  // Legacy Email Forwarder Variants
  'email-forwarder.js',
  'lambda-email-forwarder.js', 
  'deploy-clean-email-forwarder.js',
  'deploy-lambda-email-forwarder.js',
  'setup-email-forwarding-for-validation.js',
  'setup-improvmx-email-forwarding.js',
  'setup-ses-certificate-validation.js',
  'setup-simple-ses-forwarding.js',
  
  // Legacy Deployment Variants  
  'deploy-amplify-cli.js',
  'deploy-amplify-hosting.js',
  'deploy-amplify-production.js',
  'deploy-amplify-sandbox.js',
  'deploy-free-tier-mode.js',
  'deploy-full-production.js',
  'deploy-production-all.js',
  'deploy-abuse-protection-phase1.js',
  
  // Legacy Infrastructure Setup
  'setup-messaging-infrastructure.js',
  'setup-messaging-infrastructure-v3.js',
  'setup-ai-infrastructure.js',
  'setup.js',
  
  // Domain/Brand Scripts (no longer needed)
  'check-brand-domains.js',
  'find-perfect-domain.js',
  'transfer-domain-to-stackbox.js',
  
  // Legacy Test Scripts (replaced by E2E)
  'test-ai-system.js',
  'test-deployment.js',
  'test-messaging-system.js', 
  'test-site-builder.js',
  'test-stripe-endpoints.js',
  'test-stripe-integration.js',
  'test-trial.js',
  'sandbox-health-tests.js',
  'quick-test.js',
  
  // Analysis/Audit (one-time use)
  'analyze-code-architecture.js',
  'analyze-file-usage.js',
  'audit-aws-resources.js',
  'check-project-errors.js',
  
  // Miscellaneous Legacy
  'create-amplify-app-simple.js',
  'fix-ssl-certificate.js',
  'request-production-ssl.js',
  'validate-sandbox-dns.js'
];

function cleanupScripts() {
  console.log('🧹 Cleaning up old/unused scripts...\n');
  
  const scriptsPath = path.join(process.cwd(), SCRIPTS_DIR);
  const allFiles = fs.readdirSync(scriptsPath);
  
  const cleanupResults = {
    timestamp: new Date().toISOString(),
    kept: [],
    removed: [],
    unknown: [],
    errors: []
  };
  
  // Create archive directory for removed scripts
  const archivePath = path.join(scriptsPath, 'archive-old');
  if (!fs.existsSync(archivePath)) {
    fs.mkdirSync(archivePath, { recursive: true });
    console.log('📁 Created archive directory: scripts/archive-old/');
  }
  
  for (const file of allFiles) {
    const filePath = path.join(scriptsPath, file);
    const stat = fs.statSync(filePath);
    
    // Skip directories (except the archive we just created)
    if (stat.isDirectory() && file !== 'archive-old') {
      if (KEEP_SCRIPTS.includes(file + '/')) {
        console.log(`✅ Keeping directory: ${file}/`);
        cleanupResults.kept.push(file + '/');
      } else {
        console.log(`📁 Directory ${file}/ - skipping (manual review needed)`);
        cleanupResults.unknown.push(file + '/');
      }
      continue;
    }
    
    if (KEEP_SCRIPTS.includes(file)) {
      console.log(`✅ Keeping: ${file}`);
      cleanupResults.kept.push(file);
    } else if (REMOVE_SCRIPTS.includes(file)) {
      try {
        // Move to archive instead of deleting
        const archiveFilePath = path.join(archivePath, file);
        fs.renameSync(filePath, archiveFilePath);
        console.log(`🗑️  Archived: ${file} → archive-old/${file}`);
        cleanupResults.removed.push(file);
      } catch (error) {
        console.log(`❌ Error archiving ${file}: ${error.message}`);
        cleanupResults.errors.push({ file, error: error.message });
      }
    } else {
      console.log(`❓ Unknown script: ${file} (manual review needed)`);
      cleanupResults.unknown.push(file);
    }
  }
  
  // Summary
  console.log('\n📋 Cleanup Summary:');
  console.log(`   ✅ Kept: ${cleanupResults.kept.length} files`);
  console.log(`   🗑️  Archived: ${cleanupResults.removed.length} files`);
  console.log(`   ❓ Unknown: ${cleanupResults.unknown.length} files`);
  console.log(`   ❌ Errors: ${cleanupResults.errors.length} errors`);
  
  if (cleanupResults.unknown.length > 0) {
    console.log('\n❓ Files needing manual review:');
    cleanupResults.unknown.forEach(file => console.log(`   - ${file}`));
  }
  
  if (cleanupResults.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    cleanupResults.errors.forEach(err => console.log(`   - ${err.file}: ${err.error}`));
  }
  
  // Save results
  fs.writeFileSync('scripts-cleanup-results.json', JSON.stringify(cleanupResults, null, 2));
  console.log('\n💾 Results saved to: scripts-cleanup-results.json');
  
  // Create updated scripts README
  const scriptsReadme = `# Scripts Directory

## 🎯 Current Active Scripts

### Core Testing & Deployment
- \`e2e-test-suite.js\` - Comprehensive E2E test framework
- \`test-dataset-ingestion.js\` - Dataset ingestion capability testing

### Cross-Account Architecture
- \`deploy-cross-account.sh\` - One-command cross-account deployment
- \`deploy-to-correct-account.js\` - Cross-account setup utility
- \`verify-correct-aws-account.js\` - Account verification system
- \`cleanup-wrong-account-resources.js\` - Wrong account cleanup
- \`manual-cleanup-commands.sh\` - Generated cleanup commands

### Infrastructure Setup
- \`setup-sandbox-dns.js\` - DNS setup for sandbox environment
- \`setup-sandbox-email-forwarding.js\` - Email forwarding setup

### Local Development
- \`start-local-dev.sh\` / \`start-local-dev.bat\` - Start local development
- \`stop-local-dev.bat\` - Stop local development

### Operations
- \`production-health-check.js\` - Production health monitoring
- \`cost-sanity-check.js\` - AWS cost monitoring

### Database
- \`sql/\` - SQL scripts and database setup

## 🗄️ Archived Scripts

Legacy and deprecated scripts have been moved to \`archive-old/\` directory.
These scripts are kept for reference but should not be used in current deployments.

### Archive Categories:
- **Legacy Email Variants**: Multiple email forwarder implementations (consolidated)
- **Legacy Deployment Variants**: Multiple deployment approaches (replaced by cross-account)
- **Legacy Infrastructure**: Old setup scripts (replaced by current architecture)
- **Legacy Tests**: Individual test scripts (replaced by E2E suite)
- **Domain/Brand Scripts**: Domain-related utilities (no longer needed)
- **Analysis Scripts**: One-time analysis utilities

## 🔄 Usage

### Run E2E Tests
\`\`\`bash
node scripts/e2e-test-suite.js
\`\`\`

### Deploy to Correct Account
\`\`\`bash
# Setup infrastructure profile first
aws configure --profile infrastructure

# Deploy everything
./scripts/deploy-cross-account.sh
\`\`\`

### Clean Up Wrong Account
\`\`\`bash
# Review what will be deleted
node scripts/cleanup-wrong-account-resources.js

# Execute cleanup (PERMANENT!)
./scripts/manual-cleanup-commands.sh
\`\`\`

### Local Development
\`\`\`bash
# Start local development
./scripts/start-local-dev.sh

# Stop local development (Windows)
./scripts/stop-local-dev.bat
\`\`\`
`;

  fs.writeFileSync(path.join(SCRIPTS_DIR, 'README.md'), scriptsReadme);
  console.log('📖 Created scripts/README.md with current script documentation');
  
  return cleanupResults;
}

// Run cleanup
if (require.main === module) {
  cleanupScripts();
}

module.exports = { cleanupScripts };
