import Head from 'next/head'
import Link from 'next/link'

export default function CookiePolicy() {
  return (
    <>
      <Head>
        <title>Cookie Policy - StackPro | How We Use Cookies</title>
        <meta name="description" content="Learn about how StackPro uses cookies to improve your experience on our website and platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-secondary">
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="text-muted hover:text-secondary">Features</Link>
              <Link href="/pricing" className="text-muted hover:text-secondary">Pricing</Link>
              <Link href="/support" className="text-muted hover:text-secondary">Support</Link>
            </nav>
            <Link href="/" className="text-muted hover:text-gray-900">← Back to Home</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Cookie Policy
          </h1>
          
          <div className="text-sm text-gray-500 mb-8">
            Last updated: January 1, 2025
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What Are Cookies</h2>
            <p className="text-muted mb-6">
              Cookies are small text files that are stored on your computer or mobile device when you visit our website. 
              They allow our website to remember your preferences and provide you with a better user experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">How We Use Cookies</h2>
            <p className="text-muted mb-6">
              StackPro uses cookies for the following purposes:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Essential Cookies</h3>
              <p className="text-blue-800 mb-3">
                These cookies are necessary for the website to function properly and cannot be disabled.
              </p>
              <ul className="list-disc pl-5 text-blue-800 space-y-1">
                <li>Authentication and security</li>
                <li>Shopping cart functionality</li>
                <li>Form submissions</li>
                <li>Session management</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Analytics Cookies</h3>
              <p className="text-green-800 mb-3">
                These cookies help us understand how visitors interact with our website.
              </p>
              <ul className="list-disc pl-5 text-green-800 space-y-1">
                <li>Google Analytics (anonymous usage data)</li>
                <li>Page views and user behavior</li>
                <li>Performance monitoring</li>
                <li>Error tracking and debugging</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Marketing Cookies</h3>
              <p className="text-purple-800 mb-3">
                These cookies are used to provide you with relevant advertisements and marketing content.
              </p>
              <ul className="list-disc pl-5 text-purple-800 space-y-1">
                <li>Tracking conversion from ads</li>
                <li>Retargeting campaigns</li>
                <li>Social media integration</li>
                <li>Email campaign tracking</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">Preference Cookies</h3>
              <p className="text-orange-800 mb-3">
                These cookies remember your preferences to enhance your experience.
              </p>
              <ul className="list-disc pl-5 text-orange-800 space-y-1">
                <li>Language preferences</li>
                <li>Theme settings (dark/light mode)</li>
                <li>Dashboard customization</li>
                <li>Remember login preferences</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Third-Party Cookies</h2>
            <p className="text-muted mb-4">
              We may also use third-party cookies from trusted partners:
            </p>
            <ul className="list-disc pl-5 text-muted mb-6 space-y-2">
              <li><strong>Google Analytics:</strong> To analyze website traffic and user behavior</li>
              <li><strong>Stripe:</strong> For secure payment processing and fraud prevention</li>
              <li><strong>Intercom:</strong> For customer support chat functionality</li>
              <li><strong>Hotjar:</strong> For user experience analysis and heatmaps</li>
              <li><strong>Facebook Pixel:</strong> For advertising and conversion tracking</li>
              <li><strong>LinkedIn Insight:</strong> For professional advertising campaigns</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Managing Your Cookie Preferences</h2>
            <p className="text-muted mb-4">
              You have several options to control cookies:
            </p>

            <div className="bg-surface-2 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
              <p className="text-muted mb-3">
                Most web browsers allow you to control cookies through their settings:
              </p>
              <ul className="list-disc pl-5 text-muted space-y-1">
                <li>Accept or reject all cookies</li>
                <li>Delete existing cookies</li>
                <li>Block third-party cookies</li>
                <li>Set cookie preferences for specific websites</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Cookie Consent Manager</h3>
              <p className="text-blue-800 mb-3">
                When you first visit our website, you can choose your cookie preferences through our consent banner. 
                You can change these preferences at any time by:
              </p>
              <ul className="list-disc pl-5 text-blue-800 space-y-1">
                <li>Clicking the "Cookie Preferences" link in our footer</li>
                <li>Accessing cookie settings in your account dashboard</li>
                <li>Contacting our support team at <a href="mailto:privacy@stackpro.io" className="text-secondary hover:underline">privacy@stackpro.io</a></li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Cookie Retention</h2>
            <p className="text-muted mb-4">
              Different cookies are stored for different periods:
            </p>
            <ul className="list-disc pl-5 text-muted mb-6 space-y-2">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain until expiry date or manual deletion</li>
              <li><strong>Authentication Cookies:</strong> Expire after 30 days of inactivity</li>
              <li><strong>Analytics Cookies:</strong> Retained for up to 26 months (Google Analytics)</li>
              <li><strong>Marketing Cookies:</strong> Typically expire after 30-90 days</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">International Transfers</h2>
            <p className="text-muted mb-6">
              Some of our third-party cookie providers may transfer data outside the European Union. 
              We ensure these transfers comply with applicable data protection laws through appropriate safeguards 
              such as Standard Contractual Clauses or adequacy decisions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Updates to This Policy</h2>
            <p className="text-muted mb-6">
              We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any significant changes by posting the updated policy on our website with a new "Last Updated" date.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact Us</h2>
            <p className="text-muted mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <div className="bg-surface-2 border border-gray-200 rounded-lg p-6 mb-6">
              <ul className="text-muted space-y-2">
                <li><strong>Email:</strong> <a href="mailto:privacy@stackpro.io" className="text-secondary hover:underline">privacy@stackpro.io</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@stackpro.io" className="text-secondary hover:underline">support@stackpro.io</a></li>
                <li><strong>Address:</strong> StackPro Inc., 123 Business Ave, Tech City, TC 12345</li>
                <li><strong>Phone:</strong> <a href="tel:+15551234567" className="text-secondary hover:underline">(555) 123-4567</a></li>
              </ul>
            </div>

            <div className="mt-8 p-4 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> By continuing to use our website, you consent to our use of cookies as described in this policy. 
                You can withdraw your consent at any time by adjusting your browser settings or contacting us directly.
              </p>
            </div>
          </div>
        </div>
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
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><a href="mailto:support@stackpro.io" className="hover:text-white">support@stackpro.io</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/cookie-policy" className="text-blue-400">Cookies</Link></li>
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
