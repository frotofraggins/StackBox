import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import ThemeToggle from '../components/theme/ThemeToggle'
import Navigation from '../components/layout/Navigation'

export default function Features() {
  const [activeFeature, setActiveFeature] = useState('crm')

  const features = {
    crm: {
      name: 'Customer Relationship Management',
      description: 'Manage clients, track interactions, and automate follow-ups with our powerful CRM system.',
      benefits: [
        'Contact management with custom fields and tags',
        'Deal pipeline tracking with visual stages',
        'Automated email sequences and follow-ups',
        'Task management and deadline reminders',
        'Client communication history',
        'Custom reports and analytics',
        'Mobile app for on-the-go access',
        'Integration with email and calendar'
      ],
      mockup: {
        title: 'Client Management Dashboard',
        items: [
          { name: 'Johnson v. Smith', status: 'Discovery', value: '$45,000' },
          { name: 'Estate Planning - Miller', status: 'Active', value: '$8,500' },
          { name: 'Personal Injury - Davis', status: 'Settlement', value: '$125,000' }
        ]
      }
    },
    files: {
      name: 'Secure File Portal',
      description: 'Share files securely with clients through encrypted portals and organized project spaces.',
      benefits: [
        'Bank-level encryption for all file transfers',
        'Client-specific portals with branded access',
        'Version control and file history tracking',
        'Permission-based access controls',
        'Audit logs for compliance requirements',
        'Large file support up to 5GB per file',
        'Automatic virus scanning and threat detection',
        'Mobile access for files on any device'
      ],
      mockup: {
        title: 'Secure Client Portal',
        items: [
          { name: 'Contract Documents', files: 5, size: '12.3 MB' },
          { name: 'Financial Records', files: 8, size: '45.7 MB' },
          { name: 'Legal Correspondence', files: 12, size: '8.1 MB' }
        ]
      }
    },
    website: {
      name: 'Professional Website',
      description: 'Beautiful, mobile-responsive websites that showcase your business professionally.',
      benefits: [
        'Mobile-responsive design templates',
        'SEO optimization for better search rankings',
        'Custom domain integration',
        'SSL certificates included for security',
        'Contact forms with lead capture',
        'Service pages and portfolio sections',
        'Blog functionality for content marketing',
        'Analytics and visitor tracking'
      ],
      mockup: {
        title: 'Professional Website Builder',
        items: [
          { name: 'Homepage', status: 'Live', visitors: '1,245' },
          { name: 'Services Page', status: 'Live', visitors: '890' },
          { name: 'Contact Page', status: 'Live', visitors: '456' }
        ]
      }
    },
    email: {
      name: 'Business Email System',
      description: 'Professional email addresses with your domain, plus advanced marketing automation.',
      benefits: [
        'Professional @yourbusiness.com email addresses',
        'Email marketing campaigns with templates',
        'Automated drip sequences for lead nurturing',
        'Advanced analytics and open/click tracking',
        'Integration with CRM for unified communications',
        'Mobile email apps for iOS and Android',
        'Spam protection and email security',
        'Team collaboration and shared inboxes'
      ],
      mockup: {
        title: 'Email Campaign Dashboard',
        items: [
          { name: 'Welcome Sequence', sent: '1,234', opened: '45%' },
          { name: 'Monthly Newsletter', sent: '892', opened: '38%' },
          { name: 'Service Promotion', sent: '567', opened: '52%' }
        ]
      }
    },
    booking: {
      name: 'Online Booking System',
      description: 'Let clients schedule appointments automatically with integrated calendar management.',
      benefits: [
        'Automated appointment scheduling 24/7',
        'Calendar integration with Google/Outlook',
        'Customizable booking forms and questions',
        'Automatic email confirmations and reminders',
        'Payment collection at time of booking',
        'Timezone handling for remote consultations',
        'Cancellation and rescheduling policies',
        'Team scheduling for multiple staff members'
      ],
      mockup: {
        title: 'Appointment Scheduler',
        items: [
          { name: 'Initial Consultation', duration: '60 min', booked: 12 },
          { name: 'Follow-up Meeting', duration: '30 min', booked: 8 },
          { name: 'Document Review', duration: '45 min', booked: 5 }
        ]
      }
    },
    ai: {
      name: 'AI Business Assistant',
      description: 'Intelligent automation to handle routine tasks and provide business insights.',
      benefits: [
        'Automated email responses and categorization',
        'Smart document analysis and summarization',
        'Predictive analytics for business trends',
        'Intelligent lead scoring and prioritization',
        'Automated appointment scheduling suggestions',
        'Content generation for marketing materials',
        'Risk assessment and compliance monitoring',
        'Custom AI workflows for your industry'
      ],
      mockup: {
        title: 'AI Business Insights',
        items: [
          { name: 'Lead Score Analysis', accuracy: '94%', leads: 156 },
          { name: 'Document Processing', processed: 1240, time: '2.3s avg' },
          { name: 'Email Auto-Response', responses: 89, satisfaction: '4.8/5' }
        ]
      }
    }
  }

  return (
    <>
      <Head>
        <title>Features - StackPro | Complete Business Platform Capabilities</title>
        <meta name="description" content="Explore StackPro's comprehensive business features: CRM, secure file sharing, professional websites, email marketing, booking systems, and AI automation." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>


      <Navigation currentPage="/features" />
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="text-primary font-semibold">Features</Link>
              <Link href="/pricing" className="text-muted hover:text-primary transition-colors">Pricing</Link>
              <Link href="/industries/law-firms" className="text-muted hover:text-primary transition-colors">Use Cases</Link>
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
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything Your Business Needs in One Platform
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Powerful business tools that work together seamlessly. No more juggling multiple apps or paying for scattered solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all">
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Navigation */}
        <section className="py-8 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(features).map(([key, feature]) => (
                <button
                  key={key}
                  onClick={() => setActiveFeature(key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    activeFeature === key
                      ? 'bg-primary text-white'
                      : 'bg-[color:var(--border)] text-foreground hover:bg-muted/20'
                  }`}
                >
                  {feature.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Feature Details */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Feature Description */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  {features[activeFeature].name}
                </h2>
                <p className="text-lg text-muted mb-8">
                  {features[activeFeature].description}
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Key Benefits:
                </h3>
                <ul className="space-y-3">
                  {features[activeFeature].benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-accent mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Mockup */}
              <div className="lg:order-last">
                <div className="bg-background rounded-lg shadow-2xl p-6 border border-border">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white mb-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {features[activeFeature].mockup.title}
                    </h3>
                    <div className="space-y-3">
                      {features[activeFeature].mockup.items.map((item, index) => (
                        <div key={index} className="bg-white bg-opacity-20 rounded p-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-white/80">
                              {item.status || item.files || item.visitors || item.opened || item.duration || item.accuracy}
                              {item.files && ' files'}
                              {item.visitors && ' views'}
                              {item.opened && ' open rate'}
                              {item.duration && ' duration'}
                              {item.accuracy && ' accuracy'}
                            </span>
                          </div>
                          {item.size && (
                            <div className="text-xs text-white/70 mt-1">{item.size}</div>
                          )}
                          {item.value && (
                            <div className="text-xs text-accent mt-1">{item.value}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mock stats */}
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {activeFeature === 'crm' ? '47' : 
                         activeFeature === 'files' ? '1.2TB' :
                         activeFeature === 'website' ? '99.9%' :
                         activeFeature === 'email' ? '42%' :
                         activeFeature === 'booking' ? '156' : '94%'}
                      </div>
                      <div className="text-foreground font-semibold">
                        {activeFeature === 'crm' ? 'Active Deals' : 
                         activeFeature === 'files' ? 'Storage Used' :
                         activeFeature === 'website' ? 'Uptime' :
                         activeFeature === 'email' ? 'Open Rate' :
                         activeFeature === 'booking' ? 'Bookings' : 'Accuracy'}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-accent">
                        {activeFeature === 'crm' ? '+24%' : 
                         activeFeature === 'files' ? '100%' :
                         activeFeature === 'website' ? '2.3s' :
                         activeFeature === 'email' ? '1,847' :
                         activeFeature === 'booking' ? '4.8★' : '2.3s'}
                      </div>
                      <div className="text-foreground font-semibold">
                        {activeFeature === 'crm' ? 'Growth' : 
                         activeFeature === 'files' ? 'Security' :
                         activeFeature === 'website' ? 'Load Time' :
                         activeFeature === 'email' ? 'Subscribers' :
                         activeFeature === 'booking' ? 'Rating' : 'Processing'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Seamless Integration
              </h2>
              <p className="text-xl text-muted">
                All features work together automatically - no complex setup or data syncing required
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-3xl mb-4">🔗</div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Unified Data</h3>
                <p className="text-muted">
                  Customer information, files, and communications all sync automatically across every feature.
                </p>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Real-Time Updates</h3>
                <p className="text-muted">
                  Changes in one area instantly reflect everywhere - no delays or manual updates needed.
                </p>
              </div>

              <div className="bg-background rounded-lg shadow-lg p-6 text-center border border-border">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Single Dashboard</h3>
                <p className="text-muted">
                  Manage everything from one central location - no switching between different apps or logins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                StackPro vs. Multiple Tools
              </h2>
              <p className="text-xl text-muted">
                Stop paying for and managing separate tools. Get everything integrated for less.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-danger/10 rounded-lg p-8 border border-danger/20">
                <h3 className="text-xl font-semibold text-danger mb-6 text-center">
                  Using Separate Tools
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-danger">
                    <span className="text-foreground">CRM Software</span>
                    <span className="text-danger font-semibold">$99/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-danger">
                    <span className="text-foreground">File Storage</span>
                    <span className="text-danger font-semibold">$50/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-danger">
                    <span className="text-foreground">Website Builder</span>
                    <span className="text-danger font-semibold">$39/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-danger">
                    <span className="text-foreground">Email Marketing</span>
                    <span className="text-danger font-semibold">$79/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-danger">
                    <span className="text-foreground">Booking System</span>
                    <span className="text-danger font-semibold">$49/mo</span>
                  </div>
                  <div className="border-t-2 border-danger pt-4 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span className="text-foreground">Total Cost:</span>
                      <span className="text-danger">$316/mo</span>
                    </div>
                    <div className="text-danger text-center mt-2">+ Integration headaches</div>
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 rounded-lg p-8 border border-accent/20">
                <h3 className="text-xl font-semibold text-accent mb-6 text-center">
                  With StackPro
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-accent">
                    <span className="text-foreground">Complete CRM</span>
                    <span className="text-accent font-semibold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-accent">
                    <span className="text-foreground">Secure File Portal</span>
                    <span className="text-accent font-semibold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-accent">
                    <span className="text-foreground">Professional Website</span>
                    <span className="text-accent font-semibold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-accent">
                    <span className="text-foreground">Email Marketing</span>
                    <span className="text-accent font-semibold">✓ Included</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded border-l-4 border-accent">
                    <span className="text-foreground">Booking System</span>
                    <span className="text-accent font-semibold">✓ Included</span>
                  </div>
                  <div className="border-t-2 border-accent pt-4 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span className="text-foreground">Total Cost:</span>
                      <span className="text-accent">$299/mo</span>
                    </div>
                    <div className="text-accent text-center mt-2">+ Everything integrated</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="bg-secondary text-white p-6 rounded-lg inline-block">
                <div className="text-2xl font-bold">Save $17/month + Get Better Integration</div>
                <div className="text-white/80">That's $204 saved per year, plus no integration headaches</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Experience All These Features?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Start your free trial and see how StackPro can transform your business operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-primary px-8 py-4 rounded-lg hover:opacity-90 transition-colors font-semibold text-lg">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary transition-colors font-semibold text-lg">
                Schedule Demo
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-4">
              ⚡ 7-day free trial • 🔒 No credit card required • 📞 Setup assistance included
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
                Professional business tools in minutes, not months.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Use Cases</h4>
              <ul className="space-y-2">
                <li><Link href="/industries/law-firms" className="text-white/70 hover:text-white transition-colors">Law Firms</Link></li>
                <li><Link href="/industries/law-firms" className="text-white/70 hover:text-white transition-colors">Real Estate</Link></li>
                <li><Link href="/industries/agencies" className="text-white/70 hover:text-white transition-colors">Consulting</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-white/70">&copy; 2025 StackPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
