import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import ThemeToggle from '../../components/theme/ThemeToggle';

export default function Agencies() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Creative Agency Management Software | StackPro for Agencies</title>
        <meta name="description" content="Streamline your creative agency with StackPro's client management, project collaboration, and creative workflow tools. Built for marketing, design, and production studios." />
        <meta name="keywords" content="creative agency software, client management, project collaboration, creative workflow, agency CRM" />
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
              <Link href="/industries/agencies" className="nav-link-enhanced active">Industries</Link>
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
                <Link href="/industries/agencies" className="nav-link-enhanced active">Industries</Link>
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
              Elevate Your Creative Agency with StackPro's All-in-One Platform
            </h1>
            <p className="text-xl text-muted-enhanced mb-8 max-w-3xl mx-auto">
              Stop losing creative momentum to administrative chaos. StackPro gives creative agencies 
              streamlined client management, collaborative project workflows, and professional client portals 
              that showcase your work beautifully.
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
                  Creative Agency Challenges
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Creative files scattered across multiple platforms
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Endless email chains for client feedback
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Difficulty tracking project profitability
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Version control nightmares
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--danger, #EF4444)' }}>✗</span>
                    Time wasted on administrative tasks
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="text-h2-enhanced mb-6">
                  StackPro's Creative Solution
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Centralized creative asset management
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Beautiful client portals for feedback and approvals
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Built-in time tracking and project profitability
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    Automated version control and file organization
                  </li>
                  <li className="flex items-start text-body-enhanced">
                    <span className="mr-3 mt-1" style={{ color: 'var(--accent)' }}>✓</span>
                    AI assistant for creative project coordination
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Agencies */}
        <section className="section-surface-2 py-16">
          <div className="container-enhanced">
            <h2 className="text-h2-enhanced text-center mb-12">
              Built for Creative Professionals
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Creative Asset Management
                </h3>
                <p className="text-muted-enhanced">
                  Organize all your creative files, brand assets, and project materials in one secure location. 
                  Advanced search and tagging make finding the right asset effortless.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Client Collaboration
                </h3>
                <p className="text-muted-enhanced">
                  Beautiful, branded client portals where clients can review work, provide feedback, 
                  and approve deliverables. No more endless email chains or lost feedback.
                </p>
              </div>
              <div className="card-enhanced p-8">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style={{ 
                  backgroundColor: 'var(--secondary)', 
                  color: 'white' 
                }}>
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
                  Project Profitability
                </h3>
                <p className="text-muted-enhanced">
                  Track time, monitor budgets, and analyze project profitability in real-time. 
                  Know which projects are winners and optimize your agency's performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-surface py-16">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-12">
              Trusted by Creative Agencies
            </h2>
            <div className="card-enhanced p-8 max-w-4xl mx-auto">
              <blockquote className="text-lg text-body-enhanced italic mb-4">
                "StackPro transformed how we work with clients. The client portals are gorgeous and 
                professional, and we've eliminated 90% of our email back-and-forth. Our team can 
                focus on creativity instead of chasing approvals and managing files."
              </blockquote>
              <cite className="text-muted-enhanced">
                — Jessica Chen, Creative Director at Pixel Perfect Studio
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
                  Can clients upload their own files and brand assets?
                </h3>
                <p className="text-muted-enhanced">
                  Absolutely! Clients can upload brand guidelines, reference materials, and feedback directly 
                  through their portal. Everything stays organized and accessible to your team.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  Does StackPro support large creative files?
                </h3>
                <p className="text-muted-enhanced">
                  Yes, StackPro handles large creative files including high-resolution images, videos, 
                  and design files. Our cloud storage is optimized for creative workflows.
                </p>
              </div>
              <div className="card-enhanced p-6">
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--fg)' }}>
                  Can we customize the client portals with our branding?
                </h3>
                <p className="text-muted-enhanced">
                  Yes! Client portals can be fully branded with your logo, colors, and custom domain. 
                  Your clients will see a seamless extension of your brand experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-gradient py-20">
          <div className="container-enhanced text-center">
            <h2 className="text-h2-enhanced mb-6 text-white">
              Ready to Unleash Your Creative Potential?
            </h2>
            <p className="text-xl mb-8 text-white opacity-90 max-w-3xl mx-auto">
              Join creative agencies worldwide who use StackPro to streamline their workflows, 
              delight their clients, and focus on what they do best - creating amazing work.
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
                The complete business platform built for creative professionals.
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
