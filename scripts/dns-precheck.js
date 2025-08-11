#!/usr/bin/env node

/**
 * Phase 3.1r+ DNS Precheck Helper
 * Node 22 DNS precheck for NS chain validation
 */

const { Resolver } = require('dns/promises');
const fs = require('fs');

const r = new Resolver();

async function resolveNS(name) {
  try {
    return await r.resolveNs(name);
  } catch (e) {
    return { error: e.message };
  }
}

async function resolveSOA(name) {
  try {
    return await r.resolveSoa(name);
  } catch (e) {
    return { error: e.message };
  }
}

async function runDNSPrecheck() {
  console.log('🔍 Running DNS Precheck for Phase 3.1r+');
  
  const out = {};
  
  for (const n of ['stackpro.io', 'sandbox.stackpro.io']) {
    console.log(`   Checking ${n}...`);
    out[n] = { 
      ns: await resolveNS(n), 
      soa: await resolveSOA(n) 
    };
  }

  // Ensure logs directory exists
  fs.mkdirSync('logs', { recursive: true });
  
  // Write results
  fs.writeFileSync('logs/dns-delegation.json', JSON.stringify(out, null, 2));
  
  console.log('✅ DNS precheck written to logs/dns-delegation.json');
  
  // Analysis
  let allGood = true;
  for (const [domain, results] of Object.entries(out)) {
    if (results.ns.error || results.soa.error) {
      console.log(`❌ ${domain}: DNS resolution issues detected`);
      allGood = false;
    } else {
      console.log(`✅ ${domain}: NS and SOA records resolved successfully`);
    }
  }
  
  return allGood;
}

// Run if called directly
if (require.main === module) {
  runDNSPrecheck().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('❌ DNS precheck failed:', err);
    process.exit(1);
  });
}

module.exports = { runDNSPrecheck };
