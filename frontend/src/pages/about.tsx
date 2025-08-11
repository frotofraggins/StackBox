import Head from 'next/head'
import Link from 'next/link'
import ThemeToggle from '../components/theme/ThemeToggle'

export default function About() {
  return (
    <>
      <Head>
        <title>About StackPro - Our Mission to Simplify Business Technology</title>
        <meta name="description" content="Learn about StackPro's mission to help small businesses get professional tools in minutes, not months. Founded to eliminate technology barriers for service-based businesses." />
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
              <Link href="/law-firms" className="text-muted hover:text-primary transition-colors">Use Cases</Link>
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
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Mission: Professional Business Tools for Everyone
            </h1>
            <p className="text-xl text-muted mb-8">
              We believe every small business deserves enterprise-grade technology without the enterprise complexity or cost.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-8">Our Story</h2>
              
              <p className="text-lg text-foreground leading-relaxed mb-6">
                StackPro was born from a simple frustration: <strong className="text-primary">small businesses shouldn't need to become technology experts to run professional operations</strong>.
              </p>

              <p className="text-lg text-foreground leading-relaxed mb-6">
                After working with hundreds of law firms, real estate agencies, and consulting practices, we saw the same pattern everywhere:
              </p>

              <div className="bg-danger/10 border-l-4 border-danger p-6 mb-8 rounded-r-lg">
                <ul className="space-y-2 text-foreground">
                  <li>• Using 5+ different software tools that don't talk to each other</li>
                  <li>• Paying thousands per month for scattered solutions</li>
                  <li>• Spending more time managing technology than serving clients</li>
                  <li>• Looking unprofessional due to outdated websites and communication</li>
                  <li>• Losing clients due to poor file sharing and project management</li>
                </ul>
              </div>

              <p className="text-lg text-foreground leading-relaxed mb-6">
                <strong className="text-primary">There had to be a better way.</strong>
              </p>

              <p className="text-lg text-foreground leading-relaxed mb-6">
                So we built StackPro: a complete business platform that gives small businesses everything they need in one integrated solution. No more juggling multiple tools, no more technology headaches, no more looking unprofessional.
              </p>

              <div className="bg-success/10 border-l-4 border-success p-6 mb-8 rounded-r-lg">
                <p className="text-lg text-success font-semibold mb-2">Our Promise:</p>
                <p className="text-foreground">
                  Professional business tools in <strong className="text-success">minutes, not months</strong>. 
                  Setup that takes 20 minutes, not 20 weeks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-[color:var(--border)]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Our Values
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background rounded-xl shadow-lg p-8 text-center border border-border hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Simplicity First</h3>
                <p className="text-muted">
                  Technology should work for you, not against you. We build tools that are powerful yet simple to use.
                </p>
              </div>

              <div className="bg-background rounded-xl shadow-lg p-8 text-center border border-border hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💼</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Professional Grade</h3>
                <p className="text-muted">
                  Small businesses deserve enterprise-quality tools. We don't compromise on security, reliability, or performance.
                </p>
              </div>

              <div className="bg-background rounded-xl shadow-lg p-8 text-center border border-border hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Customer Success</h3>
                <p className="text-muted">
                  Your success is our success. We're not just a software provider - we're your technology partner.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Meet the Founder
              </h2>
            </div>

            <div className="bg-background rounded-xl shadow-xl p-8 border border-border">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">NF</span>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Nathan Flournoy</h3>
                  <p className="text-primary font-semibold mb-4">Founder & CEO</p>
                  
                  <p className="text-foreground mb-4">
                    With over a decade of experience building technology solutions for small businesses, 
                    Nathan founded StackPro after seeing how technology complexity was holding back 
                    service-based businesses from reaching their full potential.
                  </p>
                  
                  <p className="text-foreground mb-4">
                    Previously, Nathan built custom solutions for law firms, real estate agencies, and 
                    consulting practices, consistently seeing the same challenges: scattered tools, 
                    high costs, and technology that hindered rather than helped.
                  </p>
                  
                  <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
                    <p className="text-foreground italic">
                      "Every small business owner should focus on what they do best - serving their clients. 
                      StackPro handles the technology so you can focus on growing your business."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                StackPro by the Numbers
              </h2>
              <p className="text-white/80 text-lg">
                Trusted by growing businesses nationwide
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-white/80">Businesses Served</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-white/80">Uptime</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/80">Support</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-4xl font-bold text-white mb-2">20 min</div>
                <div className="text-white/80">Average Setup Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Why We Exist
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-danger/5 rounded-lg p-6 border border-danger/20">
                <h3 className="text-xl font-semibold text-danger mb-4">The Problem</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• 73% of small businesses use 5+ disconnected tools</li>
                  <li>• Average setup time for business systems: 6+ months</li>
                  <li>• 68% of service businesses lose clients due to poor tech</li>
                  <li>• Small businesses spend 40% of time on admin, not clients</li>
                </ul>
              </div>

              <div className="bg-success/5 rounded-lg p-6 border border-success/20">
                <h3 className="text-xl font-semibold text-success mb-4">Our Solution</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• ✅ One integrated platform for everything</li>
                  <li>• ✅ 20-minute setup, not 6 months</li>
                  <li>• ✅ Professional appearance that impresses clients</li>
                  <li>• ✅ Spend 90% of time serving clients, not managing tech</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-primary to-secondary">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join hundreds of businesses already using StackPro to serve clients better
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-primary px-8 py-4 rounded-lg hover:opacity-90 transition-all font-semibold text-lg">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary transition-all font-semibold text-lg">
                Schedule Demo
              </Link>
            </div>
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
                <li><Link href="/#features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
                <li><a href="mailto:hello@stackpro.io" className="text-white/70 hover:text-white transition-colors">hello@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-white/70 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Support</Link></li>
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
