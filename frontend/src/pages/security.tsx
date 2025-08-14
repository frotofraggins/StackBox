import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../components/layout/Navigation';

export default function Security() {
  return (
    <>
      <Head>
        <title>Security & Compliance | StackPro</title>
        <meta name="description" content="Learn about StackPro's enterprise-grade security features and compliance standards." />
      </Head>
      
      <Navigation currentPage="/security" />
      
      <main className="pt-16">
        <div className="container-custom section-spacing">
          <h1 className="text-h1 text-foreground mb-8">Security & Compliance</h1>
          <p className="text-xl text-muted mb-8">
            Enterprise-grade security built for modern businesses.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-6">
              <h2 className="text-h2 text-foreground mb-4">Data Protection</h2>
              <p className="text-muted">End-to-end encryption and secure data handling.</p>
            </div>
            <div className="card p-6">
              <h2 className="text-h2 text-foreground mb-4">Compliance</h2>
              <p className="text-muted">SOC 2, GDPR, and industry-specific compliance.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/contact" className="btn btn-primary">
              Contact Security Team
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}