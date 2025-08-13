import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '../../components/theme/ThemeToggle';

export default function LawFirms() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Legal Practice Management Software | StackPro for Law Firms</title>
        <meta name="description" content="Streamline your law practice with StackPro's secure client portals, document management, and AI-powered case organization. Built specifically for legal professionals." />
        <meta name="keywords" content="legal practice management, law firm software, client portal, document management, legal CRM" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="nav-enhanced fixed w-full top-0 z-50">
        <div className="container-enhanced">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--logo-color)' }}>
                StackPro
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="nav-link-enhanced">
                Features
              </Link>
              <Link href="/pricing" className="nav-link-enhanced">
                Pricing
              </Link>
              <Link href="/industries/law-firms" className="nav-link-enhanced active">
                Industries
              </Link>
              <Link href="/support" className="nav-link-enhanced">
                Support
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="nav-link-enhanced">
                Login
              </Link>
              <Link href="/signup" className="btn text-white font-semibold" style={{ background: 'var(--primary)' }}>
                Start Free Trial
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden text-[color:var(--fg)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t" style={{ borderColor: 'var(--border)' }}>
              <nav className="flex flex-col space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-enhanced text-sm">Theme:</span>
                  <ThemeToggle />
                </div>
                <Link href="/#features" className="nav-link-enhanced">Features</Link>
                <Link href="/pricing" className="nav-link-enhanced">Pricing</Link>
                <Link href="/industries/law-firms" className="nav-link-enhanced active">Industries</Link>
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
              Streamline Your Legal Practice with StackPro's All-in-One Platform
            </h1>
            <p className="text-xl text-muted-enhanced mb-8 max-w-3xl mx-auto">
              Stop drowning in paperwork and disorganized client files. StackPro gives law firms secure client portals, 
              intelligent document management, and AI-powered case organization in one professional platform.
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
                  The Challenges Every Law Firm Faces
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Client files scattered across multiple systems
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Insecure email for sensitive document sharing
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Hours wasted on administrative tasks
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Difficulty tracking case progress and deadlines
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Poor client communication and transparency
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-h2-enhanced mb-6">
                  StackPro's Legal Solution
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Centralized, secure client portals for all case files
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Bank-level encryption for document sharing
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    AI assistant for case notes and research
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Automated deadline tracking and reminders
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Real-time client updates and messaging
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Law Firms */}
        <section className="section-surface-2 py-16">
          <div className="container-enhanced">
            <h2 className="text-h2-enhanced text-center mb-12">
              Built Specifically for Legal Professionals
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Secure Client Portals
                </h3>
                <p className="text-muted-enhanced">
                  Give each client their own secure portal to access case documents, communicate with your team, 
                  and track case progress. HIPAA-compliant and attorney-client privilege protected.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  AI Legal Assistant
                </h3>
                <p className="text-muted-enhanced">
                  Our AI helps organize case notes, summarize depositions, track important dates, 
                  and even assist with legal research. Trained specifically for legal workflows.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Case Management
                </h3>
                <p className="text-muted-enhanced">
                  Track all case details, deadlines, and communications in one place. 
                  Automated reminders ensure you never miss a critical date.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-surface py-16">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-12">
              Trusted by Legal Professionals
            </h2>
            <div className="card-enhanced p-8 max-w-4xl mx-auto">
              <blockquote className="text-lg text-body-enhanced italic mb-4">
                "StackPro transformed our practice. We went from spending 3 hours a day on administrative tasks 
                to focusing on what matters - serving our clients. The secure client portals alone saved us 
                countless hours of back-and-forth emails."
              </blockquote>
              <cite className="text-muted-enhanced">
                — Sarah Mitchell, Partner at Mitchell & Associates Law
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
                  Is StackPro compliant with legal industry regulations?
                </h3>
                <p className="text-muted-enhanced">
                  Yes, StackPro is built with legal compliance in mind. We maintain SOC 2 Type II certification, 
                  use bank-level encryption, and ensure all communications maintain attorney-client privilege.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  How quickly can we get our firm set up?
                </h3>
                <p className="text-muted-enhanced">
                  Most law firms are fully operational within 24 hours. Our onboarding team will help migrate 
                  your existing client data and train your staff on the platform.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  Can clients access their files 24/7?
                </h3>
                <p className="text-muted-enhanced">
                  Absolutely. Each client gets their own secure portal accessible anytime, anywhere. 
                  They can view case updates, download documents, and message your team directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-gradient py-20">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-6 text-white">
              Ready to Modernize Your Legal Practice?
            </h2>
            <p className="text-xl mb-8 text-white opacity-90 max-w-3xl mx-auto">
              Join hundreds of law firms already using StackPro to streamline their operations 
              and deliver better client experiences.
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
                The complete business platform built for legal professionals.
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
