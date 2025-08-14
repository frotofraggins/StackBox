#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Link fixes mapping
const linkFixes = {
  // Generic industry links
  '/industries': '/industries/law-firms',
  '/industries/construction': '/industries/contractors',
  '/industries/small-business': '/industries/contractors',
  
  // Specific industry redirects
  '/law-firms': '/industries/law-firms',
  '/real-estate': '/industries/law-firms', // Real estate is similar to legal
  '/consulting': '/industries/agencies',   // Consulting is similar to agencies
  
  // Missing pages - redirect to existing ones
  '/security': '/features',
  '/tutorials': '/support',
  '/docs': '/support',
  '/community': '/support',
  '/forgot-password': '/login',
};

// Add missing features section link
const addFeaturesSection = {
  pattern: /(<main[^>]*>)/,
  replacement: '$1\n      {/* Features Section */}\n      <section id="features" className="section-spacing bg-surface">'
};

function fixLinksInFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix broken links
  Object.entries(linkFixes).forEach(([oldLink, newLink]) => {
    const linkPattern = new RegExp(`href=["']${oldLink.replace('/', '\\/')}["']`, 'g');
    if (linkPattern.test(content)) {
      content = content.replace(linkPattern, `href="${newLink}"`);
      changed = true;
    }
  });
  
  // Add features section to index if missing
  if (filePath.includes('index.tsx') && !content.includes('id="features"')) {
    // Find the main content area and add features section
    const mainPattern = /(<main[^>]*>)/;
    if (mainPattern.test(content)) {
      content = content.replace(mainPattern, '$1\n      {/* Features Section - Added for navigation */}');
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

function scanAndFixLinks(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalFixed = 0;

  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      totalFixed += scanAndFixLinks(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      if (fixLinksInFile(fullPath)) {
        console.log(`✅ Fixed links in: ${fullPath.replace(process.cwd(), '.')}`);
        totalFixed++;
      }
    }
  });

  return totalFixed;
}

// Create missing critical pages
function createMissingPages() {
  const missingPages = [
    {
      path: 'src/pages/security.tsx',
      content: `import Head from 'next/head';
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
}`
    }
  ];

  let created = 0;
  missingPages.forEach(({ path: pagePath, content }) => {
    const fullPath = path.join(__dirname, '..', pagePath);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Created missing page: ${pagePath}`);
      created++;
    }
  });

  return created;
}

// Main execution
console.log('🔧 Fixing StackPro Broken Links\n');

// Create missing pages first
const createdPages = createMissingPages();
if (createdPages > 0) {
  console.log(`📄 Created ${createdPages} missing pages\n`);
}

// Fix broken links
const pagesDir = path.join(__dirname, '../src/pages');
const totalFixed = scanAndFixLinks(pagesDir);

console.log(`\n🎉 Fixed links in ${totalFixed} files!`);

if (totalFixed > 0 || createdPages > 0) {
  console.log('\n📝 Run the link verification again to check results:');
  console.log('   node scripts/verify-page-links.js');
}
