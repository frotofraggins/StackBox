import { useState } from 'react'
import { OnboardingData, ConsentSettings } from '../../../lib/onboarding'

interface Props {
  data: OnboardingData
  onComplete: (stepData: Partial<OnboardingData>) => void
  onBack?: () => void
}

const CONSENT_OPTIONS = [
  {
    id: 'analytics' as keyof ConsentSettings,
    title: 'Analytics & Performance',
    description: 'Help us improve our service by sharing usage patterns and performance data',
    details: 'We collect anonymized data about how you use StackPro to identify popular features and areas for improvement.',
    icon: '📈',
    benefits: ['Better feature recommendations', 'Performance optimizations', 'Bug detection']
  },
  {
    id: 'marketing' as keyof ConsentSettings,
    title: 'Marketing Communications',
    description: 'Receive personalized tips, product updates, and industry insights',
    details: 'We send curated content based on your business type and selected integrations. Unsubscribe anytime.',
    icon: '📬',
    benefits: ['Personalized tips', 'Early feature access', 'Industry insights']
  },
  {
    id: 'personalization' as keyof ConsentSettings,
    title: 'Personalized Experience',
    description: 'Customize your dashboard and recommendations based on your preferences',
    details: 'We use your business profile and usage patterns to show relevant widgets and suggestions.',
    icon: '🎯',
    benefits: ['Relevant dashboard widgets', 'Smart recommendations', 'Workflow optimization']
  }
]

export default function ConsentStep({ data, onComplete, onBack }: Props) {
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>(
    data.consentSettings || {
      analytics: false,
      marketing: false,
      personalization: false
    }
  )

  const toggleConsent = (key: keyof ConsentSettings) => {
    setConsentSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleContinue = () => {
    onComplete({ consentSettings })
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--fg)] mb-2">
          Privacy & data preferences
        </h2>
        <p className="text-[color:var(--muted)] max-w-md mx-auto">
          Control how your data is used to personalize and improve your StackPro experience
        </p>
      </div>

      <div className="space-y-6">
        {CONSENT_OPTIONS.map((option) => (
          <div
            key={option.id}
            className="border border-[color:var(--border)] rounded-lg p-6 hover:border-[color:var(--secondary)]/30 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[color:var(--fg)]">{option.title}</h3>
                    <button
                      onClick={() => toggleConsent(option.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        consentSettings[option.id]
                          ? 'bg-[color:var(--secondary)]'
                          : 'bg-[color:var(--border)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          consentSettings[option.id] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[color:var(--muted)] text-sm mt-1 mb-3">
                    {option.description}
                  </p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-[color:var(--secondary)] hover:text-[color:var(--secondary)]/80 mb-2">
                      Learn more
                    </summary>
                    <div className="space-y-2 text-[color:var(--muted)]">
                      <p>{option.details}</p>
                      <div>
                        <p className="font-medium text-[color:var(--fg)] mb-1">Benefits:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {option.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[color:var(--surface)] p-4 rounded-lg border border-[color:var(--border)]">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 rounded-full bg-[color:var(--accent)] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[color:var(--fg)]">Your privacy is protected</h4>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              All settings can be changed later in your account preferences. 
              We never sell your data and follow industry-standard security practices.
            </p>
          </div>
        </div>
      </div>

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
          onClick={handleContinue}
          className="px-6 py-3 rounded-lg font-medium bg-[color:var(--secondary)] text-white hover:bg-[color:var(--secondary)]/90 transition-all"
        >
          Continue to Review
        </button>
      </div>
    </div>
  )
}
