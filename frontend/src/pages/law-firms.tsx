import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '../components/theme/ThemeToggle'

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
      <header className="bg-background/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-muted hover:text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="text-muted hover:text-primary transition-colors">Pricing</Link>
              <Link href="/law-firms" className="text-primary font-semibold">Law Firms</Link>
              <Link href="/contact" className="text-muted hover:text-primary transition-colors">Support</Link>
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
        <section className="bg-primary py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="text-accent text-sm font-semibold uppercase tracking-wide mb-4">
                  FOR LAW FIRMS
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                  All-in-One Business Platform for{' '}
                  <span className="text-accent">Law Firms</span>
                </h1>
                <p className="text-xl text-white/80 mb-8">
                  Secure client portals, case management CRM, and professional website. 
                  Everything your legal practice needs in one integrated platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/pricing" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg">
                    See Live Demo
                  </Link>
                  <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all text-lg">
                    Try for Free
                  </Link>
                </div>
              </div>
              
              {/* Mock Dashboard for Law Firms */}
              <div className="lg:order-last">
                <div className="bg-background rounded-xl shadow-2xl p-6 border border-border overflow-hidden">
                  <div className="bg-gradient-to-br from-primary via-secondary to-primary rounded-xl p-6 text-white mb-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                    <h3 className="text-lg font-bold mb-4 relative z-10">Case Management Dashboard</h3>
                    <div className="space-y-3 relative z-10">
                      <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                              <span className="text-accent font-bold">JS</span>
                            </div>
                            <div>
                              <div className="font-semibold text-white">Johnson v. Smith</div>
                              <div className="text-xs text-white/70">Personal Injury</div>
                            </div>
                          </div>
                          <div className="bg-warning/20 text-warning px-3 py-1 rounded-full text-xs font-semibold border border-warning/30">
                            Discovery
                          </div>
                        </div>
                      </div>
                      <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                              <span className="text-accent font-bold">EM</span>
                            </div>
                            <div>
                              <div className="font-semibold text-white">Estate Planning - Miller</div>
                              <div className="text-xs text-white/70">Family Law</div>
                            </div>
                          </div>
                          <div className="bg-success/20 text-success px-3 py-1 rounded-full text-xs font-semibold border border-success/30">
                            Active
                          </div>
                        </div>
                      </div>
                      <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                              <span className="text-accent font-bold">PD</span>
                            </div>
                            <div>
                              <div className="font-semibold text-white">Personal Injury - Davis</div>
                              <div className="text-xs text-white/70">Litigation</div>
                            </div>
                          </div>
                          <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold border border-accent/30">
                            Settlement
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/10">
                      <div className="text-3xl font-bold text-primary mb-1">47</div>
                      <div className="text-sm font-medium text-foreground">Active Cases</div>
                      <div className="text-xs text-success mt-1">+12% this month</div>
                    </div>
                    <div className="bg-accent/5 rounded-lg p-4 text-center border border-accent/10">
                      <div className="text-3xl font-bold text-accent mb-1">12</div>
                      <div className="text-sm font-medium text-foreground">New Clients</div>
                      <div className="text-xs text-success mt-1">+3 this week</div>
                    </div>
                    <div className="bg-secondary/5 rounded-lg p-4 text-center border border-secondary/10">
                      <div className="text-3xl font-bold text-secondary mb-1">156</div>
                      <div className="text-sm font-medium text-foreground">Documents</div>
                      <div className="text-xs text-muted mt-1">+24 today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Are You Struggling With These Common Problems?
              </h2>
              <p className="text-xl text-muted">
                Most law firms face the same technology challenges
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">Scattered Tools</h3>
                <p className="text-muted">
                  Using 5+ different systems for email, file sharing, client management, and billing
                </p>
              </div>

              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">Security Concerns</h3>
                <p className="text-muted">
                  Worried about client confidentiality and secure document sharing
                </p>
              </div>

              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">Unprofessional Appearance</h3>
                <p className="text-muted">
                  Outdated website and client communications that don't reflect your expertise
                </p>
              </div>

              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">Time-Consuming Admin</h3>
                <p className="text-muted">
                  Spending hours on administrative tasks instead of billable work
                </p>
              </div>

              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">Poor Client Access</h3>
                <p className="text-muted">
                  Clients constantly calling for case updates and document requests
                </p>
              </div>

              <div className="text-center p-6 bg-background rounded-lg border border-border">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-3 text-danger">High IT Costs</h3>
                <p className="text-muted">
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
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How StackPro Solves These Problems
              </h2>
              <p className="text-xl text-muted">
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
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Secure File Sharing for Legal Documents
                      </h3>
                      <p className="text-muted">
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
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        CRM with Case & Client Tracking
                      </h3>
                      <p className="text-muted">
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
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Client Portals for Self-Service
                      </h3>
                      <p className="text-muted">
                        Clients can access case updates, documents, and communicate 24/7. Reduces phone calls and improves client satisfaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-2xl font-bold text-foreground mb-6">Client Portal Preview</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="text-sm text-muted">Case: Johnson v. Smith</div>
                    <div className="font-semibold text-foreground">Personal Injury Claim</div>
                    <div className="text-sm text-success">Status: Discovery Phase</div>
                  </div>
                  
                  <div className="bg-[color:var(--border)]/20 rounded p-4">
                    <div className="text-sm font-semibold text-foreground mb-2">Recent Documents:</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">📄 Medical Records Review</span>
                        <span className="text-primary hover:text-secondary cursor-pointer">Download</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">📄 Insurance Correspondence</span>
                        <span className="text-primary hover:text-secondary cursor-pointer">Download</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">📄 Settlement Proposal</span>
                        <span className="text-primary hover:text-secondary cursor-pointer">Download</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded p-4">
                    <div className="text-sm font-semibold text-primary mb-1">Next Steps:</div>
                    <div className="text-sm text-muted">Deposition scheduled for March 15th</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features for Law Firms */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Built Specifically for Legal Practices
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center bg-background rounded-lg p-6 border border-border">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚖️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Legal Compliance</h3>
                <p className="text-muted">Built-in compliance for attorney-client privilege and legal industry requirements</p>
              </div>

              <div className="text-center bg-background rounded-lg p-6 border border-border">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Court Deadlines</h3>
                <p className="text-muted">Automated deadline tracking and calendar integration for court dates</p>
              </div>

              <div className="text-center bg-background rounded-lg p-6 border border-border">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💼</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Case Templates</h3>
                <p className="text-muted">Pre-built templates for common legal matters and document workflows</p>
              </div>

              <div className="text-center bg-background rounded-lg p-6 border border-border">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">Document Search</h3>
                <p className="text-muted">Powerful search across all case files and client communications</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Carousel */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Trusted by Law Firms Nationwide
              </h2>
              <p className="text-xl text-muted">
                See what legal professionals are saying about StackPro
              </p>
            </div>

            <div className="bg-background rounded-lg shadow-lg p-8 border border-border">
              <div className="text-center">
                <div className="text-6xl text-primary mb-4">"</div>
                <blockquote className="text-xl text-foreground mb-6">
                  {testimonials[activeTestimonial].quote}
                </blockquote>
                
                <div className="border-t border-border pt-6">
                  <div className="font-semibold text-lg text-foreground">
                    {testimonials[activeTestimonial].author}
                  </div>
                  <div className="text-primary font-medium">
                    {testimonials[activeTestimonial].position}
                  </div>
                  <div className="text-muted">
                    {testimonials[activeTestimonial].firm}
                  </div>
                  <div className="text-sm text-muted mt-1">
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
                      index === activeTestimonial ? 'bg-primary' : 'bg-muted/40'
                    }`}
                    onClick={() => setActiveTestimonial(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing for Law Firms */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Pricing That Makes Sense for Law Firms
              </h2>
              <p className="text-xl text-muted">
                Replace multiple expensive tools with one integrated solution
              </p>
            </div>

            <div className="bg-background rounded-lg p-8 mb-8 border border-border">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">What You're Probably Paying Now:</h3>
                  <ul className="space-y-2 text-muted">
                    <li>• Case Management Software: $150/month</li>
                    <li>• Document Storage: $100/month</li>
                    <li>• Website Hosting: $50/month</li>
                    <li>• Email Marketing: $75/month</li>
                    <li>• Client Communication: $100/month</li>
                    <li className="font-semibold text-lg border-t border-border pt-2 text-foreground">Total: $475/month</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-4">With StackPro Business Plan:</h3>
                  <ul className="space-y-2 text-muted">
                    <li>• Complete CRM & Case Management ✅</li>
                    <li>• Secure File Portal ✅</li>
                    <li>• Professional Website ✅</li>
                    <li>• Email Marketing Tools ✅</li>
                    <li>• Client Portal & Communication ✅</li>
                    <li className="font-semibold text-lg text-success border-t border-border pt-2">Total: $599/month</li>
                  </ul>
                  <div className="mt-4 p-3 bg-success/10 rounded text-center border border-success/20">
                    <span className="text-success font-semibold">Save $124/month + Get Better Integration!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link href="/pricing" className="bg-primary text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg mr-4">
                See All Plans & Pricing
              </Link>
              <Link href="/contact" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg">
                Request Demo
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Modernize Your Legal Practice?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join 500+ law firms already using StackPro to serve clients better
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-accent text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all text-lg">
                Start 7-Day Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all text-lg">
                Schedule Demo Call
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-4">
              ⚡ Setup in 20 minutes • 🔒 Bank-level security • 📞 Expert support
            </p>
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
                Professional business tools for legal practices.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">For Law Firms</h4>
              <ul className="space-y-2">
                <li><Link href="/law-firms" className="text-white/70 hover:text-white transition-colors">Case Management</Link></li>
                <li><Link href="/law-firms" className="text-white/70 hover:text-white transition-colors">Client Portals</Link></li>
                <li><Link href="/law-firms" className="text-white/70 hover:text-white transition-colors">Document Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="mailto:support@stackpro.io" className="text-white/70 hover:text-white transition-colors">support@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">&copy; 2025 StackPro. All rights reserved. Built for legal professionals.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
