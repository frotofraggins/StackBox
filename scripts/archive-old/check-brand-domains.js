/**
 * Check domain availability for rebranding options
 * Uses AWS Route 53 Domains API to verify availability
 */

const { Route53DomainsClient, CheckDomainAvailabilityCommand } = require('@aws-sdk/client-route-53-domains');
const { logger } = require('./src/utils/logger');

// Initialize Route 53 Domains client (must be in us-east-1)
const route53DomainsClient = new Route53DomainsClient({ 
  region: 'us-east-1',
  profile: 'default'
});

// Brand name candidates
const brandCandidates = [
  { name: 'LaunchSuite', domain: 'launchsuite.com', rationale: 'Suite of business tools, startup energy' },
  { name: 'StackPilot', domain: 'stackpilot.com', rationale: 'Piloting your business stack' },
  { name: 'BizForge', domain: 'bizforge.com', rationale: 'Clean, business + creation feel' },
  { name: 'DeployPro', domain: 'deploypro.com', rationale: 'Direct, deploy tools like a pro' },
  { name: 'NimbusStack', domain: 'nimbusstack.com', rationale: 'Cloud-based sounding, catchy' },
  { name: 'FoundrStack', domain: 'foundrstack.com', rationale: 'For founders, startup vibes' },
  { name: 'BizNest', domain: 'biznest.com', rationale: 'Your nest of business tools' },
  { name: 'ToolJet', domain: 'tooljet.com', rationale: 'Fast tool deployment like a jet' },
  { name: 'LaunchBase', domain: 'launchbase.com', rationale: 'Startup energy + infrastructure' },
  { name: 'StackForge', domain: 'stackforge.com', rationale: 'Building and customizing your stack' },
  
  // Additional alternatives
  { name: 'BizLaunch', domain: 'bizlaunch.com', rationale: 'Business launch platform' },
  { name: 'StackSuite', domain: 'stacksuite.com', rationale: 'Suite of stack tools' },
  { name: 'LaunchKit', domain: 'launchkit.com', rationale: 'Complete kit to launch business' },
  { name: 'BizStack', domain: 'bizstack.com', rationale: 'Simple, direct business stack' },
  { name: 'DeployKit', domain: 'deploykit.com', rationale: 'Deployment toolkit' }
];

async function checkDomainAvailability(domain) {
  try {
    const command = new CheckDomainAvailabilityCommand({
      DomainName: domain
    });
    
    const result = await route53DomainsClient.send(command);
    return result.Availability;
  } catch (error) {
    logger.error(`Error checking ${domain}:`, error.message);
    return 'ERROR';
  }
}

async function checkAllDomains() {
  console.log('🔍 CHECKING DOMAIN AVAILABILITY FOR REBRAND...\n');
  console.log('=' * 80);
  
  const results = [];
  
  for (const candidate of brandCandidates) {
    console.log(`Checking ${candidate.domain}...`);
    
    const availability = await checkDomainAvailability(candidate.domain);
    
    results.push({
      ...candidate,
      availability,
      status: availability === 'AVAILABLE' ? '✅ AVAILABLE' : 
              availability === 'UNAVAILABLE' ? '❌ TAKEN' : 
              availability === 'RESERVED' ? '⚠️ RESERVED' :
              availability === 'DONT_KNOW' ? '❓ UNKNOWN' : 
              '❌ ERROR'
    });
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 DOMAIN AVAILABILITY RESULTS:');
  console.log('=' * 80);
  
  // Sort by availability (available first)
  const sortedResults = results.sort((a, b) => {
    const priority = { 'AVAILABLE': 1, 'DONT_KNOW': 2, 'RESERVED': 3, 'UNAVAILABLE': 4, 'ERROR': 5 };
    return priority[a.availability] - priority[b.availability];
  });
  
  sortedResults.forEach(result => {
    console.log(`${result.status} | ${result.name.padEnd(15)} | ${result.domain.padEnd(20)} | ${result.rationale}`);
  });
  
  console.log('\n🚀 RECOMMENDED CHOICES:');
  console.log('=' * 40);
  
  const available = sortedResults.filter(r => r.availability === 'AVAILABLE');
  const recommended = available.slice(0, 3);
  
  if (recommended.length > 0) {
    recommended.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.name} (${rec.domain})`);
      console.log(`   💡 ${rec.rationale}\n`);
    });
    
    console.log('🎯 TOP RECOMMENDATION:');
    console.log(`   🏆 ${recommended[0].name} - Perfect for "business suite" positioning`);
    console.log(`   🌐 Domain: ${recommended[0].domain}`);
    console.log(`   💼 Brand fit: ${recommended[0].rationale}`);
  } else {
    console.log('❌ No primary domains available. Consider:');
    console.log('   - Adding prefixes: Get, My, Try, Use');
    console.log('   - Different TLDs: .io, .co, .app, .dev');
    console.log('   - Hyphenated versions');
  }
  
  return sortedResults;
}

// Alternative domain suggestions if primaries are taken
function generateAlternatives(baseName) {
  const prefixes = ['get', 'my', 'try', 'use', 'go', 'app'];
  const suffixes = ['app', 'tools', 'pro', 'hub', 'suite', 'kit'];
  const tlds = ['.com', '.io', '.co', '.app', '.dev', '.tools'];
  
  const alternatives = [];
  
  // Prefixed versions
  prefixes.forEach(prefix => {
    tlds.forEach(tld => {
      alternatives.push(`${prefix}${baseName.toLowerCase()}${tld}`);
    });
  });
  
  // Suffixed versions
  suffixes.forEach(suffix => {
    tlds.forEach(tld => {
      alternatives.push(`${baseName.toLowerCase()}${suffix}${tld}`);
    });
  });
  
  return alternatives.slice(0, 10); // Return top 10 alternatives
}

// Run the check
checkAllDomains()
  .then(results => {
    const available = results.filter(r => r.availability === 'AVAILABLE');
    
    if (available.length === 0) {
      console.log('\n🔄 GENERATING ALTERNATIVES...');
      console.log('=' * 40);
      
      brandCandidates.slice(0, 3).forEach(candidate => {
        console.log(`\nAlternatives for ${candidate.name}:`);
        const alts = generateAlternatives(candidate.name);
        alts.slice(0, 5).forEach(alt => console.log(`   • ${alt}`));
      });
    }
    
    console.log('\n✅ Domain availability check complete!');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Domain check failed:', error);
    process.exit(1);
  });
