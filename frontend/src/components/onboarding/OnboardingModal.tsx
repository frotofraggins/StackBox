import { useState, useEffect } from 'react'
import BusinessTypeStep from './steps/BusinessTypeStep'
import ConnectorsStep from './steps/ConnectorsStep'
import ConsentStep from './steps/ConsentStep'
import ReviewStep from './steps/ReviewStep'
import { 
  getOnboardingProgress, 
  saveOnboardingProgress, 
  clearOnboardingProgress,
  type OnboardingData 
} from '../../lib/onboarding'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialData?: OnboardingData
}

const STEPS = [
  { id: 'business-type', title: 'Business Type', component: BusinessTypeStep },
  { id: 'connectors', title: 'Data Connectors', component: ConnectorsStep },
  { id: 'consent', title: 'Data Consent', component: ConsentStep },
  { id: 'review', title: 'Review & Finish', component: ReviewStep }
]

export default function OnboardingModal({ isOpen, onClose, initialData }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(
    initialData || {
      businessType: '',
      businessSize: '',
      industry: '',
      connectors: [],
      consentSettings: {
        analytics: false,
        marketing: false,
        personalization: false
      },
      completed: false
    }
  )
  const [loading, setLoading] = useState(true)

  // Load saved progress on open
  useEffect(() => {
    if (isOpen) {
      const savedProgress = getOnboardingProgress()
      if (savedProgress && !initialData) {
        setData(savedProgress)
        // Find the furthest incomplete step
        const lastCompletedStep = findLastCompletedStep(savedProgress)
        setCurrentStep(Math.min(lastCompletedStep + 1, STEPS.length - 1))
      }
      setLoading(false)
    }
  }, [isOpen, initialData])

  // Auto-save progress whenever data changes
  useEffect(() => {
    if (!loading && isOpen) {
      saveOnboardingProgress(data)
    }
  }, [data, loading, isOpen])

  const findLastCompletedStep = (data: OnboardingData): number => {
    if (!data.businessType) return -1
    if (data.connectors.length === 0) return 0
    if (!data.consentSettings) return 1
    return 2
  }

  const handleStepComplete = (stepData: Partial<OnboardingData>) => {
    const newData = { ...data, ...stepData }
    setData(newData)
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleFinish = async () => {
    try {
      const finalData = { ...data, completed: true }
      setData(finalData)
      saveOnboardingProgress(finalData)

      // Mock API call - will degrade gracefully if backend unavailable
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      })

      if (response.ok) {
        clearOnboardingProgress()
        onClose()
        // Refresh the page to show updated dashboard
        window.location.reload()
      } else {
        // Graceful degradation - still mark as complete locally
        console.warn('Onboarding API unavailable, saved locally')
        onClose()
        window.location.reload()
      }
    } catch (error) {
      console.warn('Onboarding completion failed:', error)
      // Still proceed
      onClose()
      window.location.reload()
    }
  }

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= findLastCompletedStep(data) + 1) {
      setCurrentStep(stepIndex)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    // Save progress before closing
    saveOnboardingProgress(data)
    onClose()
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[color:var(--bg)] rounded-lg p-8">
          <div className="loading-spinner-enhanced"></div>
        </div>
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[color:var(--bg)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--border)]">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-[color:var(--fg)]">
              Complete Your Setup
            </h1>
            <span className="text-[color:var(--muted)] text-sm">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-[color:var(--muted)] hover:text-[color:var(--fg)] p-2 rounded-lg hover:bg-[color:var(--surface)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(index)}
                    disabled={index > findLastCompletedStep(data) + 1}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      index === currentStep 
                        ? 'bg-[color:var(--secondary)] text-white' 
                        : index <= findLastCompletedStep(data)
                        ? 'text-[color:var(--secondary)] hover:bg-[color:var(--surface)]'
                        : 'text-[color:var(--muted)] cursor-not-allowed'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      index <= findLastCompletedStep(data)
                        ? 'bg-[color:var(--accent)] text-white'
                        : index === currentStep
                        ? 'bg-white text-[color:var(--secondary)]'
                        : 'bg-[color:var(--border)] text-[color:var(--muted)]'
                    }`}>
                      {index <= findLastCompletedStep(data) ? '✓' : index + 1}
                    </span>
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className="w-8 h-px bg-[color:var(--border)] mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === STEPS.length - 1 ? (
            <ReviewStep
              data={data}
              onComplete={handleStepComplete}
              onBack={currentStep > 0 ? goBack : undefined}
              onFinish={handleFinish}
            />
          ) : (
            <CurrentStepComponent
              data={data}
              onComplete={handleStepComplete}
              onBack={currentStep > 0 ? goBack : undefined}
            />
          )}
        </div>

        {/* Auto-save indicator */}
        {findLastCompletedStep(data) >= 0 && !data.completed && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-[color:var(--accent)] text-white px-3 py-1 rounded-lg shadow-lg text-xs">
              Auto-saved
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
