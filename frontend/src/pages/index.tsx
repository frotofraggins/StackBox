import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import AIChatbox from '../components/AIChatbox'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Head>
        <title>StackPro - Professional Business Tools in Minutes, Not Months</title>
        <meta name="description" content="CRM, File Sharing, Website. Securely hosted on AWS. Trusted by law firms, real estate agents, and consultants." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-background/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-primary">
                StackPro
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-text-light/80 hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-text-light/80 hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="/law-firms" className="text-text-light/80 hover:text-primary transition-colors">
                Use Cases
              </Link>
              <Link href="/contact" className="text-text-light/80 hover:text-primary transition-colors">
                Support
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-text-light/80 hover:text-primary transition-colors font-medium">
                Login
              </Link>
              <Link href="/signup" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors font-semibold shadow-lg hover:shadow-xl">
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-border py-4">
              <nav className="flex flex-col space-y-4">
                <Link href="#features" className="text-text-light/80 hover:text-primary">Features</Link>
                <Link href="/pricing" className="text-text-light/80 hover:text-primary">Pricing</Link>
                <Link href="/law-firms" className="text-text-light/80 hover:text-primary">Use Cases</Link>
                <Link href="/contact" className="text-text-light/80 hover:text-primary">Support</Link>
                <Link href="/pricing" className="bg-primary text-white px-4 py-2 rounded-lg text-center hover:bg-primary-hover transition-colors">
                  Start Free Trial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="flex space-x-3">
          <Link href="/pricing" className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-center font-semibold">
            Start Trial
          </Link>
          <Link href="/contact" className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-lg text-center font-semibold">
            Book Demo
          </Link>
        </div>
      </div>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold text-text-light mb-6">
                  Professional Business Tools in{' '}
                  <span className="text-gradient-primary">Minutes</span>, Not Months
                </h1>
                <p className="text-xl text-text-light/80 mb-8">
                  CRM. File Sharing. Website. Securely hosted on AWS.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/pricing" className="btn-primary btn-large">
                    Start Free Trial
                  </Link>
                  <Link href="/contact" className="btn-secondary btn-large">
                    Book a Demo
                  </Link>
                </div>
              </div>
              
              {/* Hero Dashboard Preview */}
              <div className="lg:order-last">
                <div className="card-glass animate-fade-in">
                  <div className="bg-gradient-to-r from-primary to-accent rounded-lg p-6 text-white">
                    <h3 className="text-xl font-semibold mb-4">StackPro Dashboard</h3>
                    <div className="space-y-3">
                      <div className="bg-white bg-opacity-20 rounded p-3 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <span>📊 Customer Analytics</span>
                          <span className="text-success">↗ +24%</span>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded p-3 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <span>📁 File Portal</span>
                          <span className="text-accent">12 files</span>
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded p-3 backdrop-blur-sm">
                        <div className="flex justify-between items-center">
                          <span>🎯 CRM Tasks</span>
                          <span className="text-yellow-300">3 pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-surface py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-text-secondary mb-8">
              Trusted by businesses across law, real estate, and consulting
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded"></div>
                <span className="font-semibold text-text-light">AWS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded"></div>
                <span className="font-semibold text-text-light">Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-400 rounded"></div>
                <span className="font-semibold text-text-light">CloudFlare</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded"></div>
                <span className="font-semibold text-text-light">SOC2 Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Highlights */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Law Firms</h3>
                <p className="text-text-secondary">Secure file exchange & client portals</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Real Estate Agents</h3>
                <p className="text-text-secondary">CRM + Booking + Mobile</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Coaches & Consultants</h3>
                <p className="text-text-secondary">Payment, Scheduling, Communication</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
                Everything Your Business Needs
              </h2>
              <p className="text-xl text-text-secondary">
                Professional tools that work together seamlessly
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Enterprise Security</h3>
                <p className="text-text-secondary">Bank-level encryption and SOC2-ready infrastructure</p>
              </div>
              
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">☁️</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">AWS Global Hosting</h3>
                <p className="text-text-secondary">99.99% uptime with global CDN and auto-scaling</p>
              </div>
              
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">🧾</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">CRM & Task Automation</h3>
                <p className="text-text-secondary">Manage customers, automate workflows, track deals</p>
              </div>
              
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">🗂️</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Secure File Portal</h3>
                <p className="text-text-secondary">Client file sharing with permissions and audit logs</p>
              </div>
              
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Client Analytics</h3>
                <p className="text-text-secondary">Real-time insights into customer engagement</p>
              </div>
              
              <div className="card animate-fade-in">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-3 text-text-light">Optional AI Assistant</h3>
                <p className="text-text-secondary">Smart automation and customer communication</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-text-secondary">
                Choose the plan that fits your business needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter Plan */}
              <div className="card animate-fade-in">
                <h3 className="text-2xl font-bold text-text-light mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gradient-primary">$299</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <p className="text-text-secondary mb-6">CRM, File Portal, Hosted on Shared Infrastructure</p>
                <Link href="/pricing" className="btn-primary w-full text-center">
                  Start Free Trial
                </Link>
              </div>

              {/* Business Plan */}
              <div className="card animate-fade-in border-2 border-primary relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold animate-pulse-glow">
                    Most Popular
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-text-light mb-2">Business</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gradient-primary">$599</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <p className="text-text-secondary mb-6">Dedicated Infrastructure, Branding, SSL</p>
                <Link href="/pricing" className="btn-primary w-full text-center">
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="card animate-fade-in">
                <h3 className="text-2xl font-bold text-text-light mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gradient-primary">$1,299</span>
                  <span className="text-text-secondary">/month</span>
                </div>
                <p className="text-text-secondary mb-6">Custom Domain, SLAs, Dedicated Support</p>
                <Link href="/pricing" className="btn-primary w-full text-center">
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
                Trusted by Growing Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="card animate-fade-in">
                <p className="text-text-secondary mb-4 italic">
                  "We launched our new client portal in 20 minutes and saved thousands on development costs."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-text-light">Sarah Chen</div>
                    <div className="text-sm text-text-muted">Partner, Chen & Associates Law</div>
                  </div>
                </div>
              </div>

              <div className="card animate-fade-in">
                <p className="text-text-secondary mb-4 italic">
                  "StackPro replaced 5 different tools we were paying for. Now everything works together perfectly."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-text-light">Mike Rodriguez</div>
                    <div className="text-sm text-text-muted">Agent, Premier Realty Group</div>
                  </div>
                </div>
              </div>

              <div className="card animate-fade-in">
                <p className="text-text-secondary mb-4 italic">
                  "The automated workflows have given me back 10 hours per week to focus on my clients."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-text-light">Jessica Park</div>
                    <div className="text-sm text-text-muted">Executive Coach</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-gradient-dark py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-text-light mb-4">
              Launch your business stack today. No devs required.
            </h2>
            <p className="text-xl text-text-light/80 mb-8">
              Join hundreds of businesses already using StackPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn-primary btn-large">
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn-secondary btn-large">
                Book a Demo
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
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
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

      {/* AI Chatbox */}
      <AIChatbox isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </>
  )
}
