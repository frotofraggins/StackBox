import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function LawFirms() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const testimonials = [
    {
      quote: "StackPro transformed how we handle client files and communications. Setup took 20 minutes and we were up and running with a professional client portal.",
      author: "Sarah Chen",
      position: "Partner",
      firm: "Chen & Associates Law",
      practice: "Family Law",
      size: "8 attorneys"
    },
    {
      quote: "The secure file sharing is exactly what we needed for sensitive legal documents. Our clients love having 24/7 access to their case files.",
      author: "Michael Torres",
      position: "Managing Partner", 
      firm: "Torres Legal Group",
      practice: "Personal Injury",
      size: "15 attorneys"
    },
    {
      quote: "We replaced 6 different tools with StackPro. Now everything is integrated and our staff is more productive than ever.",
      author: "Jennifer Walsh",
      position: "Operations Director",
      firm: "Walsh & Partners",
      practice: "Corporate Law",
      size: "25 attorneys"
    }
  ]

  return (
    <>
      <Head>
        <title>Law Firm Solutions - StackPro | CRM, File Portal & Client Management</title>
        <meta name="description" content="Professional business platform for law firms. Secure client portals, case management CRM, and document sharing. Trusted by 500+ legal practices." />
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
              <Link href="/law-firms" className="nav-active">Law Firms</Link>
              <Link href="/contact" className="nav-link">Support</Link>
            </nav>
            <Link href="/pricing" className="btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-dark py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="text-primary text-sm font-semibold uppercase tracking-wide mb-4">
                  FOR LAW FIRMS
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-text-light mb-6">
                  All-in-One Business Platform for{' '}
                  <span className="text-gradient-primary">Law Firms</span>
                </h1>
                <p className="text-xl text-text-light/80 mb-8">
                  Secure client portals, case management CRM, and professional website. 
                  Everything your legal practice needs in one integrated platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/pricing" className="btn-primary btn-large">
                    See Live Demo
                  </Link>
                  <Link href="/contact" className="btn-secondary btn-large">
                    Try for Free
                  </Link>
                </div>
              </div>
              
              {/* Mock Dashboard for Law Firms */}
              <div className="lg:order-last">
                <div className="bg-white rounded-lg shadow-2xl p-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg p-6 text-white mb-4">
                    <h3 className="text-lg font-semibold mb-3">Case Management Dashboard</h3>
                    <div className="space-y-2">
                      <div className="bg-white bg-opacity-20 rounded p-2 flex justify-between">
                        <span className="text-sm">📁 Johnson v. Smith</span>
                        <span className="text-xs text-blue-200">Discovery</span>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded p-2 flex justify-between">
                        <span className="text-sm">📋 Estate Planning - Miller</span>
                        <span className="text-xs text-green-200">Active</span>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded p-2 flex justify-between">
                        <span className="text-sm">⚖️ Personal Injury - Davis</span>
                        <span className="text-xs text-yellow-200">Settlement</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">47</div>
                      <div className="text-gray-600">Active Cases</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <div className="text-gray-600">New Clients</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">156</div>
                      <div className="text-gray-600">Documents</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Are You Struggling With These Common Problems?
              </h2>
              <p className="text-xl text-text-secondary">
                Most law firms face the same technology challenges
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-semibold mb-3 text-error">Scattered Tools</h3>
                <p className="text-text-secondary">
                  Using 5+ different systems for email, file sharing, client management, and billing
                </p>
              </div>

              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3 text-error">Security Concerns</h3>
                <p className="text-text-secondary">
                  Worried about client confidentiality and secure document sharing
                </p>
              </div>

              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold mb-3 text-error">Unprofessional Appearance</h3>
                <p className="text-text-secondary">
                  Outdated website and client communications that don't reflect your expertise
                </p>
              </div>

              <div className="text-center p-6">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-3 text-error">Time-Consuming Admin</h3>
                <p className="text-text-secondary">
                  Spending hours on administrative tasks instead of billable work
                </p>
              </div>

              <div className="text-center p-6">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-semibold mb-3 text-error">Poor Client Access</h3>
                <p className="text-text-secondary">
                  Clients constantly calling for case updates and document requests
                </p>
              </div>

              <div className="text-center p-6">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-3 text-error">High IT Costs</h3>
                <p className="text-text-secondary">
                  Expensive monthly subscriptions for multiple software tools
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                How StackPro Solves These Problems
              </h2>
              <p className="text-xl text-text-secondary">
                One integrated platform designed specifically for legal practices
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🔐</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-text-light mb-2">
                        Secure File Sharing for Legal Documents
                      </h3>
                      <p className="text-text-secondary">
                        Bank-level encryption, audit logs, and permission controls. Perfect for confidential legal documents and client communications.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-text-light mb-2">
                        CRM with Case & Client Tracking
                      </h3>
                      <p className="text-text-secondary">
                        Manage cases, track deadlines, store client information, and automate follow-ups. Built specifically for legal workflows.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🌐</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold text-text-light mb-2">
                        Client Portals for Self-Service
                      </h3>
                      <p className="text-text-secondary">
                        Clients can access case updates, documents, and communicate 24/7. Reduces phone calls and improves client satisfaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-glass">
                <h3 className="text-2xl font-bold text-text-light mb-6">Client Portal Preview</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="text-sm text-text-muted">Case: Johnson v. Smith</div>
                    <div className="font-semibold text-text-light">Personal Injury Claim</div>
                    <div className="text-sm text-success">Status: Discovery Phase</div>
                  </div>
                  
                  <div className="bg-surface rounded p-4">
                    <div className="text-sm font-semibold text-text-light mb-2">Recent Documents:</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">📄 Medical Records Review</span>
                        <span className="text-primary">Download</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">📄 Insurance Correspondence</span>
                        <span className="text-primary">Download</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">📄 Settlement Proposal</span>
                        <span className="text-primary">Download</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded p-4">
                    <div className="text-sm font-semibold text-primary mb-1">Next Steps:</div>
                    <div className="text-sm text-text-secondary">Deposition scheduled for March 15th</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Law Firms */}
        <section className="py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Built Specifically for Legal Practices
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚖️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-text-light">Legal Compliance</h3>
                <p className="text-text-secondary">Built-in compliance for attorney-client privilege and legal industry requirements</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-text-light">Court Deadlines</h3>
                <p className="text-text-secondary">Automated deadline tracking and calendar integration for court dates</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-text-light">Case Templates</h3>
                <p className="text-text-secondary">Pre-built templates for common legal matters and document workflows</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-text-light">Document Search</h3>
                <p className="text-text-secondary">Powerful search across all case files and client communications</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Carousel */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Trusted by Law Firms Nationwide
              </h2>
              <p className="text-xl text-text-secondary">
                See what legal professionals are saying about StackPro
              </p>
            </div>

            <div className="card-glass">
              <div className="text-center">
                <div className="text-6xl text-primary mb-4">"</div>
                <blockquote className="text-xl text-text-light mb-6">
                  {testimonials[activeTestimonial].quote}
                </blockquote>
                
                <div className="border-t border-border pt-6">
                  <div className="font-semibold text-lg text-text-light">
                    {testimonials[activeTestimonial].author}
                  </div>
                  <div className="text-primary font-medium">
                    {testimonials[activeTestimonial].position}
                  </div>
                  <div className="text-text-secondary">
                    {testimonials[activeTestimonial].firm}
                  </div>
                  <div className="text-sm text-text-muted mt-1">
                    {testimonials[activeTestimonial].practice} • {testimonials[activeTestimonial].size}
                  </div>
                </div>
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-primary' : 'bg-text-muted'
                    }`}
                    onClick={() => setActiveTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing for Law Firms */}
        <section className="py-16 bg-surface">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-text-light mb-4">
                Pricing That Makes Sense for Law Firms
              </h2>
              <p className="text-xl text-text-secondary">
                Replace multiple expensive tools with one integrated solution
              </p>
            </div>

            <div className="card rounded-lg p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-text-light mb-4">What You're Probably Paying Now:</h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li>• Case Management Software: $150/month</li>
                    <li>• Document Storage: $100/month</li>
                    <li>• Website Hosting: $50/month</li>
                    <li>• Email Marketing: $75/month</li>
                    <li>• Client Communication: $100/month</li>
                    <li className="font-semibold text-lg border-t border-border pt-2 text-text-light">Total: $475/month</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-4">With StackPro Business Plan:</h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li>• Complete CRM & Case Management ✅</li>
                    <li>• Secure File Portal ✅</li>
                    <li>• Professional Website ✅</li>
                    <li>• Email Marketing Tools ✅</li>
                    <li>• Client Portal & Communication ✅</li>
                    <li className="font-semibold text-lg text-success border-t border-border pt-2">Total: $599/month</li>
                  </ul>
                  <div className="mt-4 p-3 bg-success/10 rounded text-center">
                    <span className="text-success font-semibold">Save $124/month + Get Better Integration!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/pricing" className="btn-primary btn-large mr-4">
                See All Plans & Pricing
              </Link>
              <Link href="/contact" className="btn-secondary btn-large">
                Request Demo
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Modernize Your Legal Practice?
            </h2>
            <p className="text-xl text-text-light/90 mb-8">
              Join 500+ law firms already using StackPro to serve clients better
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="btn-accent btn-large">
                Start 7-Day Free Trial
              </Link>
              <Link href="/contact" className="btn-glass btn-large">
                Schedule Demo Call
              </Link>
            </div>
            <p className="text-text-light/80 text-sm mt-4">
              ⚡ Setup in 20 minutes • 🔒 Bank-level security • 📞 Expert support
            </p>
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
                Professional business tools for legal practices.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">For Law Firms</h4>
              <ul className="space-y-2">
                <li><Link href="/law-firms" className="hover:text-white">Case Management</Link></li>
                <li><Link href="/law-firms" className="hover:text-white">Client Portals</Link></li>
                <li><Link href="/law-firms" className="hover:text-white">Document Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="hover:text-white">Contact Support</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><a href="mailto:support@stackpro.io" className="hover:text-white">support@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>&copy; 2025 StackPro. All rights reserved. Built for legal professionals.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
