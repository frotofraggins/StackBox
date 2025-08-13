# StackPro Complete Project Structure & Analysis

## 🎯 For AI Context: What You Need to Know

StackPro is a **Business Automation Platform** with:
- **Frontend**: Next.js/React/TypeScript with onboarding flows
- **Backend**: Node.js APIs with modular capability architecture  
- **Infrastructure**: AWS-based (SES, S3, Lambda, Amplify)
- **Architecture**: Monorepo with packages/ (client SDKs) and src/ (backend services)

## 📁 Complete Directory Structure

```
StackPro/
├── 📦 CORE APPLICATION FILES (ACTIVE)
│   ├── package.json ⭐ Main dependencies & scripts
│   ├── .env ⭐ Environment variables
│   ├── .env.sandbox ⭐ Sandbox config
│   ├── .env.dev ⭐ Dev environment
│   ├── .gitignore ⭐ Git exclusions
│   ├── .nvmrc ⭐ Node version
│   ├── .npmrc ⭐ NPM config
│   ├── README.md ⭐ Project overview
│   ├── pnpm-workspace.yaml ⭐ Monorepo config
│   ├── turbo.json ⭐ Build pipeline
│   └── amplify.yml ⭐ AWS Amplify config
│
├── 🖥️ FRONTEND APPLICATION (ACTIVE)
│   └── frontend/
│       ├── package.json ⭐ Frontend dependencies
│       ├── next.config.js ⭐ Next.js config
│       ├── tailwind.config.js ⭐ Styling config
│       ├── tsconfig.json ⭐ TypeScript config
│       ├── postcss.config.js ⭐ CSS processing
│       ├── .env.example ⭐ Env template
│       ├── .nvmrc ⭐ Node version
│       ├── Dockerfile.dev ⭐ Docker config
│       ├── Dockerfile.amplify ⭐ Amplify deploy
│       ├── public/robots.txt ⭐ SEO
│       ├── amplify/ ⭐ AWS Amplify backend
│       │   ├── backend.ts
│       │   ├── auth/resource.ts
│       │   └── data/resource.ts
│       └── src/ ⭐ MAIN FRONTEND CODE
│           ├── pages/ ⭐ Next.js pages
│           │   ├── _app.tsx ⭐ App wrapper
│           │   ├── index.tsx ⭐ Landing page
│           │   ├── features.tsx ⭐ Features page
│           │   ├── pricing.tsx ⭐ Pricing page
│           │   ├── about.tsx ⭐ About page
│           │   ├── contact.tsx ⭐ Contact page
│           │   ├── login.tsx ⭐ Login page
│           │   ├── signup.tsx ⭐ Signup page  
│           │   ├── dashboard.tsx ⭐ Main dashboard
│           │   ├── health.tsx ⭐ Health check
│           │   ├── law-firms.tsx ⭐ Industry page
│           │   ├── support.tsx ⭐ Support page
│           │   ├── terms.tsx ⭐ Legal terms
│           │   ├── privacy.tsx ⭐ Privacy policy
│           │   ├── cookie-policy.tsx ⭐ Cookie policy
│           │   ├── onboarding/v2.tsx ⭐ NEW: 5-step onboarding
│           │   ├── dashboard/website/builder.tsx ⭐ Site builder
│           │   ├── test/messaging.tsx ⭐ Messaging test
│           │   └── api/onboarding/preview.ts ⭐ Onboarding API
│           ├── components/ ⭐ React components
│           │   ├── AIChatbox.tsx ⭐ AI chat interface
│           │   ├── SignupForm.tsx ⭐ User registration
│           │   ├── theme/ ⭐ Theme system
│           │   │   ├── ThemeProvider.tsx ⭐ Theme context
│           │   │   └── ThemeToggle.tsx ⭐ Dark/light toggle
│           │   ├── onboarding/ ⭐ NEW: Complete onboarding system
│           │   │   ├── OnboardingModal.tsx ⭐ Modal wrapper
│           │   │   └── steps/ ⭐ Individual steps
│           │   │       ├── BusinessTypeStep.tsx ⭐ Step 1
│           │   │       ├── ConnectorsStep.tsx ⭐ Step 2
│           │   │       ├── EmailStep.tsx ⭐ Step 3 (NEW)
│           │   │       ├── ConsentStep.tsx ⭐ Step 4
│           │   │       └── ReviewStep.tsx ⭐ Step 5
│           │   ├── messaging/ ⭐ Chat/messaging UI
│           │   │   ├── ChatWindow.tsx
│           │   │   ├── MessageInput.tsx
│           │   │   ├── MessageList.tsx
│           │   │   ├── TypingIndicator.tsx
│           │   │   └── UserPresence.tsx
│           │   └── site-builder/ ⭐ Website builder
│           │       ├── core/
│           │       │   ├── SiteBuilder.tsx
│           │       │   ├── GrapesJSEditor.tsx
│           │       │   └── PreviewPane.tsx
│           │       ├── panels/
│           │       │   ├── AssetPanel.tsx
│           │       │   ├── SettingsPanel.tsx
│           │       │   └── ThemePanel.tsx
│           │       ├── templates/TemplateSelector.tsx
│           │       └── utils/exportToStatic.ts
│           ├── lib/ ⭐ Utilities & APIs
│           │   ├── api.ts ⭐ API client
│           │   ├── env.ts ⭐ Environment utils
│           │   ├── onboarding.ts ⭐ NEW: Onboarding state management
│           │   ├── telemetry.ts ⭐ Analytics
│           │   └── ai-docs.ts ⭐ AI document processing
│           ├── hooks/ ⭐ React hooks
│           │   ├── useNotification.ts ⭐ Notifications
│           │   └── useWebSocket.ts ⭐ Real-time connections
│           └── styles/ ⭐ Styling
│               ├── globals.css ⭐ Global styles
│               └── tokens.css ⭐ NEW: Design system tokens
│
├── ⚙️ BACKEND SERVICES (ACTIVE)
│   └── src/
│       ├── api/ ⭐ Main API server
│       │   ├── server.js ⭐ Express server
│       │   ├── server-simple.js ⭐ Minimal server
│       │   ├── logs/ ⭐ Server logs
│       │   └── routes/ ⭐ API endpoints
│       │       ├── ai.js ⭐ AI processing
│       │       ├── messaging.js ⭐ Chat/messaging
│       │       ├── site-builder.js ⭐ Website builder
│       │       ├── capabilities.js ⭐ Feature discovery
│       │       ├── audit.js ⭐ System auditing
│       │       ├── ai-docs.js ⭐ Document AI
│       │       ├── ai-gap-analysis.js ⭐ AI analysis
│       │       ├── data-lake.js ⭐ Data management
│       │       └── email-stack.js ⭐ Email services
│       ├── services/ ⭐ Business logic
│       │   ├── aws-provisioner.js ⭐ AWS infrastructure
│       │   ├── database-service.js ⭐ Database operations
│       │   ├── logger.js ⭐ Logging service
│       │   ├── stripe-service.js ⭐ Payment processing
│       │   ├── trial-manager.js ⭐ Trial management
│       │   ├── enterprise-deployer.js ⭐ Enterprise features
│       │   ├── docker-service.js ⭐ Container management
│       │   ├── acm-service.js ⭐ SSL certificates
│       │   ├── alb-service.js ⭐ Load balancer
│       │   ├── cloudfront-service.js ⭐ CDN
│       │   ├── rds-service.js ⭐ Database
│       │   ├── secrets-manager-service.js ⭐ Secrets
│       │   ├── ai/ ⭐ AI services
│       │   │   ├── claude-assistant.js ⭐ AI assistant
│       │   │   ├── document-processor.js ⭐ Document AI
│       │   │   └── embedding-service.js ⭐ Vector embeddings
│       │   ├── messaging/ ⭐ Chat/messaging backend
│       │   │   ├── messaging-service.js ⭐ Message handling
│       │   │   ├── notification-service.js ⭐ Notifications
│       │   │   └── websocket-handler.js ⭐ Real-time
│       │   └── site-builder/
│       │       └── builder-service.js ⭐ Website builder logic
│       ├── utils/ ⭐ Utilities
│       │   ├── crypto.js ⭐ Encryption utilities
│       │   ├── logger.js ⭐ Logging utilities
│       │   ├── simple-flags.js ⭐ Feature flags
│       │   ├── simple-discovery.js ⭐ Service discovery
│       │   ├── simple-tenant-flags.js ⭐ Tenant features
│       │   ├── email-flags.ts ⭐ Email feature flags
│       │   ├── ses-email-intake.js ⭐ Email processing
│       │   └── email-parser.js ⭐ NEW: Clean email parsing
│       ├── config/
│       │   └── validation.js ⭐ Input validation
│       └── deploy.js ⭐ Deployment script
│
├── 📦 PACKAGES (ACTIVE - Modular Architecture)
│   ├── clients/ ⭐ Frontend SDKs
│   │   ├── messaging/ ⭐ Messaging client SDK
│   │   │   ├── package.json
│   │   │   └── src/index.ts ⭐ TypeScript messaging client
│   │   ├── ai-docs/ ⭐ AI docs client SDK
│   │   │   ├── package.json
│   │   │   └── src/index.ts ⭐ Document AI client
│   │   ├── data-lake/ ⭐ Data client SDK
│   │   │   ├── package.json
│   │   │   └── src/index.ts ⭐ Data management client
│   │   └── email-stack/ ⭐ Email client SDK
│   │       ├── package.json
│   │       └── src/index.ts ⭐ Email services client
│   ├── runtime/ ⭐ Shared runtime utilities
│   │   ├── flags/ ⭐ Feature flag system
│   │   │   ├── package.json
│   │   │   └── src/
│   │   │       ├── index.ts ⭐ Main flags API
│   │   │       ├── ai-flags.ts ⭐ AI feature flags
│   │   │       └── tenant-overrides.ts ⭐ Tenant customization
│   │   ├── discovery/ ⭐ Service discovery
│   │   │   ├── package.json
│   │   │   └── src/
│   │   │       ├── index.ts ⭐ Discovery API
│   │   │       └── schema.ts ⭐ Service schemas
│   │   ├── ai-docs/ ⭐ AI document runtime
│   │   │   ├── package.json
│   │   │   ├── mappings.json ⭐ Document type mappings
│   │   │   └── connectors.json ⭐ External connectors
│   │   └── ai-gap-analysis/ ⭐ AI analysis runtime
│   │       ├── package.json
│   │       └── src/index.ts ⭐ Gap analysis engine
│   └── contracts/ ⭐ API specifications
│       ├── messaging/v1.yaml ⭐ Messaging API spec
│       ├── ai-docs/v1.yaml ⭐ AI docs API spec
│       ├── data-lake/v1.yaml ⭐ Data API spec
│       └── email-stack/v1.yaml ⭐ Email API spec
│
├── 🔧 SCRIPTS & AUTOMATION (ACTIVE)
│   └── scripts/
│       ├── setup.js ⭐ Initial project setup
│       ├── quick-test.js ⭐ Quick health check
│       ├── cost-sanity-check.js ⭐ AWS cost monitoring
│       ├── production-health-check.js ⭐ Production monitoring
│       ├── audit-aws-resources.js ⭐ Resource auditing
│       ├── analyze-file-usage.js ⭐ Code analysis
│       ├── analyze-code-architecture.js ⭐ Architecture analysis
│       ├── check-project-errors.js ⭐ Error detection
│       ├── deploy-full-production.js ⭐ Full deployment
│       ├── deploy-abuse-protection-phase1.js ⭐ Security deployment
│       ├── deploy-amplify-production.js ⭐ Amplify production
│       ├── deploy-amplify-sandbox.js ⭐ Amplify sandbox
│       ├── deploy-amplify-cli.js ⭐ Amplify CLI tools
│       ├── deploy-amplify-hosting.js ⭐ Amplify hosting
│       ├── create-amplify-app-simple.js ⭐ Amplify app creation
│       ├── deploy-lambda-email-forwarder.js ⭐ Email Lambda
│       ├── deploy-clean-email-forwarder.js ⭐ NEW: Clean email forwarding
│       ├── request-production-ssl.js ⭐ SSL certificate
│       ├── transfer-domain-to-stackbox.js ⭐ Domain management
│       ├── setup-email-forwarding-for-validation.js ⭐ Email validation
│       ├── setup-ses-certificate-validation.js ⭐ SES validation
│       ├── setup-simple-ses-forwarding.js ⭐ Simple email
│       ├── setup-improvmx-email-forwarding.js ⭐ ImprovMX integration
│       ├── validate-sandbox-dns.js ⭐ DNS validation
│       ├── setup-sandbox-dns.js ⭐ DNS setup
│       ├── test-stripe-endpoints.js ⭐ Payment testing
│       ├── test-stripe-integration.js ⭐ Payment integration
│       ├── test-deployment.js ⭐ Deployment testing
│       ├── test-messaging-system.js ⭐ Messaging tests
│       ├── test-site-builder.js ⭐ Site builder tests
│       ├── test-ai-system.js ⭐ AI system tests
│       ├── test-trial.js ⭐ Trial system tests
│       ├── start-local-dev.sh ⭐ Local dev startup (Unix)
│       ├── start-local-dev.bat ⭐ Local dev startup (Windows)
│       ├── stop-local-dev.bat ⭐ Local dev shutdown
│       └── sql/init-db.sql ⭐ Database initialization
│
├── 📧 EMAIL & LAMBDA (ACTIVE)
│   ├── lambda-email-forwarder-clean.js ⭐ NEW: Clean email Lambda
│   ├── lambda-email-forwarder-fixed.js ⭐ Fixed email Lambda
│   ├── domain_cert_validation.json ⭐ Certificate validation
│   ├── dkim-records.json ⭐ DKIM configuration
│   ├── cert-validation.json ⭐ Certificate data
│   ├── spf-record.json ⭐ SPF configuration
│   └── stackpro-email-setup.json ⭐ Email setup config
│
├── 🐳 CONTAINERIZATION (ACTIVE)
│   ├── docker/docker-compose.template.yml ⭐ Docker template
│   ├── docker-compose.dev.yml ⭐ Development containers
│   ├── src/Dockerfile.dev ⭐ Backend container
│   ├── DOCKER_SETUP_TROUBLESHOOTING.md ⭐ Docker help
│   └── LOCAL_DEVELOPMENT_GUIDE.md ⭐ Local dev guide
│
├── 🎨 TOOLS & UTILITIES (ACTIVE)
│   └── tools/
│       ├── visual-diff/ ⭐ Visual regression testing
│       │   ├── index.js ⭐ Main diff tool
│       │   ├── capture.js ⭐ Screenshot capture
│       │   └── pages.json ⭐ Pages to test
│       └── style-codemod/
│           └── replace-hardcoded-colors.mjs ⭐ Style migration
│
├── 🚦 CI/CD & POLICIES (ACTIVE)
│   ├── .github/workflows/
│   │   ├── capability-ci.yml ⭐ CI pipeline
│   │   └── cost-check.yml ⭐ Cost monitoring
│   ├── policy/default-v2.json ⭐ Security policies
│   └── .eslintrc-color-ban.cjs ⭐ Linting rules
│
├── 📚 DOCUMENTATION (MIXED - Some Active, Some Legacy)
│   └── docs/
│       ├── 🟢 CURRENT STATUS DOCS (ACTIVE)
│       │   ├── CURRENT_STATUS_AND_NEXT_STEPS.md ⭐ Current state
│       │   ├── CURRENT_STATUS.md ⭐ Status overview
│       │   ├── ONBOARDING_V2_EMAIL_INTEGRATION_COMPLETE.md ⭐ NEW
│       │   ├── EMAIL_FORWARDING_CLEAN_SOLUTION.md ⭐ NEW
│       │   └── COMPLETE_PROJECT_STRUCTURE_AND_ANALYSIS.md ⭐ NEW (this file)
│       ├── 🟡 ARCHITECTURE DOCS (ACTIVE)
│       │   ├── CAPABILITY_ARCHITECTURE.md ⭐ System architecture
│       │   ├── DESIGN_SYSTEM_TOKENIZATION_COMPLETE.md ⭐ Design system
│       │   ├── DEVELOPER_GUIDE_FRONTEND_BACKEND.md ⭐ Dev guide
│       │   └── infrastructure/INFRASTRUCTURE_OVERVIEW.md ⭐ Infrastructure
│       ├── 🟡 FEATURE DOCS (ACTIVE)
│       │   ├── features/ONBOARDING_V2.md ⭐ Onboarding system
│       │   ├── PHASE_3_0_AI_FIRST_PLATFORM_COMPLETE.md ⭐ AI platform
│       │   ├── PHASE_2_7A_EMAIL_STACK_COMPLETE.md ⭐ Email system
│       │   ├── PHASE_2_7_AI_FIRST_COMPLETION.md ⭐ AI completion
│       │   └── PHASE1_MESSAGING_CAPABILITY_COMPLETE.md ⭐ Messaging
│       ├── 🔴 DEPLOYMENT DOCS (LEGACY/OUTDATED)
│       │   ├── AWS_AMPLIFY_SANDBOX_DEPLOYMENT_GUIDE.md ❌ Outdated
│       │   ├── AMPLIFY_SANDBOX_DEPLOYMENT_STATUS.md ❌ Outdated
│       │   ├── AMPLIFY_MANUAL_COMPLETION_GUIDE.md ❌ Outdated
│       │   ├── AMPLIFY_APP_FOUND.md ❌ Outdated
│       │   ├── AMPLIFY_FINAL_STATUS.md ❌ Outdated
│       │   ├── AMPLIFY_ACCOUNT_MISMATCH_ISSUE.md ❌ Outdated
│       │   ├── DEPLOYMENT_BREAKTHROUGH_ANALYSIS.md ❌ Outdated
│       │   ├── DEPLOYMENT_OPTIONS_ANALYSIS.md ❌ Outdated
│       │   ├── DEPLOYMENT_HISTORY.md ❌ Outdated
│       │   ├── BACKEND_DEPLOYMENT_GUIDE.md ❌ Outdated
│       │   ├── BACKEND_PRODUCTION_READINESS_AUDIT.md ❌ Outdated
│       │   ├── FRONTEND_PRODUCTION_READINESS_AUDIT.md ❌ Outdated
│       │   ├── FRONTEND_API_INTEGRATION_GUIDE.md ❌ Outdated
│       │   ├── TESTING_AND_DEPLOYMENT_GUIDE.md ❌ Outdated
│       │   ├── TESTING_SETUP_GUIDE.md ❌ Outdated
│       │   ├── SIGNUP_DEPLOYMENT_TESTING_GUIDE.md ❌ Outdated
│       │   ├── VERCEL_DEPLOYMENT_VERIFICATION.md ❌ Outdated
│       │   └── PRODUCTION_DEPLOYMENT_SUMMARY_WEEK3.md ❌ Outdated
│       ├── 🔴 LEGACY DOCS (MOSTLY OUTDATED)
│       │   ├── AWS_BACKEND_READINESS_AUDIT.md ❌ Outdated
│       │   ├── AWS_DOMAIN_TRANSFER_PLAN.md ❌ Outdated
│       │   ├── AWS_ACCOUNT_ORGANIZATION_AND_S3_ANALYSIS.md ❌ Outdated
│       │   ├── AWS_RESOURCE_INVENTORY_AND_CODE_ANALYSIS.md ❌ Reference only
│       │   ├── STACKPRO_CODE_AND_INFRASTRUCTURE_ASSESSMENT.md ❌ Reference only
│       │   ├── FRONTEND_BACKEND_ARCHITECTURE_BREAKDOWN.md ❌ Reference only
│       │   ├── STACKPRO_DOMAIN_STATUS.md ❌ Outdated
│       │   ├── FREE_TIER_ABUSE_PROTECTION.md ❌ Reference only
│       │   ├── ABUSE_PROTECTION_RESOURCE_PLAN.md ❌ Reference only
│       │   ├── LAUNCH_READY_CHECKLIST.md ❌ Outdated
│       │   ├── PRE_ONBOARDING_TRIAL_SYSTEM.md ❌ Outdated
│       │   ├── FREE_TIER_MODE.md ❌ Outdated
│       │   ├── ENTERPRISE_AI_ARCHITECTURE.md ❌ Future planning
│       │   ├── ENTERPRISE_IMPLEMENTATION_ROADMAP.md ❌ Future planning
│       │   ├── EXISTING_INFRASTRUCTURE_INTEGRATION.md ❌ Reference only
│       │   ├── SECURITY_ISOLATION_ENFORCEMENT.md ❌ Reference only
│       │   ├── CLIENT_COLLABORATION_MESSAGING.md ❌ Reference only
│       │   ├── CLIENT_COLLABORATION_MESSAGING_DEPLOYMENT.md ❌ Reference only
│       │   ├── WEEK3-4_MESSAGING_COLLABORATION_ROADMAP.md ❌ Outdated
│       │   ├── DOCKER_CONTAINERIZATION_ARCHITECTURE.md ❌ Reference only
│       │   ├── BILLING_USAGE_TRACKING.md ❌ Future feature
│       │   ├── CUSTOM_DOMAIN_SSL_AUTOMATION.md ❌ Reference only
│       │   ├── SERVICE_SETUP_GUIDE.md ❌ Outdated
│       │   └── README.md ❌ Generic
│       └── 🔴 LEGACY STATE DOCS (OUTDATED)
│           └── STATE/ ❌ All outdated
│               ├── AMPLIFY_BUILD_ROOT_CAUSE.md
│               ├── AMPLIFY_BUILD_FIX_PLAN.md
│               ├── AMPLIFY_SETTINGS_CHECKLIST.md
│               ├── SUMMARY.md
│               ├── TODO.md
│               └── JOB5_FAILURE_ANALYSIS.md
│
└── 🔴 LEGACY/UNUSED FILES (CANDIDATES FOR CLEANUP)
    ├── aws-profiles-update.txt ❌ Outdated
    ├── QUICK_START_GUIDE.md ❌ Outdated  
    ├── IMPLEMENTATION_PLAN.md ❌ Outdated
    ├── UNIFIED_DIFFS.md ❌ Outdated
    ├── DOCUMENTATION_CLEANUP_PLAN.md ❌ Outdated
    ├── clear_buildspec.json ❌ Temporary file
    ├── temp_buildspec.yml ❌ Temporary file
    └── logs/ ❌ Runtime generated
        ├── combined.log
        ├── error.log
        └── sandbox-health-report.json
```

