import Head from 'next/head'
import Link from 'next/link'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - StackPro</title>
        <meta name="description" content="StackPro Privacy Policy. How we collect, use, and protect your personal information and business data." />
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
              <Link href="/industries/law-firms" className="text-muted hover:text-secondary">Use Cases</Link>
              <Link href="/contact" className="text-muted hover:text-secondary">Support</Link>
            </nav>
            <Link href="/pricing" className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Header */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted">
              Last updated: January 1, 2025
            </p>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              <h2>1. Information We Collect</h2>
              <div>
                <h3>1.1 Information You Provide</h3>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, company name, and billing details</li>
                  <li><strong>Business Data:</strong> Customer information, files, communications, and other content you upload</li>
                  <li><strong>Payment Information:</strong> Credit card details processed securely through Stripe</li>
                  <li><strong>Communications:</strong> Messages you send to our support team or through the platform</li>
                </ul>

                <h3>1.2 Information We Collect Automatically</h3>
                <ul>
                  <li><strong>Usage Data:</strong> How you use our service, features accessed, and time spent</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                  <li><strong>Log Data:</strong> Access logs, error reports, and performance metrics</li>
                  <li><strong>Cookies:</strong> Small files stored on your device to enhance your experience</li>
                </ul>
              </div>

              <h2>2. How We Use Your Information</h2>
              <div>
                <h3>2.1 To Provide Our Service</h3>
                <ul>
                  <li>Create and maintain your account</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Enable core platform features like CRM, file sharing, and email marketing</li>
                </ul>

                <h3>2.2 To Improve Our Service</h3>
                <ul>
                  <li>Analyze usage patterns to enhance functionality</li>
                  <li>Develop new features and improvements</li>
                  <li>Monitor and maintain service performance</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>

                <h3>2.3 To Communicate With You</h3>
                <ul>
                  <li>Send service updates and important notifications</li>
                  <li>Provide customer support</li>
                  <li>Share product updates and educational content (with your consent)</li>
                  <li>Respond to your questions and feedback</li>
                </ul>
              </div>

              <h2>3. Information Sharing and Disclosure</h2>
              <div>
                <h3>3.1 We Do Not Sell Your Data</h3>
                <p>
                  We never sell, rent, or trade your personal information or business data to third parties for their marketing purposes.
                </p>

                <h3>3.2 Service Providers</h3>
                <p>We may share information with trusted service providers who help us operate our business:</p>
                <ul>
                  <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
                  <li><strong>Cloud Infrastructure:</strong> AWS for hosting and data storage</li>
                  <li><strong>Email Services:</strong> AWS SES for transactional emails</li>
                  <li><strong>Analytics:</strong> Usage analytics to improve our service</li>
                </ul>

                <h3>3.3 Legal Requirements</h3>
                <p>We may disclose information if required by law or to protect our rights and users.</p>
              </div>

              <h2>4. Data Security</h2>
              <div>
                <h3>4.1 Security Measures</h3>
                <ul>
                  <li><strong>Encryption:</strong> Data encrypted in transit and at rest</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication</li>
                  <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
                  <li><strong>Monitoring:</strong> 24/7 security monitoring and incident response</li>
                </ul>

                <h3>4.2 Data Centers</h3>
                <p>
                  Your data is stored in secure AWS data centers with enterprise-grade physical and network security.
                </p>
              </div>

              <h2>5. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active and for a reasonable period afterward 
                to comply with legal obligations and resolve disputes. You can request data deletion as described below.
              </p>

              <h2>6. Your Privacy Rights</h2>
              <div>
                <h3>6.1 Access and Control</h3>
                <ul>
                  <li><strong>Access:</strong> View and export your data through your account settings</li>
                  <li><strong>Update:</strong> Modify your personal information at any time</li>
                  <li><strong>Delete:</strong> Request deletion of your account and data</li>
                  <li><strong>Portability:</strong> Export your data in standard formats</li>
                </ul>

                <h3>6.2 Communication Preferences</h3>
                <p>
                  You can opt out of marketing communications while continuing to receive important service updates.
                </p>
              </div>

              <h2>7. Cookies and Tracking</h2>
              <div>
                <h3>7.1 Types of Cookies</h3>
                <ul>
                  <li><strong>Essential:</strong> Required for the service to function properly</li>
                  <li><strong>Functional:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics:</strong> Help us understand how you use our service</li>
                </ul>

                <h3>7.2 Cookie Control</h3>
                <p>
                  You can control cookies through your browser settings, though some features may not work properly if disabled.
                </p>
              </div>

              <h2>8. International Data Transfers</h2>
              <p>
                Your data may be processed in countries where we or our service providers operate. 
                We ensure appropriate safeguards are in place for international transfers.
              </p>

              <h2>9. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 16. We do not knowingly collect 
                personal information from children under 16.
              </p>

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of material changes 
                via email or service notifications. Your continued use constitutes acceptance of the updated policy.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-surface-2 p-6 rounded-lg">
                <p><strong>StackPro Privacy Team</strong><br />
                Email: privacy@stackpro.io<br />
                <Link href="/contact" className="text-secondary hover:text-blue-700">Contact Page</Link></p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Data, Your Control</h3>
                <p className="text-blue-700">
                  We believe in transparency and giving you control over your data. 
                  You can access, modify, or delete your information at any time through your account settings 
                  or by contacting our support team.
                </p>
              </div>
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
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
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
                <li><Link href="/privacy" className="text-blue-400">Privacy</Link></li>
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
