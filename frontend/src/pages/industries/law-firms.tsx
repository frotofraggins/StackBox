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
              <Link href="/#features" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Features
              </Link>
              <Link href="/pricing" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Pricing
              </Link>
              <Link href="/industries/law-firms" className="text-[color:var(--secondary)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Industries
              </Link>
              <Link href="/support" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)]">
                Support
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors duration-[var(--dur)] ease-[var(--ease)] font-medium">
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary">
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
                <Link href="/#features" className="text-muted hover:text-primary">Features</Link>
                <Link href="/pricing" className="text-muted hover:text-primary">Pricing</Link>
                <Link href="/industries/law-firms" className="text-secondary">Industries</Link>
                <Link href="/support" className="text-muted hover:text-primary">Support</Link>
                <Link href="/signup" className="btn btn-primary">
                  Start Free Trial
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 text-white shadow-[var(--shadow-2)]" style={{ background: 'var(--grad-primary)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Streamline Your Legal Practice with{' '}
                <span className="text-[color:var(--accent)]">StackPro's</span> All-in-One Platform
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
                Stop drowning in paperwork and disorganized client files. StackPro gives law firms secure client portals, 
                intelligent document management, and AI-powered case organization in one professional platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing" className="bg-white text-[color:var(--primary)] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
                  Start Free Trial
                </Link>
                <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[color:var(--primary)] transition-all">
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="py-16 bg-[color:var(--surface)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-[color:var(--fg)] mb-6">
                  The Challenges Every Law Firm Faces
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">✗</span>
                    <span className="text-[color:var(--muted)]">Client files scattered across multiple systems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">✗</span>
                    <span className="text-[color:var(--muted)]">Insecure email for sensitive document sharing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">✗</span>
                    <span className="text-[color:var(--muted)]">Hours wasted on administrative tasks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">✗</span>
                    <span className="text-[color:var(--muted)]">Difficulty tracking case progress and deadlines</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-3 mt-1">✗</span>
                    <span className="text-[color:var(--muted)]">Poor client communication and transparency</span>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[color:var(--fg)] mb-6">
                  StackPro's Legal Solution
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-[color:var(--accent)] mr-3 mt-1">✓</span>
                    <span className="text-[color:var(--muted)]">Centralized, secure client portals for all case files</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[color:var(--accent)] mr-3 mt-1">✓</span>
                    <span className="text-[color:var(--muted)]">Bank-level encryption for document sharing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[color:var(--accent)] mr-3 mt-1">✓</span>
                    <span className="text-[color:var(--muted)]">AI assistant for case notes and research</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[color:var(--accent)] mr-3 mt-1">✓</span>
                    <span className="text-[color:var(--muted)]">Automated deadline tracking and reminders</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[color:var(--accent)] mr-3 mt-1">✓</span>
                    <span className="text-[color:var(--muted)]">Real-time client updates and messaging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Law Firms */}
        <section className="py-16 bg-[color:var(--surface-2)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center text-[color:var(--fg)] mb-12">
              Built Specifically for Legal Professionals
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-8 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-all duration-[var(--dur)] ease-[var(--ease)]">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white" style={{ backgroundColor: 'var(--secondary)' }}>
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[color:var(--fg)]">
                  Secure Client Portals
                </h3>
                <p className="text-[color:var(--muted)]">
                  Give each client their own secure portal to access case documents, communicate with your team, 
                  and track case progress. HIPAA-compliant and attorney-client privilege protected.
                </p>
              </div>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-8 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-all duration-[var(--dur)] ease-[var(--ease)]">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white" style={{ backgroundColor: 'var(--secondary)' }}>
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[color:var(--fg)]">
                  AI Legal Assistant
                </h3>
                <p className="text-[color:var(--muted)]">
                  Our AI helps organize case notes, summarize depositions, track important dates, 
                  and even assist with legal research. Trained specifically for legal workflows.
                </p>
              </div>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-8 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] transition-all duration-[var(--dur)] ease-[var(--ease)]">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-white" style={{ backgroundColor: 'var(--secondary)' }}>
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[color:var(--fg)]">
                  Case Management
                </h3>
                <p className="text-[color:var(--muted)]">
                  Track all case details, deadlines, and communications in one place. 
                  Automated reminders ensure you never miss a critical date.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-[color:var(--surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-[color:var(--fg)] mb-12">
              Trusted by Legal Professionals
            </h2>
            <div className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-[var(--radius)] p-8 shadow-[var(--shadow-1)]">
              <blockquote className="text-lg text-[color:var(--fg)] italic mb-4">
                "StackPro transformed our practice. We went from spending 3 hours a day on administrative tasks 
                to focusing on what matters - serving our clients. The secure client portals alone saved us 
                countless hours of back-and-forth emails."
              </blockquote>
              <cite className="text-[color:var(--muted)]">
                — Sarah Mitchell, Partner at Mitchell & Associates Law
              </cite>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-[color:var(--surface-2)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-[color:var(--fg)] mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-6 shadow-[var(--shadow-1)]">
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">
                  Is StackPro compliant with legal industry regulations?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Yes, StackPro is built with legal compliance in mind. We maintain SOC 2 Type II certification, 
                  use bank-level encryption, and ensure all communications maintain attorney-client privilege.
                </p>
              </div>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-6 shadow-[var(--shadow-1)]">
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">
                  How quickly can we get our firm set up?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Most law firms are fully operational within 24 hours. Our onboarding team will help migrate 
                  your existing client data and train your staff on the platform.
                </p>
              </div>
              <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[var(--radius)] p-6 shadow-[var(--shadow-1)]">
                <h3 className="text-xl font-semibold mb-3 text-[color:var(--fg)]">
                  Can clients access their files 24/7?
                </h3>
                <p className="text-[color:var(--muted)]">
                  Absolutely. Each client gets their own secure portal accessible anytime, anywhere. 
                  They can view case updates, download documents, and message your team directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 text-white shadow-[var(--shadow-2)]" style={{ background: 'var(--grad-primary)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6 text-white">
              Ready to Modernize Your Legal Practice?
            </h2>
            <p className="text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              Join hundreds of law firms already using StackPro to streamline their operations 
              and deliver better client experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-[color:var(--primary)] px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[color:var(--primary)] transition-all">
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-40">
        <div className="flex space-x-3">
          <Link href="/pricing" className="flex-1 text-white py-3 rounded-lg text-center font-semibold hover:opacity-90 transition-all" style={{ background: 'var(--primary)' }}>
            Start Trial
          </Link>
          <Link href="/contact" className="flex-1 border-2 text-[color:var(--primary)] py-3 rounded-lg text-center font-semibold hover:bg-[color:var(--primary)] hover:text-white transition-all" style={{ borderColor: 'var(--primary)' }}>
            Book Demo
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[color:var(--surface)] py-12 border-t border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-[color:var(--fg)]">StackPro</h3>
              <p className="text-[color:var(--muted)]">
                The complete business platform built for legal professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[color:var(--fg)]">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[color:var(--fg)]">Industries</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/law-firms" className="text-[color:var(--secondary)] transition-colors">Law Firms</Link></li>
                <li><Link href="/industries/contractors" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Contractors</Link></li>
                <li><Link href="/industries/agencies" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Agencies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[color:var(--fg)]">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Contact</Link></li>
                <li><Link href="/support" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="text-[color:var(--muted)] hover:text-[color:var(--secondary)] transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
