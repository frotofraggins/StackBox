import { useState, useEffect } from 'react'
import { OnboardingData, getMockPreviewData } from '../../../lib/onboarding'

interface Props {
  data: OnboardingData
  onComplete: (stepData: Partial<OnboardingData>) => void
  onBack?: () => void
  onFinish?: () => void
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  'law-firm': 'Law Firm',
  'consulting': 'Consulting',
  'agency': 'Agency',
  'saas': 'SaaS',
  'ecommerce': 'E-commerce',
  'other': 'Other'
}

const BUSINESS_SIZE_LABELS: Record<string, string> = {
  'solo': 'Solo (1 person)',
  'small': 'Small (2-10)',
  'medium': 'Medium (11-50)',
  'large': 'Large (50+)'
}

export default function ReviewStep({ data, onBack, onFinish }: Props) {
  const [previewData, setPreviewData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate loading preview data
    const loadPreview = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/onboarding/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          const result = await response.json()
          setPreviewData(result)
        } else {
          // Fallback to mock data if API unavailable
          setPreviewData(getMockPreviewData())
        }
      } catch (error) {
        // Graceful degradation - show mock data
        setPreviewData(getMockPreviewData())
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [data])

  const connectorNames = data.connectors.map(id => {
    const connectorMap: Record<string, string> = {
      'google-analytics': 'Google Analytics',
      'salesforce': 'Salesforce',
      'hubspot': 'HubSpot',
      'stripe': 'Stripe',
      'mailchimp': 'Mailchimp',
      'shopify': 'Shopify',
      'quickbooks': 'QuickBooks',
      'slack': 'Slack'
    }
    return connectorMap[id] || id
  })

  const enabledConsents = Object.entries(data.consentSettings)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => {
      const labels: Record<string, string> = {
        analytics: 'Analytics & Performance',
        marketing: 'Marketing Communications',
        personalization: 'Personalized Experience'
      }
      return labels[key] || key
    })

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--fg)] mb-2">
          You're all set!
        </h2>
        <p className="text-[color:var(--muted)] max-w-md mx-auto">
          Review your setup and get a preview of what's coming next
        </p>
      </div>

      {/* Configuration Summary */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Profile */}
          <div className="card-enhanced p-6">
            <h3 className="font-semibold text-[color:var(--fg)] mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-[color:var(--secondary)] text-white flex items-center justify-center text-sm mr-3">
                1
              </span>
              Business Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Type:</span>
                <span className="text-[color:var(--fg)]">{BUSINESS_TYPE_LABELS[data.businessType]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Size:</span>
                <span className="text-[color:var(--fg)]">{BUSINESS_SIZE_LABELS[data.businessSize]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[color:var(--muted)]">Industry:</span>
                <span className="text-[color:var(--fg)]">{data.industry}</span>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="card-enhanced p-6">
            <h3 className="font-semibold text-[color:var(--fg)] mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-[color:var(--secondary)] text-white flex items-center justify-center text-sm mr-3">
                2
              </span>
              Data Sources
            </h3>
            <div className="space-y-2">
              {connectorNames.length > 0 ? (
                connectorNames.map((name, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-2 h-2 rounded-full bg-[color:var(--accent)] mr-2"></div>
                    <span className="text-[color:var(--fg)]">{name}</span>
                  </div>
                ))
              ) : (
                <div className="text-[color:var(--muted)] text-sm">
                  No connectors selected - you can add them later
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="card-enhanced p-6">
          <h3 className="font-semibold text-[color:var(--fg)] mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-[color:var(--secondary)] text-white flex items-center justify-center text-sm mr-3">
              3
            </span>
            Email Setup
          </h3>
          <div className="space-y-3 text-sm">
            {data.emailConfiguration?.skipEmail ? (
              <div className="text-[color:var(--muted)]">
                Email setup skipped - you can configure this later
              </div>
            ) : data.emailConfiguration ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted)]">Features:</span>
                  <span className="text-[color:var(--fg)]">
                    {data.emailConfiguration.emailFeatures.length > 0
                      ? data.emailConfiguration.emailFeatures.join(', ')
                      : 'None selected'
                    }
                  </span>
                </div>
                {data.emailConfiguration.domainChoice && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--muted)]">Domain:</span>
                    <span className="text-[color:var(--fg)]">
                      {data.emailConfiguration.domainChoice === 'bring' 
                        ? `Custom: ${data.emailConfiguration.customDomain || 'Not specified'}`
                        : data.emailConfiguration.domainChoice === 'buy'
                        ? 'Buy new domain'
                        : 'StackPro subdomain'
                      }
                    </span>
                  </div>
                )}
                {data.emailConfiguration.setupCompleted && (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-[color:var(--accent)] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[color:var(--accent)]">DNS setup completed</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-[color:var(--muted)]">
                No email configuration
              </div>
            )}
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="card-enhanced p-6">
          <h3 className="font-semibold text-[color:var(--fg)] mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-[color:var(--secondary)] text-white flex items-center justify-center text-sm mr-3">
              4
            </span>
            Privacy Preferences
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {enabledConsents.length > 0 ? (
              enabledConsents.map((consent, index) => (
                <div key={index} className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-[color:var(--accent)] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[color:var(--fg)]">{consent}</span>
                </div>
              ))
            ) : (
              <div className="text-[color:var(--muted)] text-sm col-span-3">
                All privacy options disabled - you can enable them later
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="card-enhanced p-6">
        <h3 className="font-semibold text-[color:var(--fg)] mb-4">
          What's next: Your personalized dashboard
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading-spinner-enhanced"></div>
          </div>
        ) : previewData ? (
          <div className="space-y-4">
            {previewData.degraded && (
              <div className="bg-[color:var(--surface)] p-3 rounded-lg border border-[color:var(--border)] text-sm text-[color:var(--muted)]">
                {previewData.message}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {previewData.sampleData.map((item: any, index: number) => (
                <div key={index} className="bg-[color:var(--surface)] p-4 rounded-lg border border-[color:var(--border)]">
                  <div className="text-xs text-[color:var(--muted)] mb-1">{item.source}</div>
                  <div className="font-semibold text-[color:var(--fg)]">{item.count}</div>
                  <div className="text-xs text-[color:var(--muted)] mt-1">{item.type}</div>
                  <div className={`text-xs mt-1 ${item.trend.startsWith('+') ? 'text-[color:var(--accent)]' : 'text-red-500'}`}>
                    {item.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg font-medium text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={onFinish}
          className="px-8 py-3 rounded-lg font-medium bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90 transition-all text-lg"
        >
          Complete Setup
        </button>
      </div>
    </div>
  )
}
