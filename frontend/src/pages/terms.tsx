import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - StackPro</title>
        <meta name="description" content="StackPro Terms of Service and user agreement. Professional business platform terms and conditions." />
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
              <Link href="/features" className="nav-link">Features</Link>
              <Link href="/pricing" className="nav-link">Pricing</Link>
              <Link href="/law-firms" className="nav-link">Use Cases</Link>
              <Link href="/contact" className="nav-link">Support</Link>
            </nav>
            <Link href="/pricing" className="btn-primary">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Header */}
        <section className="bg-gradient-dark py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-text-light mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-text-light/80">
              Last updated: January 1, 2025
            </p>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="py-8 bg-primary/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card text-center">
              <h2 className="text-2xl font-bold text-text-light mb-4">📋 Quick Summary</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="text-3xl mb-2">✅</div>
                  <h3 className="font-semibold text-text-light mb-2">You Own Your Data</h3>
                  <p className="text-text-secondary">Your customer data, files, and content belong entirely to you</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-semibold text-text-light mb-2">Fair Pricing</h3>
                  <p className="text-text-secondary">No surprise fees, cancel anytime, 7-day free trial</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">🔒</div>
                  <h3 className="font-semibold text-text-light mb-2">Your Privacy</h3>
                  <p className="text-text-secondary">We protect your data with bank-level security</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              
              <div className="card">
                <h2 className="text-2xl font-bold text-text-light mb-4">1. Acceptance of Terms</h2>
                <p className="text-text-secondary leading-relaxed">
                  By accessing and using StackPro ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-text-light mb-4">2. Description of Service</h2>
                <p className="text-text-secondary leading-relaxed">
                  StackPro provides a comprehensive business platform that includes customer relationship management (CRM), 
                  file sharing, professional websites, email marketing, booking systems, and related business tools 
                  ("the Platform"). The Service is provided on a subscription basis.
                </p>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-text-light mb-4">3. User Account and Registration</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">3.1 Account Creation</h3>
                    <p className="text-text-secondary leading-relaxed">
                      To use the Service, you must create an account by providing accurate, current, and complete information. 
                      You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">3.2 Account Responsibilities</h3>
                    <ul className="text-text-secondary leading-relaxed space-y-2">
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>You must provide accurate and complete registration information</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>You are responsible for maintaining the security of your account</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>You must notify us immediately of any unauthorized use of your account</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>You are responsible for all activities that occur under your account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-text-light mb-4">4. Subscription and Payment Terms</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">4.1 Subscription Plans</h3>
                    <p className="text-text-secondary leading-relaxed">
                      StackPro offers multiple subscription plans with different features and pricing. 
                      Current plans and pricing are available on our <Link href="/pricing" className="text-primary hover:text-primary-hover underline">pricing page</Link>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">4.2 Payment</h3>
                    <ul className="text-text-secondary leading-relaxed space-y-2">
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>Subscription fees are billed in advance on a monthly or annual basis</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>All fees are non-refundable except as expressly stated in these terms</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>Prices may change with 30 days advance notice</li>
                      <li className="flex items-start"><span className="text-primary mr-2">•</span>Failed payments may result in service suspension or termination</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">4.3 Free Trial</h3>
                    <p className="text-text-secondary leading-relaxed">
                      New users may be eligible for a free trial period. During the trial, you have access to the features 
                      of your selected plan. At the end of the trial period, you will be charged for your selected subscription 
                      unless you cancel before the trial ends.
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold text-text-light mb-4">5. Acceptable Use Policy</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">5.1 Permitted Use</h3>
                    <p className="text-text-secondary leading-relaxed">
                      You may use the Service only for lawful purposes and in accordance with these Terms. 
                      You agree to comply with all applicable laws, regulations, and third-party terms.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-light mb-2">5.2 Prohibited Activities</h3>
                    <p className="text-text-secondary leading-relaxed mb-3">You agree not to:</p>
                    <ul className="text-text-secondary leading-relaxed space-y-2">
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Use the Service for any illegal or unauthorized purpose</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Violate any laws in your jurisdiction</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Transmit any harmful, threatening, abusive, or defamatory content</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Attempt to gain unauthorized access to any part of the Service</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Interfere with or disrupt the Service or servers</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Upload or share malware, viruses, or other malicious code</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Spam other users or send unsolicited communications</li>
                      <li className="flex items-start"><span className="text-red-500 mr-2">•</span>Violate the privacy rights of others</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2>6. Data and Privacy</h2>
              <div>
                <h3>6.1 Your Data</h3>
                <p>
                  You retain all rights to your data and content uploaded to the Service. 
                  We do not claim ownership of your content but require certain rights to provide the Service 
                  as described in our <Link href="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>.
                </p>

                <h3>6.2 Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your data, including encryption, 
                  access controls, and regular security audits. However, no system is completely secure, 
                  and you use the Service at your own risk.
                </p>

                <h3>6.3 Data Backup and Export</h3>
                <p>
                  We provide tools to export your data. You are responsible for maintaining backups of your data. 
                  We may delete your data in accordance with our data retention policies after account termination.
                </p>
              </div>

              <h2>7. Intellectual Property</h2>
              <div>
                <h3>7.1 Our Rights</h3>
                <p>
                  The Service, including its features, functionality, and content, is owned by StackPro and is 
                  protected by copyright, trademark, and other intellectual property laws.
                </p>

                <h3>7.2 Limited License</h3>
                <p>
                  We grant you a limited, non-exclusive, non-transferable license to use the Service 
                  in accordance with these Terms during your subscription period.
                </p>

                <h3>7.3 Feedback</h3>
                <p>
                  If you provide feedback, suggestions, or ideas about the Service, we may use them 
                  without obligation or compensation to you.
                </p>
              </div>

              <h2>8. Service Availability and Support</h2>
              <div>
                <h3>8.1 Service Level</h3>
                <p>
                  We strive to maintain high availability of the Service but do not guarantee uninterrupted access. 
                  We may perform maintenance that temporarily affects service availability.
                </p>

                <h3>8.2 Support</h3>
                <p>
                  Support is provided according to your subscription plan. Contact information and support 
                  levels are available on our <Link href="/contact" className="text-blue-600 hover:text-blue-700">contact page</Link>.
                </p>
              </div>

              <h2>9. Termination</h2>
              <div>
                <h3>9.1 Termination by You</h3>
                <p>
                  You may cancel your subscription at any time through your account settings or by 
                  contacting our support team. Cancellation takes effect at the end of your current billing period.
                </p>

                <h3>9.2 Termination by Us</h3>
                <p>
                  We may suspend or terminate your account if you violate these Terms or for other 
                  reasons at our discretion, including non-payment of fees.
                </p>

                <h3>9.3 Effect of Termination</h3>
                <p>
                  Upon termination, your access to the Service will end, and we may delete your data 
                  after a reasonable period. You remain responsible for any outstanding fees.
                </p>
              </div>

              <h2>10. Disclaimers and Limitation of Liability</h2>
              <div>
                <h3>10.1 Service "As Is"</h3>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                  WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>

                <h3>10.2 Limitation of Liability</h3>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL STACKPRO BE LIABLE FOR ANY 
                  INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
                  LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>

                <h3>10.3 Maximum Liability</h3>
                <p>
                  Our total liability to you for any damages arising from or related to these Terms or 
                  the Service shall not exceed the amount you paid us in the twelve months preceding the claim.
                </p>
              </div>

              <h2>11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless StackPro and its officers, directors, employees, 
                and agents from any claims, damages, losses, or expenses arising from your use of the Service, 
                violation of these Terms, or infringement of any rights of another party.
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We may modify these Terms at any time by posting the revised terms on our website. 
                Your continued use of the Service after changes become effective constitutes acceptance 
                of the new Terms. We will notify users of material changes via email or service notifications.
              </p>

              <h2>13. Governing Law and Disputes</h2>
              <div>
                <h3>13.1 Governing Law</h3>
                <p>
                  These Terms are governed by and construed in accordance with the laws of [Your State/Country], 
                  without regard to conflict of law principles.
                </p>

                <h3>13.2 Dispute Resolution</h3>
                <p>
                  Any disputes arising from these Terms or the Service shall be resolved through binding arbitration 
                  in accordance with the rules of [Arbitration Organization], except that either party may seek 
                  injunctive relief in court.
                </p>
              </div>

              <h2>14. General Provisions</h2>
              <div>
                <h3>14.1 Entire Agreement</h3>
                <p>
                  These Terms constitute the entire agreement between you and StackPro regarding the Service 
                  and supersede all prior agreements and understandings.
                </p>

                <h3>14.2 Severability</h3>
                <p>
                  If any provision of these Terms is found to be unenforceable, the remaining provisions 
                  will remain in full force and effect.
                </p>

                <h3>14.3 Assignment</h3>
                <p>
                  You may not assign these Terms without our written consent. We may assign these Terms 
                  without restriction.
                </p>
              </div>

              <h2>15. Contact Information</h2>
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p><strong>StackPro</strong><br />
                Email: legal@stackpro.io<br />
                Address: [Your Business Address]<br />
                <Link href="/contact" className="text-blue-600 hover:text-blue-700">Contact Page</Link></p>
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
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="text-blue-400">Terms</Link></li>
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
