import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import BusinessTypeStep from '../../components/onboarding/steps/BusinessTypeStep'
import ConnectorsStep from '../../components/onboarding/steps/ConnectorsStep'
import EmailStep from '../../components/onboarding/steps/EmailStep'
import ConsentStep from '../../components/onboarding/steps/ConsentStep'
import ReviewStep from '../../components/onboarding/steps/ReviewStep'
import { 
  getOnboardingProgress, 
  saveOnboardingProgress, 
  clearOnboardingProgress,
  type OnboardingData 
} from '../../lib/onboarding'

const STEPS = [
  { id: 'business-type', title: 'Business Type', component: BusinessTypeStep },
  { id: 'connectors', title: 'Data Connectors', component: ConnectorsStep },
  { id: 'email', title: 'Email Setup', component: EmailStep },
  { id: 'consent', title: 'Data Consent', component: ConsentStep },
  { id: 'review', title: 'Review & Finish', component: ReviewStep }
]

export default function OnboardingV2() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
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
  })
  const [loading, setLoading] = useState(true)

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = getOnboardingProgress()
    if (savedProgress) {
      setData(savedProgress)
      // Find the furthest incomplete step
      const lastCompletedStep = findLastCompletedStep(savedProgress)
      setCurrentStep(Math.min(lastCompletedStep + 1, STEPS.length - 1))
    }
    setLoading(false)
  }, [])

  // Auto-save progress whenever data changes
  useEffect(() => {
    if (!loading) {
      saveOnboardingProgress(data)
    }
  }, [data, loading])

  const findLastCompletedStep = (data: OnboardingData): number => {
    if (!data.businessType) return -1
    if (data.connectors.length === 0) return 0
    // Email step is optional - check if we have either email config or skip flag
    if (!data.emailConfiguration) return 1
    if (!data.consentSettings) return 2
    return 3
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
        router.push('/dashboard?onboarding=complete')
      } else {
        // Graceful degradation - still mark as complete locally
        console.warn('Onboarding API unavailable, saved locally')
        router.push('/dashboard?onboarding=complete')
      }
    } catch (error) {
      console.warn('Onboarding completion failed:', error)
      // Still proceed to dashboard
      router.push('/dashboard?onboarding=complete')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center">
        <div className="loading-spinner-enhanced"></div>
      </div>
    )
  }

  const CurrentStepComponent = STEPS[currentStep].component

  return (
    <>
      <Head>
        <title>Get Started - StackPro</title>
        <meta name="description" content="Complete your StackPro onboarding to get started" />
      </Head>

      <div className="min-h-screen bg-[color:var(--bg)]">
        {/* Header */}
        <header className="nav-enhanced">
          <div className="container-enhanced">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-[color:var(--logo-color)]">
                  StackPro
                </h1>
                <span className="text-[color:var(--muted)] text-sm">Setup Wizard</span>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-[color:var(--muted)] hover:text-[color:var(--fg)] text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
          <div className="container-enhanced py-4">
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

        {/* Main Content */}
        <main className="container-enhanced py-8">
          <div className="max-w-2xl mx-auto">
            <div className="card-enhanced p-8">
              {currentStep === STEPS.length - 1 ? (
                <ReviewStep
                  data={data}
                  onComplete={handleStepComplete}
                  onBack={goBack}
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
          </div>
        </main>

        {/* Resume Helper */}
        {findLastCompletedStep(data) >= 0 && !data.completed && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-[color:var(--accent)] text-white px-4 py-2 rounded-lg shadow-lg text-sm">
              Progress auto-saved • Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
