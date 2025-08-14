import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '../components/theme/ThemeToggle'
import Navigation from '../components/layout/Navigation'

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
        

      <Navigation currentPage="/contact" />
        <div className="min-h-screen bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-background rounded-lg shadow-xl p-8 text-center border border-border">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Thank You!</h1>
            <p className="text-muted mb-6">
              We've received your message and will get back to you within 24 hours.
            </p>
            <Link href="/" className="bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-semibold">
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
      <header className="bg-background/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-muted hover:text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="text-muted hover:text-primary transition-colors">Pricing</Link>
              <Link href="/industries/law-firms" className="text-muted hover:text-primary transition-colors">Use Cases</Link>
              <Link href="/contact" className="text-primary font-semibold">Support</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/pricing" className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition-all font-semibold">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Let's Build Your Stack
            </h1>
            <p className="text-xl text-white/80 mb-8">
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
                <span className="text-white/70">Response within 24 hours</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Sales Inquiries */}
              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Sales Inquiries</h3>
                <p className="text-muted mb-4">
                  Ready to get started? Want to see a live demo? Let's talk about your needs.
                </p>
                <a href="mailto:sales@stackpro.io" className="text-primary hover:text-secondary font-semibold">
                  sales@stackpro.io
                </a>
              </div>

              {/* Technical Support */}
              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-4xl mb-4">🛠️</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Technical Support</h3>
                <p className="text-muted mb-4">
                  Need help with your account? Having technical issues? We're here to help.
                </p>
                <a href="mailto:support@stackpro.io" className="text-primary hover:text-secondary font-semibold">
                  support@stackpro.io
                </a>
              </div>

              {/* General Questions */}
              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">General Questions</h3>
                <p className="text-muted mb-4">
                  Have questions about features, pricing, or how StackPro works?
                </p>
                <a href="mailto:info@stackpro.io" className="text-primary hover:text-secondary font-semibold">
                  info@stackpro.io
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-background rounded-lg shadow-lg p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Send Us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="John Smith"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-foreground mb-2">
                        Business Name
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Smith & Associates Law"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="john@smithlaw.com"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessType" className="block text-sm font-medium text-foreground mb-2">
                      Business Type
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="law-firm">Law Firm</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="consulting">Consulting</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      How can we help you? *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-vertical"
                      placeholder="I'm interested in learning more about StackPro for my law firm. We currently use multiple tools and are looking for an integrated solution..."
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
                        isSubmitting
                          ? 'bg-muted/40 text-muted cursor-not-allowed'
                          : 'bg-primary text-white hover:opacity-90'
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
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Schedule a Live Demo
              </h2>
              <p className="text-xl text-muted">
                See StackPro in action with a personalized 30-minute demo
              </p>
            </div>

            <div className="bg-background rounded-lg shadow-lg p-8 border border-border">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    What you'll see in the demo:
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-muted">Complete CRM and case management system</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-muted">Secure client portal and file sharing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-muted">Professional website customization</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-muted">Integration options and workflows</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-success mr-3 mt-0.5">✓</span>
                      <span className="text-muted">Pricing and implementation timeline</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="bg-primary/10 rounded-lg p-6 mb-6 border border-primary/20">
                    <div className="text-4xl mb-3">📅</div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      Book Your Demo
                    </h4>
                    <p className="text-muted text-sm">
                      Choose a time that works for you
                    </p>
                  </div>
                  
                  {/* In a real app, this would be a Calendly embed or similar */}
                  <button 
                    onClick={() => alert('This would open a calendar booking widget (like Calendly) in a real app')}
                    className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg"
                  >
                    Schedule Demo Call
                  </button>
                  
                  <p className="text-muted text-sm mt-3">
                    30 minutes • No obligation • Free consultation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Common Questions
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-background rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  How quickly can I get set up?
                </h3>
                <p className="text-muted">
                  Most clients are up and running within 24-48 hours. The initial setup takes about 20 minutes, and we handle all the technical configuration for you.
                </p>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Do you provide training?
                </h3>
                <p className="text-muted">
                  Yes! All plans include onboarding training. Business and Enterprise plans get personalized training sessions with your team.
                </p>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Can you migrate my existing data?
                </h3>
                <p className="text-muted">
                  Absolutely. Our team will help migrate your customer data, files, and other important information from your current systems at no extra charge.
                </p>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  What if I need custom features?
                </h3>
                <p className="text-muted">
                  Enterprise plans include custom feature development. For other plans, we evaluate custom requests and often add popular features to the platform for all users.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join hundreds of businesses already using StackPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg">
                Start Free Trial
              </Link>
              <button 
                onClick={() => alert('This would open a calendar booking widget')}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all text-lg"
              >
                Schedule Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">StackPro</div>
              <p className="text-white/70">
                Professional business tools in minutes, not months.
              </p>
              <div className="mt-4">
                <a href="mailto:support@stackpro.io" className="text-accent hover:text-accent/80">
                  support@stackpro.io
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Use Cases</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/law-firms" className="text-white/70 hover:text-white transition-colors">Law Firms</Link></li>
                <li><Link href="/industries/law-firms" className="text-white/70 hover:text-white transition-colors">Real Estate</Link></li>
                <li><Link href="/industries/agencies" className="text-white/70 hover:text-white transition-colors">Consulting</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:sales@stackpro.io" className="text-white/70 hover:text-white transition-colors">Sales</a></li>
                <li><a href="mailto:support@stackpro.io" className="text-white/70 hover:text-white transition-colors">Support</a></li>
                <li><a href="mailto:info@stackpro.io" className="text-white/70 hover:text-white transition-colors">General</a></li>
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
