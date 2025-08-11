#!/usr/bin/env node

/**
 * Seed Demo Data Script
 * Populates demo-ready data for capabilities when flags are ON
 */

const fs = require('fs');

class SeedDataManager {
  constructor() {
    this.seedData = {
      timestamp: new Date().toISOString(),
      environment: 'sandbox',
      datasets: {}
    };
  }

  generateEmailStackData() {
    return {
      templates: [
        {
          id: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to StackPro!',
          content: 'Thank you for joining StackPro. Your AI-powered legal platform awaits.',
          variables: ['firstName', 'companyName']
        },
        {
          id: 'invoice',
          name: 'Invoice Notification',
          subject: 'Your StackPro Invoice is Ready',
          content: 'Your monthly invoice for {{amount}} is now available.',
          variables: ['amount', 'dueDate']
        }
      ],
      campaigns: [
        {
          id: 'demo-campaign',
          name: 'Demo Campaign',
          status: 'draft',
          recipients: 3,
          template: 'welcome'
        }
      ]
    };
  }

  generateAIDocsData() {
    return {
      documents: [
        {
          id: 'sample-contract',
          title: 'Sample Service Agreement',
          type: 'contract',
          status: 'processed',
          insights: ['Standard terms detected', 'No unusual clauses found'],
          keywords: ['service', 'agreement', 'liability', 'termination']
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy Template',
          type: 'policy',
          status: 'processed',
          insights: ['GDPR compliant', 'California privacy act ready'],
          keywords: ['privacy', 'data', 'consent', 'cookies']
        }
      ],
      analytics: {
        totalProcessed: 2,
        averageProcessingTime: '3.2s',
        topKeywords: ['privacy', 'service', 'agreement', 'data']
      }
    };
  }

  generateDataIngestionData() {
    return {
      sources: [
        {
          id: 'demo-csv',
          name: 'Client Database Export',
          type: 'csv',
          status: 'ready',
          records: 150,
          lastSync: new Date().toISOString()
        },
        {
          id: 'demo-api',
          name: 'CRM Integration',
          type: 'api',
          status: 'connected',
          records: 1250,
          lastSync: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      metrics: {
        totalRecords: 1400,
        successRate: 98.5,
        errorCount: 21
      }
    };
  }

  generateMessagingData() {
    return {
      conversations: [
        {
          id: 'demo-thread-1',
          participants: ['Demo User', 'Legal Assistant'],
          lastMessage: 'I\'ve reviewed the contract and have some questions.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: 'active'
        },
        {
          id: 'demo-thread-2', 
          participants: ['Demo User', 'Support Team'],
          lastMessage: 'Thank you for the quick response!',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'resolved'
        }
      ],
      stats: {
        activeConversations: 1,
        avgResponseTime: '4.2min',
        satisfactionScore: 4.8
      }
    };
  }

  async generateAllSeedData() {
    console.log('🌱 Generating demo seed data for StackPro capabilities');
    
    this.seedData.datasets = {
      emailStack: this.generateEmailStackData(),
      aiDocs: this.generateAIDocsData(),
      dataIngestion: this.generateDataIngestionData(),
      messaging: this.generateMessagingData()
    };

    // Save to multiple formats
    fs.mkdirSync('artifacts/seed-data', { recursive: true });
    
    // JSON for API consumption
    fs.writeFileSync(
      'artifacts/seed-data/demo-data.json', 
      JSON.stringify(this.seedData, null, 2)
    );

    // Individual capability files
    Object.entries(this.seedData.datasets).forEach(([capability, data]) => {
      fs.writeFileSync(
        `artifacts/seed-data/${capability}.json`,
        JSON.stringify(data, null, 2)
      );
    });

    console.log('✅ Demo seed data generated:');
    console.log('  📧 Email Stack: 2 templates, 1 campaign');
    console.log('  🤖 AI Docs: 2 documents processed');
    console.log('  📊 Data Ingestion: 2 sources, 1400 records');
    console.log('  💬 Messaging: 2 conversations');
    console.log('  💾 Saved to artifacts/seed-data/');

    return this.seedData;
  }
}

// Run if called directly
if (require.main === module) {
  const seeder = new SeedDataManager();
  
  seeder.generateAllSeedData().then(data => {
    console.log('\n🎯 Seed data ready for demo capabilities!');
    process.exit(0);
  }).catch(err => {
    console.error('❌ Seed data generation failed:', err);
    process.exit(1);
  });
}

module.exports = { SeedDataManager };
