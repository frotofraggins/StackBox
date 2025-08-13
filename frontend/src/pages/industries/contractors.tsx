import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '../../components/theme/ThemeToggle';

export default function Contractors() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Construction Management Software | StackPro for Contractors</title>
        <meta name="description" content="Streamline your construction business with StackPro's project management, client communication, and document sharing. Built for contractors and construction companies." />
        <meta name="keywords" content="construction management software, contractor CRM, project management, construction business tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="nav-enhanced fixed w-full top-0 z-50">
        <div className="container-enhanced">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--logo-color)' }}>
                StackPro
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="nav-link-enhanced">Features</Link>
              <Link href="/pricing" className="nav-link-enhanced">Pricing</Link>
              <Link href="/industries/contractors" className="nav-link-enhanced active">Industries</Link>
              <Link href="/support" className="nav-link-enhanced">Support</Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="nav-link-enhanced">Login</Link>
              <Link href="/signup" className="btn text-white font-semibold" style={{ background: 'var(--primary)' }}>
                Start Free Trial
              </Link>
            </div>

            <button 
              className="md:hidden text-[color:var(--fg)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t" style={{ borderColor: 'var(--border)' }}>
              <nav className="flex flex-col space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-enhanced text-sm">Theme:</span>
                  <ThemeToggle />
                </div>
                <Link href="/#features" className="nav-link-enhanced">Features</Link>
                <Link href="/pricing" className="nav-link-enhanced">Pricing</Link>
                <Link href="/industries/contractors" className="nav-link-enhanced active">Industries</Link>
                <Link href="/support" className="nav-link-enhanced">Support</Link>
                <Link href="/signup" className="btn text-white font-semibold" style={{ background: 'var(--primary)' }}>
                  Start Free Trial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="section-primary py-20">
          <div className="container-enhanced text-center">
            <h1 className="text-h1-enhanced mb-6">
              Run Your Construction Business Like a Pro with StackPro
            </h1>
            <p className="text-xl text-muted-enhanced mb-8 max-w-3xl mx-auto">
              Stop juggling spreadsheets, emails, and phone calls. StackPro gives contractors project management, 
              client communication, and document sharing in one powerful platform designed for the construction industry.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn text-white font-semibold text-lg px-8 py-4" style={{ background: 'var(--primary)' }}>
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn font-semibold text-lg px-8 py-4 border-2" style={{ 
                borderColor: 'var(--primary)', 
                color: 'var(--primary)',
                background: 'transparent'
              }}>
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="section-surface py-16">
          <div className="container-enhanced">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-h2-enhanced mb-6">
                  Construction Business Challenges
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Project details scattered across multiple tools
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Clients constantly asking for project updates
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Lost photos, documents, and change orders
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Difficulty tracking project profitability
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Time wasted on administrative tasks
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-h2-enhanced mb-6">
                  StackPro's Construction Solution
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Centralized project management dashboard
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Real-time client project portals with updates
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Secure document and photo storage
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Built-in invoicing and payment tracking
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    AI assistant for project coordination
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Contractors */}
        <section className="section-surface-2 py-16">
          <div className="container-enhanced">
            <h2 className="text-h2-enhanced text-center mb-12">
              Built for Construction Professionals
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">🏗️</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Project Management
                </h3>
                <p className="text-muted-enhanced">
                  Track project timelines, milestones, and deliverables. Keep all project communication, 
                  photos, and documents organized in one place for easy access.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Client Communication
                </h3>
                <p className="text-muted-enhanced">
                  Give clients their own portal to see project progress, photos, and updates. 
                  Reduce phone calls and emails with transparent, real-time communication.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Financial Tracking
                </h3>
                <p className="text-muted-enhanced">
                  Track project costs, create professional invoices, and monitor payments. 
                  Know your profit margins on every job with built-in financial reporting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-surface py-16">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-12">
              Trusted by Construction Professionals
            </h2>
            <div className="card-enhanced p-8 max-w-4xl mx-auto">
              <blockquote className="text-lg text-body-enhanced italic mb-4">
                "StackPro completely changed how we run our construction business. Our clients love seeing 
                real-time project updates, and we've cut our admin time in half. The project management 
                features alone have saved us from several costly mistakes."
              </blockquote>
              <cite className="text-muted-enhanced">
                — Mike Rodriguez, Owner of Rodriguez Construction
              </cite>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-surface-2 py-16">
          <div className="container-enhanced">
            <h2 className="text-h2-enhanced text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  Can I use StackPro on job sites without internet?
                </h3>
                <p className="text-muted-enhanced">
                  Yes! StackPro's mobile app works offline and syncs when you're back online. 
                  Take photos, update project status, and access documents even without internet connection.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  How do clients access their project information?
                </h3>
                <p className="text-muted-enhanced">
                  Each client gets a secure, branded portal where they can view project progress, photos, 
                  documents, and communicate with your team. No technical knowledge required.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  Does StackPro integrate with QuickBooks?
                </h3>
                <p className="text-muted-enhanced">
                  Yes, StackPro integrates with QuickBooks and other popular accounting software. 
                  Sync your invoices, expenses, and financial data seamlessly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-gradient py-20">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-6 text-white">
              Ready to Build Your Business Better?
            </h2>
            <p className="text-xl mb-8 text-white opacity-90 max-w-3xl mx-auto">
              Join thousands of contractors already using StackPro to streamline their operations, 
              improve client satisfaction, and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn bg-white font-semibold text-lg px-8 py-4" style={{ color: 'var(--primary)' }}>
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn font-semibold text-lg px-8 py-4 border-2 border-white text-white bg-transparent hover:bg-white" style={{ 
                transition: 'all var(--dur) var(--ease)'
              }}>
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="section-primary py-12 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="container-enhanced">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--fg)' }}>StackPro</h3>
              <p className="text-muted-enhanced">
                The complete business platform built for construction professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--fg)' }}>Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Pricing</Link></li>
                <li><Link href="/security" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--fg)' }}>Industries</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/law-firms" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Law Firms</Link></li>
                <li><Link href="/industries/contractors" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Contractors</Link></li>
                <li><Link href="/industries/agencies" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Agencies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--fg)' }}>Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Contact</Link></li>
                <li><Link href="/support" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Help Center</Link></li>
                <li><Link href="/privacy" className="text-muted-enhanced hover:text-[color:var(--secondary)]">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
