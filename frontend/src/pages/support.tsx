import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { Mail, MessageCircle, Phone, Clock, HelpCircle, FileText, Video, Search } from 'lucide-react'

export default function Support() {
  const [activeCategory, setActiveCategory] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')

  const supportCategories = [
    { id: 'getting-started', name: 'Getting Started', icon: HelpCircle },
    { id: 'billing', name: 'Billing & Plans', icon: FileText },
    { id: 'technical', name: 'Technical Support', icon: MessageCircle },
    { id: 'integrations', name: 'Integrations', icon: Video },
  ]

  const faqs = {
    'getting-started': [
      {
        question: 'How quickly can I get my StackPro setup running?',
        answer: 'Most customers are fully operational within 20 minutes of signing up! Our automated provisioning creates your CRM, file portal, and professional website instantly. You\'ll receive an email with all your login credentials and setup instructions.'
      },
      {
        question: 'What\'s included in my free 7-day trial?',
        answer: 'Your free trial includes full access to all features in your selected plan - CRM, file sharing, website, email setup, and more. No credit card required to start, and you can upgrade or cancel anytime during the trial.'
      },
      {
        question: 'Do I need technical skills to use StackPro?',
        answer: 'Not at all! StackPro is designed for non-technical business owners. Everything is pre-configured and ready to use. We also provide setup assistance and training videos to get you started quickly.'
      },
      {
        question: 'Can I use my own domain name?',
        answer: 'Yes! Business and Enterprise plans include custom domain integration. We\'ll help you set up yourcompany.com to work with all your StackPro tools. Starter plans get a professional subdomain like yourcompany.stackpro.io.'
      }
    ],
    'billing': [
      {
        question: 'How does billing work?',
        answer: 'You\'re billed monthly or annually depending on your choice. All plans include a 7-day free trial. You can upgrade, downgrade, or cancel anytime from your dashboard. No long-term contracts required.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and ACH/bank transfers for annual plans. All payments are processed securely through Stripe.'
      },
      {
        question: 'Can I get a refund if I\'m not satisfied?',
        answer: 'Yes! We offer a 30-day money-back guarantee. If you\'re not completely satisfied, contact our support team and we\'ll process a full refund, no questions asked.'
      },
      {
        question: 'Do you offer discounts for annual plans?',
        answer: 'Absolutely! Annual plans save you 2 months (17% discount). Plus, we offer special pricing for nonprofits, startups, and multi-location businesses. Contact us for custom pricing.'
      }
    ],
    'technical': [
      {
        question: 'Is my data secure and backed up?',
        answer: 'Yes! All data is encrypted in transit and at rest, hosted on enterprise-grade AWS infrastructure with 99.9% uptime. We perform daily backups and can restore your data anytime.'
      },
      {
        question: 'Can I export my data if I need to leave?',
        answer: 'Of course! You own all your data. We provide easy export tools for contacts, files, emails, and all your content in standard formats (CSV, PDF, etc.). No vendor lock-in.'
      },
      {
        question: 'How do I integrate with other tools I use?',
        answer: 'StackPro includes API access and integrations with popular tools like Google Workspace, Microsoft 365, QuickBooks, and more. Enterprise plans include custom integrations.'
      },
      {
        question: 'What if I need help setting something up?',
        answer: 'Our support team provides free setup assistance! Business and Enterprise customers get priority support and can schedule one-on-one setup calls with our specialists.'
      }
    ],
    'integrations': [
      {
        question: 'Does StackPro integrate with Google Workspace?',
        answer: 'Yes! We have seamless integration with Gmail, Google Calendar, Google Drive, and Google Contacts. Your existing Google workflows will work perfectly with StackPro.'
      },
      {
        question: 'Can I connect my accounting software?',
        answer: 'Absolutely. StackPro integrates with QuickBooks, Xero, and other popular accounting platforms to sync invoices, payments, and client information automatically.'
      },
      {
        question: 'What about social media and marketing tools?',
        answer: 'StackPro connects with Facebook, LinkedIn, Mailchimp, HubSpot, and other marketing platforms to streamline your marketing workflows and track lead sources.'
      },
      {
        question: 'Do you have a mobile app?',
        answer: 'Yes! StackPro works perfectly on mobile browsers, and we have native iOS and Android apps for Business and Enterprise plans. Manage your business from anywhere.'
      }
    ]
  }

  const contactMethods = [
    {
      method: 'Email Support',
      description: 'Get help via email',
      contact: 'support@stackpro.io',
      responseTime: '2-4 hours',
      availability: '24/7',
      icon: Mail,
      color: 'blue'
    },
    {
      method: 'Live Chat',
      description: 'Chat with our team',
      contact: 'Available in dashboard',
      responseTime: 'Immediate',
      availability: '9 AM - 6 PM EST',
      icon: MessageCircle,
      color: 'green'
    },
    {
      method: 'Phone Support',
      description: 'Call for urgent issues',
      contact: '(555) 123-STACK',
      responseTime: 'Immediate',
      availability: 'Business & Enterprise only',
      icon: Phone,
      color: 'purple'
    }
  ]

  return (
    <>
      <Head>
        <title>Support Center - StackPro | Get Help With Your Business Platform</title>
        <meta name="description" content="Get help with StackPro. Find answers to common questions, contact support, and access training resources for your business platform." />
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
              <Link href="/features" className="nav-link">Features</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/law-firms" className="nav-link">Use Cases</Link>
              <Link href="/support" className="nav-active">Support</Link>
            </nav>
            <Link href="/" className="text-text-light/80 hover:text-text-light">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-light mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-text-light/80 mb-8">
              Find answers, get support, and learn how to get the most out of StackPro
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-10 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Get in Touch
              </h2>
              <p className="text-xl text-text-secondary">
                Choose the support method that works best for you
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => {
                const Icon = method.icon
                const colorClasses = {
                  blue: 'text-primary bg-primary/10 border-primary/20',
                  green: 'text-success bg-success/10 border-success/20', 
                  purple: 'text-accent bg-accent/10 border-accent/20'
                }
                
                return (
                  <div key={index} className="card animate-fade-in text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${colorClasses[method.color]}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-light mb-2">{method.method}</h3>
                    <p className="text-text-secondary mb-4">{method.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="text-text-secondary"><strong>Contact:</strong> {method.contact}</div>
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="h-4 w-4 text-text-muted" />
                        <span className="text-text-secondary"><strong>Response:</strong> {method.responseTime}</span>
                      </div>
                      <div className="text-text-secondary"><strong>Available:</strong> {method.availability}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-text-secondary">
                Quick answers to common questions
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {supportCategories.map((category) => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-surface text-text-light hover:bg-surface-light'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </button>
                )
              })}
            </div>

            {/* FAQ Content */}
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {faqs[activeCategory]?.map((faq, index) => (
                  <div key={index} className="card animate-fade-in">
                    <h3 className="text-lg font-semibold text-text-light mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Additional Resources
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Video Tutorials</h3>
                <p className="text-gray-600 mb-4">Step-by-step video guides for getting the most out of StackPro</p>
                <Link href="/tutorials" className="text-blue-600 hover:text-blue-700 font-medium">
                  Watch Tutorials →
                </Link>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Documentation</h3>
                <p className="text-gray-600 mb-4">Detailed guides and API documentation for advanced users</p>
                <Link href="/docs" className="text-green-600 hover:text-green-700 font-medium">
                  Read Docs →
                </Link>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community</h3>
                <p className="text-gray-600 mb-4">Connect with other StackPro users and share best practices</p>
                <Link href="/community" className="text-purple-600 hover:text-purple-700 font-medium">
                  Join Community →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Still need help?
              </h2>
              <p className="text-xl text-blue-100">
                Can't find what you're looking for? Send us a message and we'll get back to you quickly.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <form className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your question or issue in detail..."
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Send Message
                  </button>
                </div>
              </form>
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
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/support" className="text-blue-400">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="mailto:support@stackpro.io" className="hover:text-white">support@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white">Cookies</Link></li>
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
