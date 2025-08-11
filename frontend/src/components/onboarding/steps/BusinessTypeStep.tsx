import { useState } from 'react'
import { OnboardingData } from '../../../lib/onboarding'
import { trackUserAction } from '../../../lib/telemetry'

interface Props {
  data: OnboardingData
  onComplete: (stepData: Partial<OnboardingData>) => void
  onBack?: () => void
}

const BUSINESS_TYPES = [
  { id: 'law-firm', label: 'Law Firm', icon: '⚖️', description: 'Legal services and practice management' },
  { id: 'consulting', label: 'Consulting', icon: '💼', description: 'Professional advisory services' },
  { id: 'agency', label: 'Agency', icon: '🎯', description: 'Marketing, advertising, or creative agency' },
  { id: 'saas', label: 'SaaS', icon: '💻', description: 'Software as a Service company' },
  { id: 'ecommerce', label: 'E-commerce', icon: '🛍️', description: 'Online retail or marketplace' },
  { id: 'other', label: 'Other', icon: '🏢', description: 'Other business type' }
]

const BUSINESS_SIZES = [
  { id: 'solo', label: 'Solo (1 person)', description: 'Individual practitioner' },
  { id: 'small', label: 'Small (2-10)', description: 'Small team or practice' },
  { id: 'medium', label: 'Medium (11-50)', description: 'Growing business' },
  { id: 'large', label: 'Large (50+)', description: 'Established organization' }
]

const INDUSTRIES = [
  'Legal Services', 'Technology', 'Healthcare', 'Finance', 'Real Estate', 
  'Marketing', 'Education', 'Manufacturing', 'Retail', 'Hospitality', 'Other'
]

export default function BusinessTypeStep({ data, onComplete }: Props) {
  const [businessType, setBusinessType] = useState(data.businessType || '')
  const [businessSize, setBusinessSize] = useState(data.businessSize || '')
  const [industry, setIndustry] = useState(data.industry || '')

  const canContinue = businessType && businessSize && industry

  const handleContinue = () => {
    if (canContinue) {
      // Track onboarding step completion
      trackUserAction('onboarding_step_complete', {
        step: 'business_type',
        businessType,
        businessSize,
        industry
      })
      
      onComplete({ businessType, businessSize, industry })
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--fg)] mb-2">
          Tell us about your business
        </h2>
        <p className="text-[color:var(--muted)] max-w-md mx-auto">
          This helps us customize your experience and show relevant insights
        </p>
      </div>

      {/* Business Type Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[color:var(--fg)]">
          What type of business do you run?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setBusinessType(type.id)}
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 text-left transition-all ${
                businessType === type.id
                  ? 'border-[color:var(--secondary)] bg-[color:var(--secondary)]/5'
                  : 'border-[color:var(--border)] hover:border-[color:var(--secondary)]/50'
              }`}
            >
              <span className="text-xl">{type.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[color:var(--fg)]">{type.label}</div>
                <div className="text-sm text-[color:var(--muted)] mt-1">{type.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Business Size Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[color:var(--fg)]">
          How many people work at your business?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUSINESS_SIZES.map((size) => (
            <button
              key={size.id}
              onClick={() => setBusinessSize(size.id)}
              className={`flex items-center justify-between p-4 rounded-lg border-2 text-left transition-all ${
                businessSize === size.id
                  ? 'border-[color:var(--secondary)] bg-[color:var(--secondary)]/5'
                  : 'border-[color:var(--border)] hover:border-[color:var(--secondary)]/50'
              }`}
            >
              <div>
                <div className="font-medium text-[color:var(--fg)]">{size.label}</div>
                <div className="text-sm text-[color:var(--muted)] mt-1">{size.description}</div>
              </div>
              {businessSize === size.id && (
                <div className="w-5 h-5 rounded-full bg-[color:var(--secondary)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Industry Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[color:var(--fg)]">
          What industry are you in?
        </label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--secondary)] focus:border-transparent"
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Continue Button */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            canContinue
              ? 'bg-[color:var(--secondary)] text-white hover:bg-[color:var(--secondary)]/90'
              : 'bg-[color:var(--border)] text-[color:var(--muted)] cursor-not-allowed'
          }`}
        >
          Continue to Data Connectors
        </button>
      </div>
    </div>
  )
}
