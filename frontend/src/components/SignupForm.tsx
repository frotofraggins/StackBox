import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';

interface SignupFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  email: string;
  businessName: string;
  businessType: string;
  firstName: string;
  lastName: string;
  domain: string;
  useDomain: 'subdomain' | 'custom';
  features: {
    espocrm: boolean;
    nextcloud: boolean;
    calcom: boolean;
    mailtrain: boolean;
    staticSite: boolean;
    aiAssistant: boolean;
  };
}

export function SignupForm({ isOpen, onClose }: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    businessName: '',
    businessType: 'realtor',
    firstName: '',
    lastName: '',
    domain: '',
    useDomain: 'subdomain',
    features: {
      espocrm: true,
      nextcloud: true,
      calcom: false,
      mailtrain: false,
      staticSite: true,
      aiAssistant: true
    }
  });

  const businessTypes = [
    { id: 'realtor', name: 'Real Estate Agent', icon: '🏠' },
    { id: 'lawyer', name: 'Law Firm', icon: '⚖️' },
    { id: 'consultant', name: 'Consultant', icon: '💼' },
    { id: 'coach', name: 'Coach/Trainer', icon: '🎯' },
    { id: 'therapist', name: 'Therapist', icon: '🧘‍♀️' },
    { id: 'accountant', name: 'Accountant', icon: '📊' },
    { id: 'other', name: 'Other', icon: '✨' }
  ];

  const features = [
    {
      id: 'staticSite' as keyof FormData['features'],
      name: 'Professional Website',
      description: 'Mobile-responsive site with your branding',
      essential: true
    },
    {
      id: 'espocrm' as keyof FormData['features'],
      name: 'Customer CRM',
      description: 'Manage leads and track communications',
      essential: true
    },
    {
      id: 'nextcloud' as keyof FormData['features'],
      name: 'File Sharing Portal',
      description: 'Secure document sharing with clients',
      essential: true
    },
    {
      id: 'aiAssistant' as keyof FormData['features'],
      name: 'AI Assistant',
      description: '24/7 chatbot trained on your business',
      essential: false
    },
    {
      id: 'calcom' as keyof FormData['features'],
      name: 'Online Booking',
      description: 'Let clients schedule appointments',
      essential: false
    },
    {
      id: 'mailtrain' as keyof FormData['features'],
      name: 'Email Marketing',
      description: 'Send newsletters and automated sequences',
      essential: false
    }
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (featureId: keyof FormData['features']) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureId]: !prev.features[featureId]
      }
    }));
  };

  const generateSubdomain = (businessName: string) => {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
  };

  const handleStartTrial = async () => {
    setLoading(true);
    
    try {
      // Generate client configuration
      const clientConfig = {
        clientId: generateSubdomain(formData.businessName),
        email: formData.email,
        subdomain: generateSubdomain(formData.businessName),
        domain: formData.useDomain === 'custom' ? formData.domain : undefined,
        features: formData.features,
        branding: {
          companyName: formData.businessName,
          themeColor: '#1e40af'
        },
        businessType: formData.businessType,
        contactName: `${formData.firstName} ${formData.lastName}`
      };

      // Call deployment API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientConfig)
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to success page or show success message
        alert('🎉 Your trial is being deployed! You\'ll receive an email with access details in 5-15 minutes.');
        onClose();
      } else {
        throw new Error('Deployment failed');
      }
    } catch (error) {
      console.error('Trial setup error:', error);
      alert('There was an error setting up your trial. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          clientConfig: formData
        })
      });

      const session = await response.json();
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: session.id });
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('There was an error processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {step === 1 && 'Tell us about your business'}
                    {step === 2 && 'Choose your domain'}
                    {step === 3 && 'Select your tools'}
                    {step === 4 && 'Ready to launch!'}
                  </h2>
                  <div className="flex items-center mt-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full mr-2 ${
                          i <= step ? 'bg-secondary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-muted transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Step 1: Business Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Smith"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Smith Real Estate"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-3">
                        Business Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {businessTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => handleInputChange('businessType', type.id)}
                            className={`p-3 text-left border rounded-lg transition-all ${
                              formData.businessType === type.id
                                ? 'border-secondary bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <span className="text-lg mr-2">{type.icon}</span>
                            <span className="text-sm font-medium">{type.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Domain */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <p className="text-muted">
                        Choose how you'd like your website to be accessed
                      </p>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={() => handleInputChange('useDomain', 'subdomain')}
                        className={`w-full p-4 text-left border rounded-lg transition-all ${
                          formData.useDomain === 'subdomain'
                            ? 'border-secondary bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">Use Free Subdomain</h3>
                            <p className="text-sm text-muted mt-1">
                              {generateSubdomain(formData.businessName)}.allbusinesstools.com
                            </p>
                          </div>
                          <div className="text-green-600 font-semibold">FREE</div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleInputChange('useDomain', 'custom')}
                        className={`w-full p-4 text-left border rounded-lg transition-all ${
                          formData.useDomain === 'custom'
                            ? 'border-secondary bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">Use Your Own Domain</h3>
                            <p className="text-sm text-muted mt-1">
                              Connect your existing domain (e.g., yourcompany.com)
                            </p>
                          </div>
                          <div className="text-secondary font-semibold">$5/month</div>
                        </div>
                      </button>
                    </div>

                    {formData.useDomain === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                          Your Domain
                        </label>
                        <input
                          type="text"
                          value={formData.domain}
                          onChange={(e) => handleInputChange('domain', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="yourcompany.com"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Features */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <p className="text-muted">
                        Select the tools you need. You can always add more later.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {features.map((feature) => (
                        <div
                          key={feature.id}
                          className={`border rounded-lg p-4 transition-all ${
                            formData.features[feature.id]
                              ? 'border-secondary bg-blue-50'
                              : 'border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                                {feature.essential && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    Essential
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted mt-1">{feature.description}</p>
                            </div>
                            <button
                              onClick={() => !feature.essential && handleFeatureToggle(feature.id)}
                              disabled={feature.essential}
                              className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                formData.features[feature.id]
                                  ? 'bg-secondary border-secondary'
                                  : 'border-gray-300 hover:border-gray-400'
                              } ${feature.essential ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {formData.features[feature.id] && (
                                <CheckIcon className="w-4 h-4 text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Launch */}
                {step === 4 && (
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white text-3xl">🚀</span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Launch!</h3>
                      <p className="text-muted">
                        Your business stack will be deployed in 5-15 minutes. You'll receive an email with access details.
                      </p>
                    </div>

                    <div className="bg-surface-2 rounded-lg p-4 text-left">
                      <h4 className="font-semibold text-gray-900 mb-3">What you're getting:</h4>
                      <div className="space-y-2 text-sm text-muted">
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                          Website: {formData.useDomain === 'custom' ? formData.domain : `${generateSubdomain(formData.businessName)}.allbusinesstools.com`}
                        </div>
                        {Object.entries(formData.features).map(([key, enabled]) => {
                          const feature = features.find(f => f.id === key);
                          return enabled && feature ? (
                            <div key={key} className="flex items-center">
                              <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                              {feature.name}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={handleStartTrial}
                        disabled={loading}
                        className="w-full bg-secondary text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Deploying...' : 'Start Free Trial'}
                      </button>
                      
                      <button
                        onClick={() => handleUpgrade('professional')}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Upgrade to Professional ($149/month)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {step < 4 && (
                <div className="flex justify-between items-center p-6 border-t border-gray-200">
                  <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className="text-muted hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continue
                    <ArrowRightIcon className="inline w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
