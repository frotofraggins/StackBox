import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import AIChatbox from '../components/AIChatbox'
import ThemeToggle from '../components/theme/ThemeToggle'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      <Head>
        <title>StackPro - Professional Business Tools in Minutes, Not Months</title>
        <meta name="description" content="Complete business platform for small businesses, contractors, and construction companies. CRM, File Sharing, Website, Project Management. Securely hosted on AWS." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-[color:var(--surface)]/95 backdrop-blur-md shadow-[var(--shadow-1)] fixed w-full top-0 z-50 border-b border-[color:var(--border)]">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--logo-color)' }}>
                StackPro
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Features
              </Link>
              <Link href="/pricing" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Pricing
              </Link>
              <Link href="/contact" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Industries
              </Link>
              <Link href="/contact" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Support
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)] font-medium">
                Login
              </Link>
              <Link href="/signup" className="text-white px-6 py-2 rounded-[var(--radius)] hover:opacity-90 transition-all duration-[var(--dur)] ease-[var(--ease)] font-semibold shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] hover-scale" style={{ background: 'var(--primary)' }}>
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
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Theme:</span>
                  <ThemeToggle />
                </div>
                <Link href="#features" className="text-muted hover:text-primary">Features</Link>
                <Link href="/pricing" className="text-muted hover:text-primary">Pricing</Link>
                <Link href="/contact" className="text-muted hover:text-primary">Industries</Link>
                <Link href="/contact" className="text-muted hover:text-primary">Support</Link>
                <Link href="/pricing" className="bg-primary text-white px-4 py-2 rounded-lg text-center hover:opacity-90 transition-all">
                  Start Free Trial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="flex space-x-3">
          <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-lg text-center font-semibold hover:opacity-90 transition-all">
            Start Trial
          </Link>
          <Link href="/contact" className="flex-1 border-2 border-primary text-primary py-3 rounded-lg text-center font-semibold hover:bg-primary hover:text-white transition-all">
            Book Demo
          </Link>
        </div>
      </div>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 text-white shadow-[var(--shadow-2)]" style={{ background: 'var(--grad-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                  Professional Business Tools in{' '}
                  <span className="text-accent">Minutes</span>, Not Months
                </h1>
                <p className="text-xl text-white/80 mb-8">
                  CRM. File Sharing. Website. Securely hosted on AWS.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/pricing" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
                    Start Free Trial
                  </Link>
                  <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all">
                    Book a Demo
                  </Link>
                </div>
              </div>
              
              {/* Hero Dashboard Preview */}
              <div className="lg:order-last">
                <div className="card fade-in-enhanced">
                  <div className="rounded-[var(--radius)] p-6 text-white shadow-[var(--shadow-2)]" style={{ background: 'var(--grad-surface)' }}>
                    <h3 className="text-xl font-semibold mb-4 text-[color:var(--brand-fg)]">StackPro Dashboard</h3>
                    <div className="space-y-3">
                      <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[calc(var(--radius)-4px)] p-3 shadow-[var(--shadow-1)]">
                        <div className="flex justify-between items-center">
                          <span className="text-[color:var(--fg)]">📊 Customer Analytics</span>
                          <span className="font-semibold" style={{ color: 'var(--card-number)' }}>↗ +24%</span>
                        </div>
                      </div>
                      <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[calc(var(--radius)-4px)] p-3 shadow-[var(--shadow-1)]">
                        <div className="flex justify-between items-center">
                          <span className="text-[color:var(--fg)]">📁 File Portal</span>
                          <span className="font-semibold" style={{ color: 'var(--card-number)' }}>12 files</span>
                        </div>
                      </div>
                      <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[calc(var(--radius)-4px)] p-3 shadow-[var(--shadow-1)]">
                        <div className="flex justify-between items-center">
                          <span className="text-[color:var(--fg)]">🎯 CRM Tasks</span>
                          <span className="font-semibold" style={{ color: 'var(--card-number)' }}>3 pending</span>
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
        <section className="bg-background py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-muted mb-8">
              Trusted by businesses across law, real estate, and consulting
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-warning rounded"></div>
                <span className="font-semibold text-foreground">AWS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-secondary rounded"></div>
                <span className="font-semibold text-foreground">Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded"></div>
                <span className="font-semibold text-foreground">CloudFlare</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-success rounded"></div>
                <span className="font-semibold text-foreground">SOC2 Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Highlights */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔨</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Construction Companies</h3>
                <p className="text-muted">Project tracking, blueprints, client communication</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Contractors & Trades</h3>
                <p className="text-muted">Estimates, invoicing, job management</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏪</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Small Businesses</h3>
                <p className="text-muted">CRM, website, payments, file sharing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Everything Your Business Needs
              </h2>
              <p className="text-xl text-muted">
                Professional tools that work together seamlessly
              </p>
            </div>

            <div className="grid-enhanced md:grid-cols-2 lg:grid-cols-3">
              <div className="card p-6">
                <div className="text-3xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">Enterprise Security</h3>
                <p className="text-[color:var(--muted)]">Bank-level encryption and SOC2-ready infrastructure</p>
              </div>
              
              <div className="card p-6">
                <div className="text-3xl mb-4">☁️</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">AWS Global Hosting</h3>
                <p className="text-[color:var(--muted)]">99.99% uptime with global CDN and auto-scaling</p>
              </div>
              
              <div className="card p-6">
                <div className="text-3xl mb-4">🧾</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">CRM & Task Automation</h3>
                <p className="text-[color:var(--muted)]">Manage customers, automate workflows, track deals</p>
              </div>
              
              <div className="card p-6">
                <div className="text-3xl mb-4">🗂️</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">Secure File Portal</h3>
                <p className="text-[color:var(--muted)]">Client file sharing with permissions and audit logs</p>
              </div>
              
              <div className="card p-6">
                <div className="text-3xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">Client Analytics</h3>
                <p className="text-[color:var(--muted)]">Real-time insights into customer engagement</p>
              </div>
              
              <div className="card p-6">
                <div className="text-3xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">Optional AI Assistant</h3>
                <p className="text-[color:var(--muted)]">Smart automation and customer communication</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-muted">
                Choose the plan that fits your business needs
              </p>
            </div>

            <div className="grid-enhanced md:grid-cols-3">
              {/* Starter Plan */}
              <div className="card p-6">
                <h3 className="text-2xl font-bold text-[color:var(--fg)] mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="price-hero text-4xl">$299</span>
                  <span className="text-[color:var(--muted)]">/month</span>
                </div>
                <p className="text-[color:var(--muted)] mb-6">CRM, File Portal, Hosted on Shared Infrastructure</p>
                <Link href="/pricing" className="w-full px-6 py-3 rounded-[var(--radius)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale text-white hover:opacity-90 shadow-[var(--shadow-1)] text-center inline-block" style={{ background: 'var(--grad-primary)' }}>
                  Start Free Trial
                </Link>
              </div>

              {/* Business Plan */}
              <div className="card--featured p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-sm font-semibold text-white shadow-[var(--shadow-1)]" style={{ background: 'var(--grad-accent)' }}>
                    Most Popular
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[color:var(--fg)] mb-2">Business</h3>
                <div className="mb-4">
                  <span className="price-hero text-4xl">$599</span>
                  <span className="text-[color:var(--muted)]">/month</span>
                </div>
                <p className="text-[color:var(--muted)] mb-6">Dedicated Infrastructure, Branding, SSL</p>
                <Link href="/pricing" className="w-full px-6 py-3 rounded-[var(--radius)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale text-white hover:opacity-90 shadow-[var(--shadow-1)] text-center inline-block" style={{ background: 'var(--grad-primary)' }}>
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="card p-6">
                <h3 className="text-2xl font-bold text-[color:var(--fg)] mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="price-hero text-4xl">$1,299</span>
                  <span className="text-[color:var(--muted)]">/month</span>
                </div>
                <p className="text-[color:var(--muted)] mb-6">Custom Domain, SLAs, Dedicated Support</p>
                <Link href="/pricing" className="w-full px-6 py-3 rounded-[var(--radius)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale text-white hover:opacity-90 shadow-[var(--shadow-1)] text-center inline-block" style={{ background: 'var(--grad-primary)' }}>
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Trusted by Growing Businesses
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-xl shadow-md border border-border">
                <p className="text-muted mb-4 italic">
                  "We launched our new client portal in 20 minutes and saved thousands on development costs."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-secondary rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Chen</div>
                    <div className="text-sm text-muted">Partner, Chen & Associates Law</div>
                  </div>
                </div>
              </div>

              <div className="bg-background p-6 rounded-xl shadow-md border border-border">
                <p className="text-muted mb-4 italic">
                  "StackPro replaced 5 different tools we were paying for. Now everything works together perfectly."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-foreground">Mike Rodriguez</div>
                    <div className="text-sm text-muted">Agent, Premier Realty Group</div>
                  </div>
                </div>
              </div>

              <div className="bg-background p-6 rounded-xl shadow-md border border-border">
                <p className="text-muted mb-4 italic">
                  "The automated workflows have given me back 10 hours per week to focus on my clients."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold text-foreground">Jessica Park</div>
                    <div className="text-sm text-muted">Executive Coach</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Launch your business stack today. No devs required.
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join hundreds of businesses already using StackPro
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all">
                Book a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12" style={{ background: 'var(--primary)' }}>
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-[color:var(--brand-fg)] mb-4">StackPro</div>
              <p className="text-white/70">
                Professional business tools in minutes, not months.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-[color:var(--brand-fg)] mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Pricing</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[color:var(--brand-fg)] mb-4">Use Cases</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Construction</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Contractors</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Small Business</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[color:var(--brand-fg)] mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Terms</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-[color:var(--brand-fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">&copy; 2025 StackPro. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chatbox */}
      <AIChatbox isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </>
  )
}
