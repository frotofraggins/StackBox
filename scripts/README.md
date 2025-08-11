# Scripts Directory

## 🎯 Current Active Scripts

### Core Testing & Deployment
- `e2e-test-suite.js` - Comprehensive E2E test framework
- `test-dataset-ingestion.js` - Dataset ingestion capability testing

### Cross-Account Architecture
- `deploy-cross-account.sh` - One-command cross-account deployment
- `deploy-to-correct-account.js` - Cross-account setup utility
- `verify-correct-aws-account.js` - Account verification system
- `cleanup-wrong-account-resources.js` - Wrong account cleanup
- `manual-cleanup-commands.sh` - Generated cleanup commands

### Infrastructure Setup
- `setup-sandbox-dns.js` - DNS setup for sandbox environment
- `setup-sandbox-email-forwarding.js` - Email forwarding setup

### Local Development
- `start-local-dev.sh` / `start-local-dev.bat` - Start local development
- `stop-local-dev.bat` - Stop local development

### Operations
- `production-health-check.js` - Production health monitoring
- `cost-sanity-check.js` - AWS cost monitoring

### Database
- `sql/` - SQL scripts and database setup

## 🗄️ Archived Scripts

Legacy and deprecated scripts have been moved to `archive-old/` directory.
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
```bash
node scripts/e2e-test-suite.js
```

### Deploy to Correct Account
```bash
# Setup infrastructure profile first
aws configure --profile infrastructure

# Deploy everything
./scripts/deploy-cross-account.sh
```

### Clean Up Wrong Account
```bash
# Review what will be deleted
node scripts/cleanup-wrong-account-resources.js

# Execute cleanup (PERMANENT!)
./scripts/manual-cleanup-commands.sh
```

### Local Development
```bash
# Start local development
./scripts/start-local-dev.sh

# Stop local development (Windows)
./scripts/stop-local-dev.bat
```
