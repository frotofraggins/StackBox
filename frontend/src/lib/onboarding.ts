export interface ConsentSettings {
  analytics: boolean
  marketing: boolean
  personalization: boolean
}

export interface EmailConfiguration {
  emailFeatures: string[]
  domainChoice?: 'bring' | 'buy' | 'stackpro'
  customDomain?: string
  mode?: 'delegated-subdomain' | 'full-zone'
  forwardTo?: string
  domainSetup?: {
    setupId: string
    domain: string
    status: string
    dnsRecords: any[]
    nextSteps: string[]
  }
  setupCompleted?: boolean
  skipEmail?: boolean
}

export interface OnboardingData {
  businessType: string
  businessSize: string
  industry: string
  connectors: string[]
  emailConfiguration?: EmailConfiguration
  consentSettings: ConsentSettings
  completed: boolean
  startedAt?: string
  completedAt?: string
}

const STORAGE_KEY = 'stackpro_onboarding_progress'

export const getOnboardingProgress = (): OnboardingData | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data = JSON.parse(stored) as OnboardingData
    
    // Validate structure
    if (!data || typeof data !== 'object') return null
    if (!data.consentSettings || typeof data.consentSettings !== 'object') return null
    
    return data
  } catch (error) {
    console.warn('Failed to load onboarding progress:', error)
    return null
  }
}

export const saveOnboardingProgress = (data: OnboardingData): void => {
  if (typeof window === 'undefined') return
  
  try {
    const dataWithTimestamp = {
      ...data,
      startedAt: data.startedAt || new Date().toISOString(),
      completedAt: data.completed ? new Date().toISOString() : undefined
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp))
  } catch (error) {
    console.warn('Failed to save onboarding progress:', error)
  }
}

export const clearOnboardingProgress = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear onboarding progress:', error)
  }
}

export const isOnboardingComplete = (): boolean => {
  const progress = getOnboardingProgress()
  return progress?.completed ?? false
}

export const shouldShowOnboarding = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check if user has explicitly dismissed onboarding
  const dismissed = localStorage.getItem('stackpro_onboarding_dismissed')
  if (dismissed) return false
  
  // Check if already completed
  if (isOnboardingComplete()) return false
  
  // Check if ONBOARDING_V2_ENABLED flag is set
  const enabled = process.env.NEXT_PUBLIC_ONBOARDING_V2_ENABLED === 'true'
  
  return enabled
}

export const dismissOnboarding = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('stackpro_onboarding_dismissed', 'true')
  } catch (error) {
    console.warn('Failed to dismiss onboarding:', error)
  }
}

// Mock data for preview when data-lake capability is disabled
export const getMockPreviewData = () => ({
  degraded: true,
  sampleData: [
    {
      source: 'Website Analytics',
      type: 'Page Views',
      count: '1,234 visits',
      trend: '+12%'
    },
    {
      source: 'Customer Database',
      type: 'Active Users',
      count: '456 users',
      trend: '+8%'
    },
    {
      source: 'Sales Pipeline',
      type: 'Opportunities',
      count: '$78,900',
      trend: '+15%'
    }
  ],
  message: 'This is sample data. Connect your actual systems to see real insights.'
})