## 🎯 What An AI Needs to Know

### 1. **Current Active Architecture**
- **Frontend**: `frontend/src/` - Next.js app with onboarding, dashboard, pages
- **Backend**: `src/api/` - Express server with modular routes
- **Services**: `src/services/` - Business logic (AWS, messaging, AI, payments)
- **Packages**: `packages/` - Client SDKs and runtime utilities
- **Scripts**: `scripts/` - Deployment and maintenance automation

### 2. **Key Recent Additions** 
- **Onboarding V2**: Complete 5-step flow with email integration
- **Clean Email Forwarding**: Professional email parsing and forwarding
- **Design System**: Tokenized CSS with theme support
- **Modular Packages**: Client SDKs for messaging, AI, data, email

### 3. **Technology Stack**
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, AWS SDK
- **Database**: DynamoDB (via AWS SDK)
- **Infrastructure**: AWS (SES, S3, Lambda, Amplify)
- **Build**: Turbo (monorepo), pnpm workspaces

### 4. **Files Safe to Delete** ❌
```
docs/STATE/ (entire directory)
docs/AMPLIFY_* (most amplify docs are outdated)
docs/DEPLOYMENT_* (most deployment docs are outdated)
aws-profiles-update.txt
clear_buildspec.json
temp_buildspec.yml
QUICK_START_GUIDE.md (outdated)
IMPLEMENTATION_PLAN.md (outdated)
UNIFIED_DIFFS.md (outdated)
DOCUMENTATION_CLEANUP_PLAN.md (outdated)
logs/ (runtime generated)
```

