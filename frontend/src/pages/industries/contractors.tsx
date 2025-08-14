import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '../../components/theme/ThemeToggle';

export default function Contractors() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Construction CRM Software - StackPro for Contractors</title>
        <meta name="description" content="Stop juggling apps! StackPro combines CRM, client portals, and invoicing for contractors. Set up in 30 minutes. Try free for 30 days - no credit card needed." />
        <meta name="keywords" content="construction CRM software, contractor project management app, construction client portal, construction business tools" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-background border-b border-border">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
                StackPro
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-muted hover:text-foreground transition-colors">Features</Link>
              <Link href="/pricing" className="text-muted hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/industries/contractors" className="text-primary font-medium">Industries</Link>
              <Link href="/support" className="text-muted hover:text-foreground transition-colors">Support</Link>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="text-muted hover:text-foreground transition-colors">Login</Link>
              <Link href="/signup" className="btn btn-primary">
                Start Free Trial
              </Link>
            </div>

            <button 
              className="md:hidden text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t border-border">
              <nav className="flex flex-col space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">Theme:</span>
                  <ThemeToggle />
                </div>
                <Link href="/#features" className="text-muted hover:text-foreground transition-colors">Features</Link>
                <Link href="/pricing" className="text-muted hover:text-foreground transition-colors">Pricing</Link>
                <Link href="/industries/contractors" className="text-primary font-medium">Industries</Link>
                <Link href="/support" className="text-muted hover:text-foreground transition-colors">Support</Link>
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
        <section className="section-spacing bg-background">
          <div className="container-custom text-center">
            <h1 className="text-h1 mb-6 text-foreground">
              Stop Losing Paperwork. Start Winning More Jobs.
            </h1>
            <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
              The only business platform built for contractors who want to look professional, stay organized, 
              and get paid faster - without the tech headaches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn btn-primary">
                Start Your Free 30-Day Trial
              </Link>
              <Link href="/contact" className="btn bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all">
                See How It Works - Quick Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Problem/Solution */}
        <section className="section-spacing bg-surface">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-h2 mb-6 text-foreground">
                  Sound Familiar?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-red-500">✗</span>
                    Photos scattered across phones, cloud drives, and text messages
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-red-500">✗</span>
                    Clients calling every day asking "What's the status?"
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-red-500">✗</span>
                    Change orders lost in email chains
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-red-500">✗</span>
                    Invoices sent weeks after work is done
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-red-500">✗</span>
                    Looking unprofessional compared to competitors
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-h2 mb-6 text-foreground">
                  Here's What Changes
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-accent">✓</span>
                    Every project photo automatically organized and shared
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-accent">✓</span>
                    Clients check their portal instead of calling you
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-accent">✓</span>
                    Digital change orders signed instantly on-site
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-accent">✓</span>
                    Professional invoices sent same day as completion
                  </li>
                  <li className="flex items-start text-foreground">
                    <span className="mr-3 mt-1 text-accent">✓</span>
                    Look like the most professional contractor they've hired
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Contractors */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom">
            <h2 className="text-h2 text-center mb-4 text-foreground">
              Everything You Need in One App
            </h2>
            <p className="text-xl text-muted text-center mb-12 max-w-3xl mx-auto">
              Stop switching between 6 different apps. StackPro handles everything from first contact to final payment.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-8 hover-scale">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-secondary text-white">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Smart Photo Management
                </h3>
                <p className="text-muted">
                  Take photos on-site and they're instantly organized by project, shared with clients, 
                  and saved forever. Never lose before/after photos again.
                </p>
              </div>
              <div className="card p-8 hover-scale">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-secondary text-white">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Client Portals That Wow
                </h3>
                <p className="text-muted">
                  Give every client their own branded portal to check progress, see photos, and approve changes. 
                  They'll think you're running a Fortune 500 company.
                </p>
              </div>
              <div className="card p-8 hover-scale">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 bg-secondary text-white">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Get Paid Faster
                </h3>
                <p className="text-muted">
                  Professional invoices sent the day work is done. Clients can pay online instantly. 
                  Average payment time drops from 45 days to 12 days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-spacing bg-surface">
          <div className="container-custom text-center">
            <h2 className="text-h2 mb-4 text-foreground">
              "I Wish I'd Found This 5 Years Ago"
            </h2>
            <p className="text-muted mb-12 max-w-2xl mx-auto">
              Real contractors sharing how StackPro transformed their business
            </p>
            <div className="card p-8 max-w-4xl mx-auto">
              <blockquote className="text-lg text-foreground italic mb-6">
                "Before StackPro, I spent 2 hours every evening just organizing photos and sending updates to clients. 
                Now everything happens automatically - photos get organized, clients stay updated, and I actually have 
                time for my family again. My clients constantly tell me I'm the most professional contractor they've worked with."
              </blockquote>
              <cite className="text-muted">
                — Sarah Chen, Chen Home Improvements
              </cite>
              <div className="mt-6 text-sm text-muted">
                "Saved 10+ hours per week • Increased revenue 23% in 6 months"
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom">
            <h2 className="text-h2 text-center mb-4 text-foreground">
              Questions From Other Contractors
            </h2>
            <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
              The same concerns you probably have right now
            </p>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  "I'm not tech-savvy. Will this be complicated to set up?"
                </h3>
                <p className="text-muted">
                  Not at all. Our setup wizard walks you through everything in 30 minutes. Plus, we do a free setup call 
                  to get your first project uploaded and make sure everything works perfectly for your business.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  "Will this work on construction sites with poor cell service?"
                </h3>
                <p className="text-muted">
                  Yes! The mobile app works completely offline. Take photos, update notes, check schedules - 
                  everything syncs automatically when you get back to WiFi or better signal.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  "My clients are older and don't use technology much. Will they figure it out?"
                </h3>
                <p className="text-muted">
                  They love it! The client portal is simpler than checking email. We've had 80-year-old clients 
                  easily viewing progress photos and approving invoices. It actually makes YOU look more professional.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  "What if I want to cancel? Are there long contracts?"
                </h3>
                <p className="text-muted">
                  No contracts, cancel anytime. We're confident you'll love it, but if not, you can export all your 
                  data and cancel with one click. Most contractors upgrade to bigger plans within 3 months.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  "Does this work with QuickBooks and my existing tools?"
                </h3>
                <p className="text-muted">
                  Absolutely. Direct integration with QuickBooks, Excel export for any other software, 
                  and we can import your existing client list to get you started immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-spacing" style={{ background: 'var(--grad-primary)' }}>
          <div className="container-custom text-center">
            <h2 className="text-h2 mb-6 text-white">
              Ready to Build Your Business Better?
            </h2>
            <p className="text-xl mb-8 text-white opacity-90 max-w-3xl mx-auto">
              Join thousands of contractors already using StackPro to streamline their operations, 
              improve client satisfaction, and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn btn-primary">
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary transition-all">
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="section-spacing bg-background border-t border-border">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">StackPro</h3>
              <p className="text-muted">
                The complete business platform built for construction professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-muted hover:text-secondary transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-muted hover:text-secondary transition-colors">Pricing</Link></li>
                <li><Link href="/features" className="text-muted hover:text-secondary transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Industries</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/law-firms" className="text-muted hover:text-secondary transition-colors">Law Firms</Link></li>
                <li><Link href="/industries/contractors" className="text-muted hover:text-secondary transition-colors">Contractors</Link></li>
                <li><Link href="/industries/agencies" className="text-muted hover:text-secondary transition-colors">Agencies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-muted hover:text-secondary transition-colors">Contact</Link></li>
                <li><Link href="/support" className="text-muted hover:text-secondary transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="text-muted hover:text-secondary transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
