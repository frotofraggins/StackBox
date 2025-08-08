import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    message: '',
    businessType: 'law-firm'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      console.log('Form submitted:', formData)
      setSubmitStatus('success')
      setIsSubmitting(false)
      // In a real app, this would send to your backend or email service
    }, 1000)
  }

  if (submitStatus === 'success') {
    return (
      <>
        <Head>
          <title>Thank You - StackPro</title>
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              We've received your message and will get back to you within 24 hours.
            </p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Contact Us - StackPro | Get Demo & Support</title>
        <meta name="description" content="Get in touch with StackPro for demos, support, or questions. Email: support@stackpro.io. Professional business tools for law firms, real estate, and consultants." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="nav-link">Features</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/law-firms" className="nav-link">Use Cases</Link>
              <Link href="/contact" className="nav-active">Support</Link>
            </nav>
            <Link href="/pricing" className="btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-light mb-4">
              Let's Build Your Stack
            </h1>
            <p className="text-xl text-text-light/80 mb-8">
              Get a personalized demo, ask questions, or request support. 
              We're here to help your business succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">📧</span>
                <a href="mailto:support@stackpro.io" className="text-accent hover:text-accent/80 font-semibold">
                  support@stackpro.io
                </a>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">⚡</span>
                <span className="text-text-light/70">Response within 24 hours</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Sales Inquiries */}
              <div className="card animate-fade-in text-center">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-xl font-semibold text-text-light mb-3">Sales Inquiries</h3>
                <p className="text-text-secondary mb-4">
                  Ready to get started? Want to see a live demo? Let's talk about your needs.
                </p>
                <a href="mailto:sales@stackpro.io" className="text-primary hover:text-primary-hover font-semibold">
                  sales@stackpro.io
                </a>
              </div>

              {/* Technical Support */}
              <div className="card animate-fade-in text-center">
                <div className="text-4xl mb-4">🛠️</div>
                <h3 className="text-xl font-semibold text-text-light mb-3">Technical Support</h3>
                <p className="text-text-secondary mb-4">
                  Need help with your account? Having technical issues? We're here to help.
                </p>
                <a href="mailto:support@stackpro.io" className="text-primary hover:text-primary-hover font-semibold">
                  support@stackpro.io
                </a>
              </div>

              {/* General Questions */}
              <div className="card animate-fade-in text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-text-light mb-3">General Questions</h3>
                <p className="text-text-secondary mb-4">
                  Have questions about features, pricing, or how StackPro works?
                </p>
                <a href="mailto:info@stackpro.io" className="text-primary hover:text-primary-hover font-semibold">
                  info@stackpro.io
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-3xl mx-auto">
              <div className="card-glass">
                <h2 className="text-2xl font-bold text-text-light mb-6 text-center">
                  Send Us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="form-label">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="businessName" className="form-label">
                        Business Name
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Smith & Associates Law"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="form-label">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="john@smithlaw.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="form-label">
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="law-firm">Law Firm</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="consulting">Consulting</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="form-label">
                      How can we help you? *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="form-textarea"
                      placeholder="I'm interested in learning more about StackPro for my law firm. We currently use multiple tools and are looking for an integrated solution..."
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`btn-large ${
                        isSubmitting
                          ? 'btn-disabled'
                          : 'btn-primary'
                      }`}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Calendar Booking Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Schedule a Live Demo
              </h2>
              <p className="text-xl text-text-secondary">
                See StackPro in action with a personalized 30-minute demo
              </p>
            </div>

            <div className="card-glass">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl font-semibold text-text-light mb-4">
                    What you'll see in the demo:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-text-secondary">Complete CRM and case management system</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-text-secondary">Secure client portal and file sharing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-text-secondary">Professional website customization</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-text-secondary">Integration options and workflows</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-text-secondary">Pricing and implementation timeline</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="bg-primary/10 rounded-lg p-6 mb-6">
                    <div className="text-4xl mb-3">📅</div>
                    <h4 className="text-lg font-semibold text-text-light mb-2">
                      Book Your Demo
                    </h4>
                    <p className="text-text-secondary text-sm">
                      Choose a time that works for you
                    </p>
                  </div>
                  
                  {/* In a real app, this would be a Calendly embed or similar */}
                  <button 
                    onClick={() => alert('This would open a calendar booking widget (like Calendly) in a real app')}
                    className="btn-primary btn-large"
                  >
                    Schedule Demo Call
                  </button>
                  
                  <p className="text-text-muted text-sm mt-3">
                    30 minutes • No obligation • Free consultation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-surface">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Common Questions
              </h2>
            </div>

            <div className="space-y-6">
              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  How quickly can I get set up?
                </h3>
                <p className="text-text-secondary">
                  Most clients are up and running within 24-48 hours. The initial setup takes about 20 minutes, and we handle all the technical configuration for you.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Do you provide training?
                </h3>
                <p className="text-text-secondary">
                  Yes! All plans include onboarding training. Business and Enterprise plans get personalized training sessions with your team.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  Can you migrate my existing data?
                </h3>
                <p className="text-text-secondary">
                  Absolutely. Our team will help migrate your customer data, files, and other important information from your current systems at no extra charge.
                </p>
              </div>

              <div className="card animate-fade-in">
                <h3 className="text-lg font-semibold text-text-light mb-2">
                  What if I need custom features?
                </h3>
                <p className="text-text-secondary">
                  Enterprise plans include custom feature development. For other plans, we evaluate custom requests and often add popular features to the platform for all users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-text-light/80 mb-8">
              Join hundreds of businesses already using StackPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn-accent btn-large">
                Start Free Trial
              </Link>
              <button 
                onClick={() => alert('This would open a calendar booking widget')}
                className="btn-glass btn-large"
              >
                Schedule Demo
              </button>
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
              <div className="mt-4">
                <a href="mailto:support@stackpro.io" className="text-blue-400 hover:text-blue-300">
                  support@stackpro.io
                </a>
              </div>
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
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:sales@stackpro.io" className="hover:text-white">Sales</a></li>
                <li><a href="mailto:support@stackpro.io" className="hover:text-white">Support</a></li>
                <li><a href="mailto:info@stackpro.io" className="hover:text-white">General</a></li>
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
