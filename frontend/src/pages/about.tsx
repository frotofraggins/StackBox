import Head from 'next/head'
import Link from 'next/link'

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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/#features" className="text-gray-700 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
              <Link href="/law-firms" className="text-gray-700 hover:text-blue-600">Use Cases</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600">Support</Link>
            </nav>
            <Link href="/pricing" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Our Mission: Professional Business Tools for Everyone
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We believe every small business deserves enterprise-grade technology without the enterprise complexity or cost.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Story</h2>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                StackPro was born from a simple frustration: <strong>small businesses shouldn't need to become technology experts to run professional operations</strong>.
              </p>

              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                After working with hundreds of law firms, real estate agencies, and consulting practices, we saw the same pattern everywhere:
              </p>

              <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
                <ul className="space-y-2 text-gray-700">
                  <li>• Using 5+ different software tools that don't talk to each other</li>
                  <li>• Paying thousands per month for scattered solutions</li>
                  <li>• Spending more time managing technology than serving clients</li>
                  <li>• Looking unprofessional due to outdated websites and communication</li>
                  <li>• Losing clients due to poor file sharing and project management</li>
                </ul>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                <strong>There had to be a better way.</strong>
              </p>

              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                So we built StackPro: a complete business platform that gives small businesses everything they need in one integrated solution. No more juggling multiple tools, no more technology headaches, no more looking unprofessional.
              </p>

              <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8">
                <p className="text-lg text-green-800 font-semibold mb-2">Our Promise:</p>
                <p className="text-green-700">
                  Professional business tools in <strong>minutes, not months</strong>. 
                  Setup that takes 20 minutes, not 20 weeks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-4">Simplicity First</h3>
                <p className="text-gray-600">
                  Technology should work for you, not against you. We build tools that are powerful yet simple to use.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-xl font-semibold mb-4">Professional Grade</h3>
                <p className="text-gray-600">
                  Small businesses deserve enterprise-quality tools. We don't compromise on security, reliability, or performance.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold mb-4">Customer Success</h3>
                <p className="text-gray-600">
                  Your success is our success. We're not just a software provider - we're your technology partner.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Meet the Founder
              </h2>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">NF</span>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nathan Flournoy</h3>
                  <p className="text-blue-600 font-semibold mb-4">Founder & CEO</p>
                  
                  <p className="text-gray-700 mb-4">
                    With over a decade of experience building technology solutions for small businesses, 
                    Nathan founded StackPro after seeing how technology complexity was holding back 
                    service-based businesses from reaching their full potential.
                  </p>
                  
                  <p className="text-gray-700 mb-4">
                    Previously, Nathan built custom solutions for law firms, real estate agencies, and 
                    consulting practices, consistently seeing the same challenges: scattered tools, 
                    high costs, and technology that hindered rather than helped.
                  </p>
                  
                  <p className="text-gray-700">
                    "Every small business owner should focus on what they do best - serving their clients. 
                    StackPro handles the technology so you can focus on growing your business."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                StackPro by the Numbers
              </h2>
              <p className="text-blue-100 text-lg">
                Trusted by growing businesses nationwide
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-100">Businesses Served</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-blue-100">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-blue-100">Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">20 min</div>
                <div className="text-blue-100">Average Setup Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of businesses already using StackPro to serve clients better
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
                Start Free Trial
              </Link>
              <Link href="/contact" className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg">
                Schedule Demo
              </Link>
            </div>
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
                Professional business tools in minutes, not months.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/contact" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="mailto:hello@stackpro.io" className="hover:text-white">hello@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/contact" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>&copy; 2025 StackPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
