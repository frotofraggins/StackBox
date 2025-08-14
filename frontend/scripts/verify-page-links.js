#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Expected pages and their routes
const expectedPages = {
  '/': 'src/pages/index.tsx',
  '/about': 'src/pages/about.tsx',
  '/contact': 'src/pages/contact.tsx',
  '/pricing': 'src/pages/pricing.tsx',
  '/features': 'src/pages/features.tsx',
  '/support': 'src/pages/support.tsx',
  '/login': 'src/pages/login.tsx',
  '/signup': 'src/pages/signup.tsx',
  '/dashboard': 'src/pages/dashboard.tsx',
  '/privacy': 'src/pages/privacy.tsx',
  '/terms': 'src/pages/terms.tsx',
  '/cookie-policy': 'src/pages/cookie-policy.tsx',
  '/industries': 'src/pages/industries.tsx',
  '/industries/law-firms': 'src/pages/industries/law-firms.tsx',
  '/industries/contractors': 'src/pages/industries/contractors.tsx',
  '/industries/agencies': 'src/pages/industries/agencies.tsx',
};

// Common navigation links that should exist
const criticalLinks = [
  { from: '/', to: '/features', description: 'Home to Features' },
  { from: '/', to: '/pricing', description: 'Home to Pricing' },
  { from: '/', to: '/signup', description: 'Home to Signup' },
  { from: '/pricing', to: '/signup', description: 'Pricing to Signup' },
  { from: '/industries/law-firms', to: '/signup', description: 'Law Firms to Signup' },
  { from: '/industries/contractors', to: '/signup', description: 'Contractors to Signup' },
  { from: '/industries/agencies', to: '/signup', description: 'Agencies to Signup' },
];

function checkPageExists(pagePath) {
  const fullPath = path.join(__dirname, '..', pagePath);
  return fs.existsSync(fullPath);
}

function checkLinksInFile(filePath, targetLinks) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingLinks = [];
  
  targetLinks.forEach(link => {
    // Check for Link component with href
    const linkPattern = new RegExp(`<Link[^>]+href=["']${link.replace('/', '\\/')}["']`, 'g');
    // Check for anchor tags
    const anchorPattern = new RegExp(`<a[^>]+href=["']${link.replace('/', '\\/')}["']`, 'g');
    
    if (!linkPattern.test(content) && !anchorPattern.test(content)) {
      missingLinks.push(link);
    }
  });
  
  return missingLinks;
}

function extractAllLinks(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const links = [];
  
  // Extract Link component hrefs
  const linkMatches = content.match(/<Link[^>]+href=["']([^"']+)["']/g);
  if (linkMatches) {
    linkMatches.forEach(match => {
      const href = match.match(/href=["']([^"']+)["']/)[1];
      if (href.startsWith('/') && !href.startsWith('/#')) {
        links.push(href);
      }
    });
  }
  
  // Extract anchor hrefs (internal only)
  const anchorMatches = content.match(/<a[^>]+href=["']([^"']+)["']/g);
  if (anchorMatches) {
    anchorMatches.forEach(match => {
      const href = match.match(/href=["']([^"']+)["']/)[1];
      if (href.startsWith('/') && !href.startsWith('/#')) {
        links.push(href);
      }
    });
  }
  
  return [...new Set(links)]; // Remove duplicates
}

// Main execution
console.log('🔗 StackPro Page Linking Verification\n');

// Check if all expected pages exist
console.log('📄 Checking page existence:');
let missingPages = 0;
Object.entries(expectedPages).forEach(([route, filePath]) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${route} → ${filePath}`);
  } else {
    console.log(`❌ ${route} → ${filePath} (MISSING)`);
    missingPages++;
  }
});

console.log(`\n📊 Page Status: ${Object.keys(expectedPages).length - missingPages}/${Object.keys(expectedPages).length} pages exist\n`);

// Check critical navigation links
console.log('🧭 Checking critical navigation links:');
let brokenLinks = 0;
criticalLinks.forEach(({ from, to, description }) => {
  const fromFile = expectedPages[from];
  if (fromFile) {
    const fullPath = path.join(__dirname, '..', fromFile);
    const missingLinks = checkLinksInFile(fullPath, [to]);
    
    if (missingLinks.length === 0) {
      console.log(`✅ ${description}: ${from} → ${to}`);
    } else {
      console.log(`❌ ${description}: ${from} → ${to} (MISSING LINK)`);
      brokenLinks++;
    }
  }
});

console.log(`\n📊 Navigation Status: ${criticalLinks.length - brokenLinks}/${criticalLinks.length} critical links working\n`);

// Check for broken internal links
console.log('🔍 Checking for broken internal links:');
let totalBrokenLinks = 0;
Object.entries(expectedPages).forEach(([route, filePath]) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    const links = extractAllLinks(fullPath);
    const brokenInPage = [];
    
    links.forEach(link => {
      if (!expectedPages[link]) {
        brokenInPage.push(link);
        totalBrokenLinks++;
      }
    });
    
    if (brokenInPage.length > 0) {
      console.log(`❌ ${route}: Broken links → ${brokenInPage.join(', ')}`);
    } else if (links.length > 0) {
      console.log(`✅ ${route}: All ${links.length} internal links valid`);
    }
  }
});

if (totalBrokenLinks === 0) {
  console.log('✅ No broken internal links found!');
}

// Summary
console.log('\n📋 SUMMARY:');
console.log(`Pages: ${Object.keys(expectedPages).length - missingPages}/${Object.keys(expectedPages).length} exist`);
console.log(`Critical Navigation: ${criticalLinks.length - brokenLinks}/${criticalLinks.length} working`);
console.log(`Broken Links: ${totalBrokenLinks} found`);

const hasIssues = missingPages > 0 || brokenLinks > 0 || totalBrokenLinks > 0;
if (hasIssues) {
  console.log('\n❌ Issues found! Please fix the missing pages and broken links.');
  process.exit(1);
} else {
  console.log('\n✅ All pages properly linked! Navigation structure is healthy.');
  process.exit(0);
}
