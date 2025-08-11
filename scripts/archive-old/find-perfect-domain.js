/**
 * Comprehensive Domain Search for Business Tools SaaS Platform
 * Uses AWS Route 53 Domains API to find the perfect domain
 */

const { Route53DomainsClient, CheckDomainAvailabilityCommand } = require('@aws-sdk/client-route-53-domains');
const { logger } = require('./src/utils/logger');

// Initialize Route 53 Domains client (must be in us-east-1)
const route53DomainsClient = new Route53DomainsClient({ 
  region: 'us-east-1'
});

// Comprehensive domain candidates based on SaaS characteristics:
// - All business tools platform
// - Enterprise integration
// - API-first architecture  
// - Premium positioning
// - Target: law firms, real estate, professional services
const domainCandidates = [
  // Business + Suite Concepts
  { name: 'BusinessSuite', domains: ['businesssuite.io', 'businesssuite.co', 'businesssuite.app'] },
  { name: 'BizStack', domains: ['bizstack.io', 'bizstack.co', 'bizstack.app'] },
  { name: 'ProSuite', domains: ['prosuite.io', 'prosuite.co', 'prosuite.app'] },
  { name: 'WorkSuite', domains: ['worksuite.io', 'worksuite.co', 'worksuite.app'] },
  { name: 'BusinessKit', domains: ['businesskit.io', 'businesskit.co', 'businesskit.app'] },
  
  // Professional + Tool Concepts
  { name: 'ProTools', domains: ['protools.io', 'protools.co', 'protools.app'] },
  { name: 'BusinessTools', domains: ['businesstools.io', 'businesstools.co', 'businesstools.app'] },
  { name: 'ToolHub', domains: ['toolhub.io', 'toolhub.co', 'toolhub.app'] },
  { name: 'ToolStack', domains: ['toolstack.io', 'toolstack.co', 'toolstack.app'] },
  { name: 'AllTools', domains: ['alltools.io', 'alltools.co', 'alltools.app'] },
  
  // Enterprise + Platform Concepts
  { name: 'BusinessHub', domains: ['businesshub.io', 'businesshub.co', 'businesshub.app'] },
  { name: 'ProHub', domains: ['prohub.io', 'prohub.co', 'prohub.app'] },
  { name: 'WorkHub', domains: ['workhub.io', 'workhub.co', 'workhub.app'] },
  { name: 'BizHub', domains: ['bizhub.io', 'bizhub.co', 'bizhub.app'] },
  { name: 'BusinessCore', domains: ['businesscore.io', 'businesscore.co', 'businesscore.app'] },
  
  // Modern + Tech Concepts
  { name: 'StackPro', domains: ['stackpro.io', 'stackpro.co', 'stackpro.app'] },
  { name: 'ProStack', domains: ['prostack.io', 'prostack.co', 'prostack.app'] },
  { name: 'WorkStack', domains: ['workstack.io', 'workstack.co', 'workstack.app'] },
  { name: 'BusinessApp', domains: ['businessapp.io', 'businessapp.co', 'businessapp.app'] },
  { name: 'ToolBox', domains: ['toolbox.io', 'toolbox.co', 'toolbox.app'] },
  
  // Launch + Growth Concepts  
  { name: 'LaunchSuite', domains: ['launchsuite.app', 'launchsuite.tools', 'launchsuite.business'] },
  { name: 'GrowthSuite', domains: ['growthsuite.io', 'growthsuite.co', 'growthsuite.app'] },
  { name: 'LaunchKit', domains: ['launchkit.io', 'launchkit.co', 'launchkit.app'] },
  { name: 'GrowKit', domains: ['growkit.io', 'growkit.co', 'growkit.app'] },
  { name: 'BuildSuite', domains: ['buildsuite.io', 'buildsuite.co', 'buildsuite.app'] },
  
  // Industry-Specific Appeal
  { name: 'LawSuite', domains: ['lawsuite.io', 'lawsuite.co', 'lawsuite.app'] },
  { name: 'AgentSuite', domains: ['agentsuite.io', 'agentsuite.co', 'agentsuite.app'] },
  { name: 'ClientSuite', domains: ['clientsuite.io', 'clientsuite.co', 'clientsuite.app'] },
  { name: 'ServiceSuite', domains: ['servicesuite.io', 'servicesuite.co', 'servicesuite.app'] },
  { name: 'PracticeSuite', domains: ['practicesuite.io', 'practicesuite.co', 'practicesuite.app'] },
  
  // Short + Brandable
  { name: 'Nexus', domains: ['nexus.business', 'nexus.tools', 'nexus.app'] },
  { name: 'Core', domains: ['core.business', 'core.tools', 'corebiz.io'] },
  { name: 'Hub', domains: ['hub.business', 'hub.tools', 'bizhub.app'] },
  { name: 'Stack', domains: ['stack.business', 'stack.tools', 'mystack.io'] },
  { name: 'Suite', domains: ['suite.business', 'suite.tools', 'mysuite.io'] },
  
  // Unique + Memorable
  { name: 'Catalyst', domains: ['catalyst.business', 'catalystbiz.io', 'catalystsuite.co'] },
  { name: 'Vertex', domains: ['vertexbiz.io', 'vertexsuite.co', 'vertex.business'] },
  { name: 'Zenith', domains: ['zenithbiz.io', 'zenithsuite.co', 'zenith.business'] },
  { name: 'Pinnacle', domains: ['pinnaclebiz.io', 'pinnaclesuite.co', 'pinnacle.business'] },
  { name: 'Summit', domains: ['summitbiz.io', 'summitsuite.co', 'summit.business'] }
];

