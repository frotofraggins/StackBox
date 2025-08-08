import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  
  const plans = [
    {
      id: 'stackpro-starter',
      name: 'Starter',
      monthlyPrice: 299,
      annualPrice: 2990, // 10 months pricing
      description: 'Perfect for small businesses getting started with professional tools',
      popular: false,
      features: [
        'Professional Business Website',
        'Customer Relationship Management (CRM)',
        'Secure File Sharing Portal',
        'Custom @yourbusiness.stackpro.io Email',
        'SSL Security Certificate',
        '24/7 Hosting & Support',
        'Basic Analytics Dashboard',
        'Email Support'
      ]
    },
    {
      id: 'stackpro-business',
      name: 'Business',
      monthlyPrice: 599,
      annualPrice: 5990, // 10 months pricing
      description: 'Everything in Starter plus advanced business tools',
      popular: true,
      features: [
        'Everything in Starter Plan',
        'Online Booking & Scheduling System',
        'Email Marketing & Newsletter Tools',
        'Built-in Client Messaging System',
        'SMS & WhatsApp Integration',
        'Advanced CRM Automation',
        'Custom Domain Integration',
        'Dedicated Infrastructure',
        'Priority Support (24/7)',
        'Advanced Analytics & Reporting',
        'API Access',
        'White-Label Options'
      ]
    },
    {
      id: 'stackpro-enterprise',
      name: 'Enterprise',
      monthlyPrice: 1299,
      annualPrice: 12990, // 10 months pricing
      description: 'Complete business solution for growing companies',
      popular: false,
      features: [
        'Everything in Business Plan',
        'AI-Powered Business Tools',
        'Advanced Analytics Dashboard',
        'Multi-Location Support',
        'Custom Domain Integration',
        'Dedicated Account Manager',
        'White-Label Options',
        'SLA Guarantees (99.99% uptime)',
        'Custom Integrations',
        'Advanced Security Features',
        'Compliance Support (SOC2, HIPAA)',
        'Phone Support'
      ]
    }
  ]

  const handleStartTrial = (planId: string, planName: string, price: number) => {
    // In a real app, this would redirect to Stripe Checkout
    console.log(`Starting trial for ${planName} (${planId}) at $${price}`)
    // For now, just show an alert
    alert(`Starting free trial for ${planName}! You would be redirected to Stripe Checkout.`)
  }

  return (
    <>
      <Head>
        <title>Pricing - StackPro | Professional Business Tools</title>
        <meta name="description" content="Simple pricing for professional business tools. CRM, File Sharing, Website hosting starting at $299/month." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header - Simplified version */}
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="nav-link">Features</Link>
              <Link href="/pricing" className="nav-active">Pricing</Link>
              <Link href="/law-firms" className="nav-link">Use Cases</Link>
              <Link href="/contact" className="nav-link">Support</Link>
            </nav>
            <Link href="/" className="nav-link">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-light mb-4">
              Simple Pricing. No Surprises.
            </h1>
            <p className="text-xl text-text-light/80 mb-8">
              Choose the plan that fits your business needs. All plans include 7-day free trial.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="glass-surface rounded-lg p-1">
                <button
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    billingPeriod === 'monthly'
                      ? 'btn-primary'
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                  onClick={() => setBillingPeriod('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    billingPeriod === 'annual'
                      ? 'btn-primary'
                      : 'text-text-light/80 hover:text-text-light'
                  }`}
                  onClick={() => setBillingPeriod('annual')}
                >
                  Annual
                  <span className="ml-2 alert-success text-xs px-2 py-1 rounded-full">
                    Save 2 months
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 -mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                const monthlyPrice = billingPeriod === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
                
                return (
                  <div
                    key={plan.id}
                    className={`card-glass relative animate-fade-in ${
                      plan.popular ? 'border-2 border-primary transform scale-105 shadow-premium' : 'shadow-dark'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse-glow">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-text-light mb-2">{plan.name}</h3>
                      <p className="text-text-light/70 mb-4">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gradient-primary">${monthlyPrice}</span>
                        <span className="text-text-light/80">/month</span>
                        {billingPeriod === 'annual' && (
                          <div className="text-sm text-success font-semibold mt-2">
                            Billed annually (${price})
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-success mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-text-light/90">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleStartTrial(plan.id, plan.name, price)}
                      className={`w-full ${
                        plan.popular
                          ? 'btn-primary btn-large'
                          : 'btn-secondary btn-large'
                      }`}
                    >
                      Start Free Trial
                    </button>
                    
                    <p className="text-center text-sm text-text-light/60 mt-3">
                      7-day free trial • No credit card required
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Compare Features
              </h2>
              <p className="text-xl text-text-secondary">
                See exactly what's included in each plan
              </p>
            </div>

            <div className="card rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-light">Features</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-light">Starter</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-light">Business</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-light">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* Core Features */}
                    <tr className="bg-success/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                        Professional Website
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-success/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                        CRM System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-success/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                        File Sharing Portal
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-success/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-success rounded-full mr-3"></div>
                        SSL Certificate & Security
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>

                    {/* Business Features */}
                    <tr className="bg-primary/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        Online Booking System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10 border-l-4 border-primary">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-primary/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        Email Marketing & Newsletters
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10 border-l-4 border-primary">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-primary/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        Built-in Messaging System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10 border-l-4 border-primary">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-primary/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        SMS & WhatsApp Integration
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10 border-l-4 border-primary">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-primary/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        Custom Domain Integration
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-primary/10 border-l-4 border-primary">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>

                    {/* Enterprise Features */}
                    <tr className="bg-purple-900/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        AI-Powered Business Tools
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-l-4 border-purple-400">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-purple-900/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        White-Label & Custom Branding
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-l-4 border-purple-400">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-purple-900/10">
                      <td className="px-6 py-4 text-sm font-semibold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                        Advanced Messaging Automation
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-text-muted/20 rounded-full">
                          <span className="text-text-muted font-bold">✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center border-l-4 border-purple-400">
                        <div className="inline-flex items-center justify-center w-6 h-6 bg-success/20 rounded-full">
                          <span className="text-success font-bold">✓</span>
                        </div>
                      </td>
                    </tr>

                    {/* Support Comparison */}
                    <tr className="bg-gray-700/20 border-t-2 border-border">
                      <td className="px-6 py-4 text-sm font-bold text-text-light flex items-center">
                        <div className="w-2 h-2 bg-text-secondary rounded-full mr-3"></div>
                        Support Level
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 bg-warning/20 text-warning text-xs font-semibold rounded-full">
                          Email Only
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                          Priority 24/7
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 bg-purple-400/20 text-purple-300 text-xs font-semibold rounded-full">
                          Phone + Dedicated
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Do you provide SSL certificates?
                </h3>
                <p className="text-text-secondary">
                  Yes! All plans include free SSL certificates and HTTPS encryption for your website and all client portals.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  What kind of support do you offer?
                </h3>
                <p className="text-text-secondary">
                  Starter plans include email support. Business plans get priority 24/7 support. Enterprise customers get phone support plus a dedicated account manager.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Who owns the data?
                </h3>
                <p className="text-text-secondary">
                  You own all your data 100%. We provide hosting and tools, but your customer data, files, and content belong entirely to you.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-text-secondary">
                  Absolutely! You can cancel your subscription at any time. We'll help you export your data if you decide to leave.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Do you offer custom enterprise deals?
                </h3>
                <p className="text-text-secondary">
                  Yes! For larger organizations or unique requirements, we offer custom pricing and features. 
                  <Link href="/contact" className="text-primary hover:text-primary-hover ml-1">Contact us</Link> 
                  to discuss your needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-text-light/80 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleStartTrial('stackpro-business', 'Business', billingPeriod === 'monthly' ? 599 : 5990)}
                className="btn-accent btn-large"
              >
                Start Free Trial
              </button>
              <Link href="/contact" className="btn-glass btn-large">
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">StackPro</div>
              <p className="text-gray-400">
                Professional business tools in minutes, not months.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Use Cases</h4>
              <ul className="space-y-2">
                <li><Link href="/law-firms" className="hover:text-white">Law Firms</Link></li>
                <li><Link href="/real-estate" className="hover:text-white">Real Estate</Link></li>
                <li><Link href="/consulting" className="hover:text-white">Consulting</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>&copy; 2025 StackPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
