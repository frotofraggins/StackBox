# Onboarding V2 - 4-Step Wizard

A comprehensive user onboarding experience with auto-save, resume functionality, and both full-page and modal implementations.

## Overview

The Onboarding V2 system guides new users through a 4-step setup process:

1. **Business Type** - Collects business information
2. **Data Connectors** - Selects integration services  
3. **Data Consent** - Privacy and personalization preferences
4. **Review & Finish** - Summary and completion

## Features

- **Auto-save Progress** - Uses localStorage to persist data between sessions
- **Resume Capability** - Users can continue where they left off
- **Dual Implementation** - Both full-page (`/onboarding/v2`) and modal versions
- **Graceful Degradation** - Works offline with mock data preview
- **Flag-gated** - Controlled by `ONBOARDING_V2_ENABLED` environment variable

## Files Structure

```
frontend/src/
├── pages/onboarding/v2.tsx              # Full-page wizard
├── components/onboarding/
│   ├── OnboardingModal.tsx              # Modal version
│   └── steps/
│       ├── BusinessTypeStep.tsx         # Step 1: Business info
│       ├── ConnectorsStep.tsx           # Step 2: Data sources
│       ├── ConsentStep.tsx              # Step 3: Privacy settings
│       └── ReviewStep.tsx               # Step 4: Review & finish
├── lib/onboarding.ts                   # Utilities & localStorage
└── pages/api/onboarding/preview.ts     # Mock data endpoint
```

## Environment Variables

```bash
# Feature flag (default: false)
ONBOARDING_V2_ENABLED=false

# Free tier mode (affects preview data)
NEXT_PUBLIC_FREE_TIER=true

# Data lake capability (affects degraded mode)
CAP_DATALAKE_ENABLED=false
```

## Usage

### Full Page Version

```typescript
// Direct URL access
window.location.href = '/onboarding/v2'
```

### Modal Version

```typescript
import OnboardingModal from '../components/onboarding/OnboardingModal'

function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowOnboarding(true)}>
        Complete Setup
      </button>
      
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  )
}
```

### Check if User Should See Onboarding

```typescript
import { shouldShowOnboarding, isOnboardingComplete } from '../lib/onboarding'

// In a React component or page
useEffect(() => {
  if (shouldShowOnboarding()) {
    setShowOnboardingModal(true)
  }
}, [])

// Check completion status
const userHasCompletedOnboarding = isOnboardingComplete()
```

## Data Structure

```typescript
interface OnboardingData {
  businessType: string          // 'law-firm', 'consulting', etc.
  businessSize: string          // 'solo', 'small', 'medium', 'large'
  industry: string              // 'Legal Services', 'Technology', etc.
  connectors: string[]          // ['google-analytics', 'salesforce', ...]
  consentSettings: {
    analytics: boolean          // Usage analytics consent
    marketing: boolean          // Marketing communications
    personalization: boolean    // Personalized experience
  }
  completed: boolean
  startedAt?: string           // ISO timestamp
  completedAt?: string         // ISO timestamp
}
```

## API Endpoints

### Preview Data
- **POST** `/api/onboarding/preview`
- Returns customized sample data based on user selections
- Always returns `degraded: true` in free tier mode
- Customizes data based on business type and selected connectors

### Complete Onboarding
- **POST** `/api/onboarding/complete`
- Saves final onboarding data
- Currently a no-op (graceful degradation)

## How to Toggle the Feature

### Global Toggle (All Users)

```bash
# In .env.local or deployment environment
ONBOARDING_V2_ENABLED=true
```

### Per-Tenant Toggle (Future Enhancement)

```typescript
// In tenant-specific flags (when implemented)
const flags = getTenantFlags(tenantId)
const showOnboarding = flags.ONBOARDING_V2_ENABLED
```

### Dashboard Integration

Add to dashboard when flag is enabled:

```typescript
// In dashboard page
import { shouldShowOnboarding } from '../lib/onboarding'
import OnboardingModal from '../components/onboarding/OnboardingModal'

function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  
  useEffect(() => {
    // Show onboarding CTA if enabled and not completed
    if (process.env.NEXT_PUBLIC_ONBOARDING_V2_ENABLED === 'true' && 
        shouldShowOnboarding()) {
      // Show subtle CTA or auto-open modal
      setShowModal(true)
    }
  }, [])

  return (
    <div>
      {/* Dashboard content */}
      
      {/* Onboarding CTA (when enabled) */}
      {process.env.NEXT_PUBLIC_ONBOARDING_V2_ENABLED === 'true' && 
       !isOnboardingComplete() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900">Complete Your Setup</h3>
          <p className="text-blue-700 text-sm mt-1">
            Get personalized insights by completing your business profile.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Get Started →
          </button>
        </div>
      )}
      
      <OnboardingModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}
```

## Testing

### Local Testing

1. Enable the feature:
   ```bash
   echo "ONBOARDING_V2_ENABLED=true" >> frontend/.env.local
   ```

2. Clear any existing onboarding data:
   ```javascript
   // In browser console
   localStorage.removeItem('stackpro_onboarding_progress')
   localStorage.removeItem('stackpro_onboarding_dismissed')
   ```

3. Visit `/onboarding/v2` or trigger the modal

### Screenshots

- **Step 1**: Business type selection with icons and descriptions
- **Step 2**: Connector grid organized by category (Analytics, CRM, Finance, etc.)
- **Step 3**: Privacy toggles with detailed explanations
- **Step 4**: Configuration summary with sample data preview

## Technical Notes

- **Storage**: Uses localStorage with key `stackpro_onboarding_progress`
- **Auto-save**: Saves progress after each step completion
- **Resume Logic**: Automatically detects incomplete steps and resumes
- **Error Handling**: Graceful degradation if APIs are unavailable
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Future Enhancements

- Backend persistence instead of localStorage only
- Real-time connector validation
- Step-specific analytics tracking
- Dynamic step ordering based on business type
- Integration with actual data source APIs
- A/B testing for different onboarding flows
