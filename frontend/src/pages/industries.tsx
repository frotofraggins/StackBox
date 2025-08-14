import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';

export default function Industries() {
  const industries = [
    {
      slug: 'law-firms',
      title: 'Law Firms',
      description: 'Secure client portals, document management, and case organization built for legal professionals.',
      icon: '⚖️',
      features: ['Client Portals', 'Document Security', 'Case Management', 'Legal Compliance'],
      stats: { clients: '500+', satisfaction: '98%', time_saved: '15hrs/week' }
    },
    {
      slug: 'contractors',
      title: 'Construction & Contractors',
      description: 'Project management, client communication, and business tools for construction professionals.',
      icon: '🏗️',
      features: ['Project Tracking', 'Client Communication', 'Invoice Management', 'Photo Documentation'],
      stats: { clients: '1,200+', satisfaction: '96%', time_saved: '12hrs/week' }
    },
    {
      slug: 'agencies',
      title: 'Creative Agencies',
      description: 'Creative project management, client collaboration, and workflow optimization for agencies.',
      icon: '🎨',
      features: ['Creative Workflows', 'Client Collaboration', 'Asset Management', 'Project Timelines'],
      stats: { clients: '300+', satisfaction: '97%', time_saved: '18hrs/week' }
    },
    {
      slug: 'marketing-agencies',
      title: 'Marketing Agencies',
      description: 'AI-powered CRM, automation tools, and ROI tracking designed for marketing agencies and consultants.',
      icon: '📈',
      features: ['AI Assistant', 'Lead Management', 'ROI Tracking', 'Client Reporting'],
      stats: { clients: '800+', satisfaction: '99%', time_saved: '20hrs/week' }
    }
  ];

  return (
    <>
      <Head>
        <title>Industry Solutions | StackPro - Tailored Business Platforms</title>
        <meta name="description" content="Discover StackPro's industry-specific solutions for law firms, contractors, and creative agencies. Professional business platforms tailored to your industry needs." />
        <meta name="keywords" content="industry solutions, law firm software, contractor management, creative agency tools, business platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://stackpro.io/industries" />
      </Head>

      <Navigation currentPage="/industries" />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="section-spacing bg-surface">
          <div className="container-custom text-center">
            <h1 className="text-h1 text-foreground mb-6">
              Industry-Specific Business Solutions
            </h1>
            <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
              StackPro adapts to your industry's unique needs. From legal compliance to construction project management, 
              we provide specialized tools that understand your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn btn-primary">
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all">
                Book a Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-foreground mb-4">
                Built for Your Industry
              </h2>
              <p className="text-xl text-muted">
                Specialized features and workflows designed for your specific business needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {industries.map((industry) => (
                <div key={industry.slug} className="card p-8 text-center hover:shadow-[var(--shadow-2)] transition-all">
                  <div className="text-6xl mb-6">{industry.icon}</div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{industry.title}</h3>
                  <p className="text-muted mb-6">{industry.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">Key Features:</h4>
                    <ul className="space-y-2">
                      {industry.features.map((feature) => (
                        <li key={feature} className="text-muted flex items-center justify-center">
                          <span className="text-accent mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-surface-2 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-bold text-primary">{industry.stats.clients}</div>
                        <div className="text-sm text-muted">Clients</div>
                      </div>
                      <div>
                        <div className="font-bold text-accent">{industry.stats.satisfaction}</div>
                        <div className="text-sm text-muted">Satisfaction</div>
                      </div>
                      <div>
                        <div className="font-bold text-secondary">{industry.stats.time_saved}</div>
                        <div className="text-sm text-muted">Time Saved</div>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/industries/${industry.slug}`}
                    className="btn btn-primary w-full"
                  >
                    Learn More
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Industry-Specific */}
        <section className="section-spacing bg-surface">
          <div className="container-custom">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-h2 text-foreground mb-6">
                  Why Industry-Specific Matters
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Built-in Compliance</h3>
                      <p className="text-muted">Industry-specific security, privacy, and regulatory compliance built right in.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-secondary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Specialized Workflows</h3>
                      <p className="text-muted">Pre-configured processes that match how your industry actually works.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-accent text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Faster Setup</h3>
                      <p className="text-muted">Get up and running in minutes, not months, with industry templates.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-surface-2 rounded-lg p-8">
                <h3 className="text-xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
                <p className="text-muted mb-6">
                  Join thousands of professionals who've streamlined their business with StackPro's industry-specific solutions.
                </p>
                <div className="space-y-4">
                  <Link href="/signup" className="btn btn-primary">
                    Start Your Free Trial
                  </Link>
                  <Link href="/contact" className="btn bg-transparent text-primary border border-primary hover:bg-primary hover:text-white transition-all">
                    Schedule a Demo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom text-center">
            <h2 className="text-h2 text-foreground mb-12">
              Trusted by Industry Leaders
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6">
                <div className="text-4xl mb-4">⚖️</div>
                <blockquote className="text-muted italic mb-4">
                  "StackPro transformed our client communication. We're more organized and professional than ever."
                </blockquote>
                <div className="font-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-muted">Managing Partner, Chen & Associates Law</div>
              </div>
              <div className="card p-6">
                <div className="text-4xl mb-4">🏗️</div>
                <blockquote className="text-muted italic mb-4">
                  "Finally, a platform that understands construction. Our projects run smoother and clients are happier."
                </blockquote>
                <div className="font-semibold text-foreground">Mike Rodriguez</div>
                <div className="text-sm text-muted">Owner, Rodriguez Construction</div>
              </div>
              <div className="card p-6">
                <div className="text-4xl mb-4">🎨</div>
                <blockquote className="text-muted italic mb-4">
                  "StackPro streamlined our creative workflow. We deliver projects faster and with better client collaboration."
                </blockquote>
                <div className="font-semibold text-foreground">Emma Thompson</div>
                <div className="text-sm text-muted">Creative Director, Thompson Design Studio</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
