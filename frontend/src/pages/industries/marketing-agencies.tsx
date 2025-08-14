import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../../components/layout/Navigation';
import Footer from '../../components/layout/Footer';

export default function MarketingAgencies() {
  const painPoints = [
    {
      problem: "Limited Resources & Budget Constraints",
      description: "Small agencies struggle with smaller marketing budgets, can't afford dedicated specialists, and need cost-effective solutions.",
      solution: "AI Assistant automates tasks and provides data-driven insights, reducing manual effort and optimizing resource allocation."
    },
    {
      problem: "Time Management & Operational Inefficiency", 
      description: "Business owners juggle countless tasks, treating marketing as an afterthought while missing growth opportunities.",
      solution: "Streamlined workflows with real-time messaging, file sharing, and AI automation free up strategic time."
    },
    {
      problem: "Difficulty Measuring ROI & Proving Value",
      description: "Many agencies can't track campaign effectiveness or demonstrate clear return on investment to clients.",
      solution: "AI-powered analytics and reporting provide transparent pipeline tracking from leads to revenue."
    }
  ];

  const features = [
    {
      name: "AI Assistant",
      description: "Automates routine tasks, generates reports, and provides predictive analytics for better decision-making.",
      benefit: "Acts as a virtual team member, multiplying your agency's capabilities without additional hiring costs."
    },
    {
      name: "Real-time Messaging",
      description: "Centralized communication hub for internal teams and client interactions with instant notifications.",
      benefit: "Enables immediate lead response and eliminates fragmented email chains that slow down projects."
    },
    {
      name: "Website Builder",
      description: "Create professional, conversion-focused websites quickly without technical expertise.",
      benefit: "Establish strong online presence for your agency and clients without external development costs."
    },
    {
      name: "File Sharing",
      description: "Centralized document management and collaboration across teams and clients.",
      benefit: "Reduces vendor complexity and ensures everyone has access to latest project assets in real-time."
    }
  ];

  const faqs = [
    {
      question: "Is StackPro affordable for small agencies?",
      answer: "Yes! StackPro is designed specifically for resource-constrained agencies. Our pricing starts at $299/month, which typically costs less than hiring one part-time specialist, while providing the capabilities of an entire team."
    },
    {
      question: "How does StackPro integrate with existing tools?",
      answer: "StackPro is built to replace multiple disparate tools with one unified platform. We provide migration assistance and can integrate with essential tools you need to keep, reducing the 'too many vendors' problem."
    },
    {
      question: "Is the data secure for client information?",
      answer: "Absolutely. StackPro uses enterprise-grade security with end-to-end encryption, SOC 2 compliance, and regular security audits. Your client data is more secure than with multiple separate tools."
    },
    {
      question: "Is it easy to use for non-tech savvy teams?",
      answer: "Yes! StackPro is designed for business owners, not developers. Our AI Assistant guides you through setup, and most agencies are fully operational within 20 minutes of signing up."
    },
    {
      question: "How does StackPro help with client reporting?",
      answer: "Our AI Assistant automatically generates comprehensive reports showing lead generation, conversion rates, project progress, and ROI metrics. Clients get transparent visibility into their investment's impact."
    }
  ];

  return (
    <>
      <Head>
        <title>CRM for Marketing Agencies | StackPro - All-in-One Agency Management</title>
        <meta name="description" content="Streamline your marketing agency with StackPro's AI-powered CRM, project management, and client communication tools. Start your free trial today." />
        <meta name="keywords" content="CRM for marketing agencies, agency management software, marketing automation for small business, project management software for agencies" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://stackpro.io/industries/marketing-agencies" />
      </Head>

      <Navigation currentPage="/industries/marketing-agencies" />

      <main className="pt-16">
        {/* Hero Section */}
        <section className="section-spacing bg-surface">
          <div className="container-custom text-center">
            <h1 className="text-h1 text-foreground mb-6">
              Stop Juggling Multiple Tools - Streamline Your Agency Operations
            </h1>
            <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
              The only platform built for marketing agencies and consultants who want to eliminate operational chaos, 
              respond to leads instantly, and prove ROI to clients - all without breaking the budget.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn btn-primary">
                Start Free Trial
              </Link>
              <Link href="/contact" className="btn bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white transition-all">
                See How It Works - Quick Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-foreground mb-4">
                The Hidden Costs of Agency Chaos
              </h2>
              <p className="text-xl text-muted">
                Every day you spend managing multiple tools is a day not spent growing your agency
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {painPoints.map((point, index) => (
                <div key={index} className="card p-6">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{point.problem}</h3>
                  <p className="text-muted mb-4">{point.description}</p>
                  <div className="border-t border-border pt-4">
                    <div className="text-accent text-2xl mb-2">✅</div>
                    <p className="text-sm text-foreground font-medium">{point.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-spacing bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-foreground mb-4">
                Four Powerful Tools, One Unified Platform
              </h2>
              <p className="text-xl text-muted">
                Stop paying for multiple subscriptions. StackPro replaces your entire tech stack.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card p-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold text-xl">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-3">{feature.name}</h3>
                      <p className="text-muted mb-4">{feature.description}</p>
                      <div className="bg-surface-2 rounded-lg p-4">
                        <p className="text-sm font-medium text-foreground">{feature.benefit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="section-spacing bg-surface-2">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-foreground mb-4">
                Trusted by Growing Agencies
              </h2>
              <p className="text-xl text-muted">
                See how agencies like yours are scaling with StackPro
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-6 text-center">
                <div className="text-4xl mb-4">📈</div>
                <blockquote className="text-muted italic mb-4">
                  "StackPro eliminated our 'vendor chaos.' We went from 8 different tools to 1 platform. Our team is 40% more efficient."
                </blockquote>
                <div className="font-semibold text-foreground">Jessica Martinez</div>
                <div className="text-sm text-muted">Founder, Digital Growth Partners</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-4xl mb-4">⚡</div>
                <blockquote className="text-muted italic mb-4">
                  "The AI Assistant is like having a senior strategist on staff. It handles reporting while we focus on creative work."
                </blockquote>
                <div className="font-semibold text-foreground">Michael Chen</div>
                <div className="text-sm text-muted">Creative Director, Momentum Marketing</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <blockquote className="text-muted italic mb-4">
                  "Client retention improved 60% because we can finally show clear ROI. The reporting features are game-changing."
                </blockquote>
                <div className="font-semibold text-foreground">Sarah Williams</div>
                <div className="text-sm text-muted">Owner, Strategic Consulting Group</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-spacing bg-surface">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-h2 text-foreground mb-4">
                Common Questions from Agency Owners
              </h2>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{faq.question}</h3>
                  <p className="text-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-spacing bg-primary text-white">
          <div className="container-custom text-center">
            <h2 className="text-h2 text-white mb-4">
              Ready to Eliminate Agency Chaos?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of agencies who've streamlined their operations and boosted profitability with StackPro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn bg-white text-primary font-semibold hover:bg-gray-100 transition-colors">
                Start Your Free Trial
              </Link>
              <Link href="/contact" className="btn bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary transition-all">
                Schedule Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
