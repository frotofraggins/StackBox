import { useState } from 'react'
import { OnboardingData } from '../../../lib/onboarding'

interface Props {
  data: OnboardingData
  onComplete: (stepData: Partial<OnboardingData>) => void
  onBack?: () => void
}

const CONNECTORS = [
  { 
    id: 'google-analytics', 
    name: 'Google Analytics', 
    icon: '📊', 
    description: 'Website traffic and user behavior insights',
    category: 'Analytics'
  },
  { 
    id: 'salesforce', 
    name: 'Salesforce', 
    icon: '☁️', 
    description: 'CRM data and sales pipeline insights',
    category: 'CRM'
  },
  { 
    id: 'hubspot', 
    name: 'HubSpot', 
    icon: '🧲', 
    description: 'Marketing automation and lead tracking',
    category: 'CRM'
  },
  { 
    id: 'stripe', 
    name: 'Stripe', 
    icon: '💳', 
    description: 'Payment processing and revenue analytics',
    category: 'Finance'
  },
  { 
    id: 'mailchimp', 
    name: 'Mailchimp', 
    icon: '📧', 
    description: 'Email marketing campaigns and engagement',
    category: 'Marketing'
  },
  { 
    id: 'shopify', 
    name: 'Shopify', 
    icon: '🛒', 
    description: 'E-commerce store and product analytics',
    category: 'E-commerce'
  },
  { 
    id: 'quickbooks', 
    name: 'QuickBooks', 
    icon: '📚', 
    description: 'Financial data and accounting insights',
    category: 'Finance'
  },
  { 
    id: 'slack', 
    name: 'Slack', 
    icon: '💬', 
    description: 'Team communication and productivity metrics',
    category: 'Productivity'
  }
]

export default function ConnectorsStep({ data, onComplete, onBack }: Props) {
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>(data.connectors || [])

  const toggleConnector = (connectorId: string) => {
    setSelectedConnectors(prev => 
      prev.includes(connectorId)
        ? prev.filter(id => id !== connectorId)
        : [...prev, connectorId]
    )
  }

  const handleContinue = () => {
    onComplete({ connectors: selectedConnectors })
  }

  const categories = Array.from(new Set(CONNECTORS.map(c => c.category)))

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--fg)] mb-2">
          Connect your data sources
        </h2>
        <p className="text-[color:var(--muted)] max-w-md mx-auto">
          Select the services you use. We'll help you connect them later to unlock powerful insights.
        </p>
      </div>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-[color:var(--fg)] uppercase tracking-wider">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONNECTORS.filter(c => c.category === category).map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => toggleConnector(connector.id)}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 text-left transition-all ${
                    selectedConnectors.includes(connector.id)
                      ? 'border-[color:var(--secondary)] bg-[color:var(--secondary)]/5'
                      : 'border-[color:var(--border)] hover:border-[color:var(--secondary)]/50'
                  }`}
                >
                  <span className="text-xl">{connector.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[color:var(--fg)]">{connector.name}</div>
                    <div className="text-sm text-[color:var(--muted)] mt-1">{connector.description}</div>
                  </div>
                  {selectedConnectors.includes(connector.id) && (
                    <div className="w-5 h-5 rounded-full bg-[color:var(--secondary)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedConnectors.length > 0 && (
        <div className="bg-[color:var(--surface)] p-4 rounded-lg border border-[color:var(--border)]">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-[color:var(--accent)] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[color:var(--fg)]">
                {selectedConnectors.length} connector{selectedConnectors.length !== 1 ? 's' : ''} selected
              </h4>
              <p className="text-sm text-[color:var(--muted)] mt-1">
                Don't worry if you don't see your service listed. You can add custom integrations later.
              </p>
            </div>
          </div>
        </div>
      )}

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
          Continue to Consent Settings
        </button>
      </div>
    </div>
  )
}
