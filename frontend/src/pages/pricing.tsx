import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '../components/theme/ThemeToggle'

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

      {/* Header */}
      <header className="bg-[color:var(--surface)]/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-[color:var(--border)]">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--logo-color)' }}>
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-[color:var(--muted)] hover:text-[color:var(--primary)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Features</Link>
              <Link href="/pricing" className="text-[color:var(--primary)] font-semibold">Pricing</Link>
              <Link href="/law-firms" className="text-[color:var(--muted)] hover:text-[color:var(--primary)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Use Cases</Link>
              <Link href="/contact" className="text-[color:var(--muted)] hover:text-[color:var(--primary)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Support</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/" className="text-[color:var(--muted)] hover:text-[color:var(--primary)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">← Back to Home</Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 text-white shadow-[var(--shadow-2)]" style={{ background: 'var(--grad-primary)' }}>
          <div className="container-custom">
            <div className="text-center">
              <h1 className="text-h1 text-white mb-4">
                Simple Pricing. No Surprises.
              </h1>
              <p className="text-xl text-white/80 mb-8">
                Choose the plan that fits your business needs. All plans include 7-day free trial.
              </p>
              
              {/* Enhanced Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-[var(--radius)] p-1 border border-white/20">
                  <button
                    className={`px-6 py-2 rounded-[calc(var(--radius)-4px)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-[color:var(--primary)] shadow-[var(--shadow-1)]'
                        : 'text-white/80 hover:text-white'
                    }`}
                    onClick={() => setBillingPeriod('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-6 py-2 rounded-[calc(var(--radius)-4px)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] ${
                      billingPeriod === 'annual'
                        ? 'bg-white text-[color:var(--primary)] shadow-[var(--shadow-1)]'
                        : 'text-white/80 hover:text-white'
                    }`}
                    onClick={() => setBillingPeriod('annual')}
                  >
                    Annual
                    <span className="ml-2 bg-[color:var(--accent)] text-white text-xs px-2 py-1 rounded-full">
                      Save 2 months
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Pricing Cards */}
        <section className="py-16 -mt-8">
          <div className="container-custom">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, index) => {
                const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
                const monthlyPrice = billingPeriod === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice
                
                return (
                  <div
                    key={`${plan.id}-${index}`}
                    className={`bg-[color:var(--surface)] rounded-[var(--radius)] p-6 shadow-[var(--shadow-1)] border relative hover:shadow-[var(--shadow-2)] transition-all duration-[var(--dur)] ease-[var(--ease)] hover:transform hover:scale-[1.02] ${
                      plan.popular ? 'card--featured border-2' : 'border border-[color:var(--border)]'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="px-4 py-1 rounded-full text-sm font-semibold text-white shadow-[var(--shadow-1)]" style={{ background: 'var(--grad-accent)' }}>
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-[color:var(--fg)] mb-2">{plan.name}</h3>
                      <p className="text-[color:var(--muted)] mb-4">{plan.description}</p>
                      
                      <div className="mb-4">
                        <span className="price-hero text-5xl">${monthlyPrice}</span>
                        <span className="text-[color:var(--muted)] text-lg">/month</span>
                        {billingPeriod === 'annual' && (
                          <div className="text-sm font-semibold mt-2" style={{ color: 'var(--accent)' }}>
                            Billed annually (${price})
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-[color:var(--accent)] mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-[color:var(--fg)]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => {
                        console.log(`Starting trial for ${plan.name} (${plan.id}) at $${price}`)
                        handleStartTrial(plan.id, plan.name, price)
                      }}
                      className="w-full px-6 py-3 rounded-[var(--radius)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale text-white hover:opacity-90 shadow-[var(--shadow-1)] cursor-pointer"
                      style={{ background: 'var(--grad-primary)' }}
                    >
                      Start Free Trial
                    </button>
                    
                    <p className="text-center text-sm text-[color:var(--muted)] mt-3">
                      7-day free trial • No credit card required
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Enhanced Feature Comparison Table */}
        <section className="section-spacing bg-[color:var(--surface-2)]">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-[color:var(--fg)] mb-4">
                Compare Features
              </h2>
              <p className="text-xl text-[color:var(--muted)]">
                See exactly what's included in each plan
              </p>
            </div>

            <div className="bg-[color:var(--surface)] rounded-[var(--radius)] overflow-hidden border border-[color:var(--border)] shadow-[var(--shadow-1)]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[color:var(--surface-2)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[color:var(--fg)]">Features</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[color:var(--fg)]">Starter</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[color:var(--fg)]">Business</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[color:var(--fg)]">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {/* Core Features */}
                    <tr className="bg-[color:var(--accent)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--accent)] rounded-full mr-3"></div>
                        Professional Website
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                    </tr>
                    <tr className="bg-[color:var(--accent)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--accent)] rounded-full mr-3"></div>
                        CRM System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                    </tr>
                    <tr className="bg-[color:var(--accent)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--accent)] rounded-full mr-3"></div>
                        File Sharing Portal
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5">
                        <span className="chip-core">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">✓</span>
                      </td>
                    </tr>

                    {/* Business Features */}
                    <tr className="bg-[color:var(--secondary)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--secondary)] rounded-full mr-3"></div>
                        Online Booking System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5 border-l-4 border-[color:var(--primary)]">
                        <span className="chip-business">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-business">✓</span>
                      </td>
                    </tr>
                    <tr className="bg-[color:var(--secondary)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--secondary)] rounded-full mr-3"></div>
                        Email Marketing & Newsletters
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5 border-l-4 border-[color:var(--primary)]">
                        <span className="chip-business">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-business">✓</span>
                      </td>
                    </tr>
                    <tr className="bg-[color:var(--secondary)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--secondary)] rounded-full mr-3"></div>
                        Built-in Messaging System
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center bg-[color:var(--primary)]/5 border-l-4 border-[color:var(--primary)]">
                        <span className="chip-business">✓</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-business">✓</span>
                      </td>
                    </tr>

                    {/* Enterprise Features */}
                    <tr className="bg-[color:var(--warning)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--warning)] rounded-full mr-3"></div>
                        AI-Powered Business Tools
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center border-l-4 border-[color:var(--warning)]">
                        <span className="chip-enterprise">✓</span>
                      </td>
                    </tr>
                    <tr className="bg-[color:var(--warning)]/5">
                      <td className="px-6 py-4 text-sm font-semibold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--warning)] rounded-full mr-3"></div>
                        White-Label & Custom Branding
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[color:var(--muted)] font-bold text-lg">✗</span>
                      </td>
                      <td className="px-6 py-4 text-center border-l-4 border-[color:var(--warning)]">
                        <span className="chip-enterprise">✓</span>
                      </td>
                    </tr>

                    {/* Support Comparison */}
                    <tr className="bg-[color:var(--muted)]/5 border-t-2 border-[color:var(--border)]">
                      <td className="px-6 py-4 text-sm font-bold text-[color:var(--fg)] flex items-center">
                        <div className="w-2 h-2 bg-[color:var(--muted)] rounded-full mr-3"></div>
                        Support Level
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-core">Email Only</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-business">Priority 24/7</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="chip-enterprise">Phone + Dedicated</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-spacing bg-[color:var(--bg)]">
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-[color:var(--fg)] mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              <div className="card-enhanced p-6">
                <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-2">
                  Do you provide SSL certificates?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Yes! All plans include free SSL certificates and HTTPS encryption for your website and all client portals.
                </p>
              </div>

              <div className="card-enhanced p-6">
                <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-2">
                  What kind of support do you offer?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Starter plans include email support. Business plans get priority 24/7 support. Enterprise customers get phone support plus a dedicated account manager.
                </p>
              </div>

              <div className="card-enhanced p-6">
                <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-2">
                  Who owns the data?
                </h3>
                <p className="text-[color:var(--muted)]">
                  You own all your data 100%. We provide hosting and tools, but your customer data, files, and content belong entirely to you.
                </p>
              </div>

              <div className="card-enhanced p-6">
                <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Absolutely! You can cancel your subscription at any time. We'll help you export your data if you decide to leave.
                </p>
              </div>

              <div className="card-enhanced p-6">
                <h3 className="text-lg font-semibold text-[color:var(--fg)] mb-2">
                  Do you offer custom enterprise deals?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Yes! For larger organizations or unique requirements, we offer custom pricing and features. 
                  <Link href="/contact" className="text-[color:var(--primary)] hover:text-[color:var(--secondary)] ml-1 transition-colors duration-[var(--dur)] ease-[var(--ease)]">Contact us</Link> 
                  to discuss your needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-white" style={{ background: 'var(--grad-primary)' }}>
          <div className="max-w-4xl mx-auto text-center px-6 md:px-8">
            <h2 className="text-h2 text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleStartTrial('stackpro-business', 'Business', billingPeriod === 'monthly' ? 599 : 5990)}
                className="bg-[color:var(--accent)] text-white px-6 py-3 rounded-[var(--radius)] font-semibold hover:opacity-90 transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale"
              >
                Start Free Trial
              </button>
              <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-[var(--radius)] font-semibold hover:bg-white hover:text-[color:var(--primary)] transition-all duration-[var(--dur)] ease-[var(--ease)]">
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[color:var(--primary)] py-12">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">StackPro</div>
              <p className="text-white/70">
                Professional business tools in minutes, not months.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Pricing</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Use Cases</h4>
              <ul className="space-y-2">
                <li><Link href="/law-firms" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Law Firms</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Real Estate</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Consulting</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Terms</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors duration-[var(--dur)] ease-[var(--ease)]">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">&copy; 2025 StackPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