async function checkDomainAvailability(domain) {
  try {
    const command = new CheckDomainAvailabilityCommand({
      DomainName: domain
    });
    
    const result = await route53DomainsClient.send(command);
    return result.Availability;
  } catch (error) {
    console.error(`❌ Error checking ${domain}:`, error.message);
    return 'ERROR';
  }
}

async function findPerfectDomain() {
  console.log('🚀 FINDING PERFECT DOMAIN FOR BUSINESS TOOLS SAAS...\n');
  console.log('🎯 Platform: All Business Tools (CRM, Files, Booking, Websites)');
  console.log('🏢 Target: Law Firms, Real Estate, Professional Services'); 
  console.log('💰 Pricing: Premium ($299-1299/month)');
  console.log('🔧 Features: Enterprise Integration, API-First, Cross-Account AWS');
  console.log('=' * 80 + '\n');
  
  const results = [];
  const available = [];
  
  let checkedCount = 0;
  const totalDomains = domainCandidates.reduce((sum, brand) => sum + brand.domains.length, 0);
  
  for (const brand of domainCandidates) {
    console.log(`🔍 Checking ${brand.name}...`);
    
    for (const domain of brand.domains) {
      checkedCount++;
      process.stdout.write(`   ${domain}... `);
      
      const availability = await checkDomainAvailability(domain);
      
      const result = {
        brand: brand.name,
        domain,
        availability,
        status: availability === 'AVAILABLE' ? '✅ AVAILABLE' : 
                availability === 'UNAVAILABLE' ? '❌ TAKEN' : 
                availability === 'RESERVED' ? '⚠️ RESERVED' :
                availability === 'DONT_KNOW' ? '❓ UNKNOWN' : 
                '❌ ERROR'
      };
      
      results.push(result);
      
      if (availability === 'AVAILABLE') {
        available.push(result);
        console.log('✅ AVAILABLE!');
      } else {
        console.log(`❌ ${availability.toLowerCase()}`);
      }
      
      // Progress indicator
      console.log(`   Progress: ${checkedCount}/${totalDomains} domains checked\n`);
      
      // Rate limiting - AWS allows 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }
  
  console.log('\n' + '=' * 80);
  console.log('🎉 DOMAIN SEARCH COMPLETE!');
  console.log('=' * 80);
  
  if (available.length > 0) {
    console.log(`\n✅ FOUND ${available.length} AVAILABLE DOMAINS:\n`);
    
    // Sort available domains by brand appeal and TLD preference
    const sorted = available.sort((a, b) => {
      // Prefer .io, .co, .app over others
      const tldPriority = { '.io': 1, '.co': 2, '.app': 3, '.business': 4, '.tools': 5 };
      const aTld = '.' + a.domain.split('.').pop();
      const bTld = '.' + b.domain.split('.').pop();
      
      return (tldPriority[aTld] || 6) - (tldPriority[bTld] || 6);
    });
    
    sorted.forEach((result, index) => {
      console.log(`${index + 1}. ${result.brand} - ${result.domain}`);
    });
    
    console.log('\n🏆 TOP 3 RECOMMENDATIONS:\n');
    
    const top3 = sorted.slice(0, 3);
    top3.forEach((rec, index) => {
      const pricing = rec.domain.includes('.io') ? '~$40-50/year' :
                     rec.domain.includes('.co') ? '~$30-40/year' :
                     rec.domain.includes('.app') ? '~$20-30/year' :
                     rec.domain.includes('.business') ? '~$30-40/year' :
                     rec.domain.includes('.tools') ? '~$30-40/year' : '~$30-50/year';
      
      console.log(`${index + 1}. 🎯 ${rec.brand}`);
      console.log(`   Domain: ${rec.domain}`);
      console.log(`   Pricing: ${pricing}`);
      console.log(`   Perfect for: Business tools platform with enterprise appeal`);
      
      // Sample branding
      console.log(`   Sample branding:`);
      console.log(`   • Company: ${rec.brand}`);
      console.log(`   • Tagline: "Complete business suite for professionals"`);
      console.log(`   • API: api.${rec.domain}`);
      console.log(`   • Client URLs: clientname.${rec.domain}\n`);
    });
    
    console.log('🚀 IMMEDIATE ACTION:');
    console.log(`Purchase your chosen domain immediately at:`);
    console.log(`• AWS Route 53: https://console.aws.amazon.com/route53/domains/`);
    console.log(`• Namecheap: https://www.namecheap.com/`);
    console.log(`• Google Domains: https://domains.google.com/`);
    
  } else {
    console.log('\n❌ NO DOMAINS AVAILABLE FROM PRIMARY LIST');
    console.log('\n💡 ALTERNATIVE STRATEGIES:');
    console.log('1. Add prefixes: Get, My, Try, Use, Go, App');
    console.log('2. Add suffixes: HQ, Pro, Plus, Max, One'); 
    console.log('3. Different TLDs: .com, .net, .biz, .tech, .software');
    console.log('4. Hyphenated versions: business-suite.io, tool-stack.co');
    console.log('5. Numbers: biztools1.io, suite247.co');
  }
  
  return available;
}

// Export for programmatic use
module.exports = { findPerfectDomain, checkDomainAvailability };

// Run if called directly
if (require.main === module) {
  findPerfectDomain()
    .then(available => {
      console.log(`\n✅ Search completed. Found ${available.length} available domains.`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Domain search failed:', error);
      process.exit(1);
    });
}