### 5. **Core Working Files** ⭐
```
package.json - Main project config
frontend/src/ - All frontend code
src/api/ - Backend API server
src/services/ - Business logic
packages/ - Modular client SDKs
scripts/ - Automation scripts
lambda-email-forwarder-clean.js - NEW email solution
```

### 6. **Entry Points**
- **Frontend**: `npm run dev` in `frontend/`
- **Backend**: `npm run dev` in root (starts `src/api/server.js`)
- **Scripts**: Run individual scripts from `scripts/`
- **Build**: `turbo build` for full monorepo build

## 🧹 Cleanup Recommendations

1. **Delete legacy docs** in `docs/STATE/` and outdated deployment guides
2. **Remove temporary files** like `*buildspec*` and `aws-profiles-update.txt`  
3. **Consolidate similar scripts** - many deployment scripts could be unified
4. **Archive unused components** in `frontend/src/components/` if any
5. **Clean up logs** - add to `.gitignore` and clean periodically

## 📊 File Count Summary
- **Active Core Files**: ~150 files
- **Legacy/Unused Documentation**: ~50 files  
- **Temporary/Generated Files**: ~10 files
- **Total Cleanup Opportunity**: ~60 files (30% reduction)

This structure gives you a complete map of what's actually being used vs what can be cleaned up.
