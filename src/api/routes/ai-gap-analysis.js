const express = require('express');
const router = express.Router();

// Industry → Pain Point → Stack Mapping (Hard-coded as specified)
const INDUSTRY_MAPPINGS = {
  'Construction': {
    painPoints: [
      'Project delays and timeline management',
      'Compliance tracking and documentation',
      'Subcontractor coordination and management',
      'Material cost tracking and budget overruns',
      'Safety incident reporting and prevention',
      'Change order management',
      'Equipment maintenance scheduling',
      'Weather impact planning',
      'Quality control inspections',
      'Client communication and updates'
    ],
    recommendedStacks: [
      {
        name: 'Project Management Stack',
        tools: ['Procore', 'Asana', 'Monday.com'],
        complexity: 'medium',
        priority: 'high',
        description: 'Comprehensive project timeline and resource management'
      },
      {
        name: 'Safety Compliance Stack',
        tools: ['SafetyCulture', 'iAuditor', 'ComplianceQuest'],
        complexity: 'low',
        priority: 'high',
        description: 'OSHA compliance and safety incident tracking'
      },
      {
        name: 'Financial Tracking Stack',
        tools: ['QuickBooks Enterprise', 'Sage Construction', 'Foundation'],
        complexity: 'high',
        priority: 'medium',
        description: 'Job costing and financial project tracking'
      }
    ]
  },
  'Tradesmen': {
    painPoints: [
      'Job scheduling and dispatch optimization',
      'Mobile invoicing and payment processing',
      'Inventory tracking and reordering',
      'Customer relationship management',
      'Time tracking and payroll',
      'Equipment maintenance logs',
      'Route optimization for service calls',
      'Quote generation and follow-up',
      'Seasonal demand planning',
      'License and certification tracking'
    ],
    recommendedStacks: [
      {
        name: 'Scheduling & Dispatch Stack',
        tools: ['ServiceTitan', 'Housecall Pro', 'Jobber'],
        complexity: 'medium',
        priority: 'high',
        description: 'Complete field service management solution'
      },
      {
        name: 'Payment/Invoicing Stack',
        tools: ['Square', 'QuickBooks Payments', 'FreshBooks'],
        complexity: 'low',
        priority: 'high',
        description: 'Mobile invoicing and payment processing'
      },
      {
        name: 'Inventory Tracker',
        tools: ['TradeGecko', 'Cin7', 'Sortly'],
        complexity: 'medium',
        priority: 'medium',
        description: 'Parts and materials inventory management'
      }
    ]
  },
  'Legal': {
    painPoints: [
      'Case document management and organization',
      'Client billing and time tracking',
      'Secure client communications',
      'Document automation and templates',
      'Compliance and regulatory tracking',
      'Court date and deadline management',
      'Client intake and onboarding',
      'Research and case law tracking',
      'Conflict of interest checking',
      'Trust account management'
    ],
    recommendedStacks: [
      {
        name: 'Case Management Stack',
        tools: ['Clio', 'MyCase', 'PracticePanther'],
        complexity: 'high',
        priority: 'high',
        description: 'Complete legal practice management solution'
      },
      {
        name: 'Secure Client Portal',
        tools: ['Client Portal by Clio', 'LawGro', 'CaseFox'],
        complexity: 'medium',
        priority: 'high',
        description: 'Secure document sharing and client communication'
      },
      {
        name: 'E-Billing Stack',
        tools: ['LexisNexis CounselLink', 'Bottomline Legal Spend', 'Serengeti'],
        complexity: 'high',
        priority: 'medium',
        description: 'Enterprise legal billing and matter management'
      }
    ]
  },
  'Retail': {
    painPoints: [
      'Inventory shrinkage and loss prevention',
      'Customer retention and loyalty programs',
      'Multi-channel sales coordination',
      'Seasonal demand forecasting',
      'Staff scheduling and management',
      'Point-of-sale system integration',
      'Supply chain disruptions',
      'Price optimization and competition',
      'Customer service consistency',
      'Data analytics and reporting'
    ],
    recommendedStacks: [
      {
        name: 'POS + Inventory Stack',
        tools: ['Shopify POS', 'Square Retail', 'Lightspeed'],
        complexity: 'medium',
        priority: 'high',
        description: 'Integrated point-of-sale and inventory management'
      },
      {
        name: 'Loyalty Program Stack',
        tools: ['Yotpo', 'LoyaltyLion', 'Smile.io'],
        complexity: 'low',
        priority: 'medium',
        description: 'Customer loyalty and retention programs'
      },
      {
        name: 'E-commerce Integration Stack',
        tools: ['Shopify Plus', 'WooCommerce', 'BigCommerce'],
        complexity: 'high',
        priority: 'high',
        description: 'Multi-channel e-commerce platform integration'
      }
    ]
  },
  'Medical': {
    painPoints: [
      'Patient scheduling and appointment management',
      'HIPAA compliance and data security',
      'Medical billing and insurance claims',
      'Electronic health records integration',
      'Prescription management and tracking',
      'Patient communication and follow-up',
      'Staff scheduling and coordination',
      'Medical equipment maintenance',
      'Regulatory compliance reporting',
      'Telehealth platform integration'
    ],
    recommendedStacks: [
      {
        name: 'EHR Integration Stack',
        tools: ['Epic MyChart', 'Cerner', 'Allscripts'],
        complexity: 'high',
        priority: 'high',
        description: 'Electronic health records and patient data management'
      },
      {
        name: 'Appointment Scheduler',
        tools: ['Acuity Scheduling', 'SimplePractice', 'TherapyNotes'],
        complexity: 'medium',
        priority: 'high',
        description: 'Patient appointment scheduling and reminders'
      },
      {
        name: 'Secure Messaging Stack',
        tools: ['TigerConnect', 'Spok', 'Imprivata Cortext'],
        complexity: 'medium',
        priority: 'medium',
        description: 'HIPAA-compliant secure messaging for healthcare teams'
      }
    ]
  },
  'Real Estate': {
    painPoints: [
      'Lead tracking and nurturing',
      'Listing syndication across platforms',
      'Document signing and transaction management',
      'CRM and client relationship management',
      'Market analysis and pricing strategies',
      'Marketing automation and campaigns',
      'Commission tracking and splits',
      'Property photography and virtual tours',
      'Compliance and regulatory requirements',
      'Referral partner management'
    ],
    recommendedStacks: [
      {
        name: 'CRM Stack',
        tools: ['Chime', 'Follow Up Boss', 'LionDesk'],
        complexity: 'medium',
        priority: 'high',
        description: 'Real estate-specific customer relationship management'
      },
      {
        name: 'MLS Integration Stack',
        tools: ['Flexmls', 'MLS Grid', 'RETS Connector'],
        complexity: 'high',
        priority: 'high',
        description: 'Multiple listing service integration and syndication'
      },
      {
        name: 'E-Signature Stack',
        tools: ['DocuSign', 'Adobe Sign', 'PandaDoc'],
        complexity: 'low',
        priority: 'high',
        description: 'Digital document signing and transaction management'
      }
    ]
  },
  'Manufacturing': {
    painPoints: [
      'Supply chain delays and disruptions',
      'Quality control and defect tracking',
      'Regulatory compliance and auditing',
      'Equipment maintenance and downtime',
      'Production planning and scheduling',
      'Inventory management and forecasting',
      'Worker safety and incident reporting',
      'Cost accounting and profitability analysis',
      'Customer demand variability',
      'Environmental compliance reporting'
    ],
    recommendedStacks: [
      {
        name: 'MES Stack',
        tools: ['Wonderware MES', 'Siemens Opcenter', 'GE Digital Proficy'],
        complexity: 'high',
        priority: 'high',
        description: 'Manufacturing execution system for production control'
      },
      {
        name: 'IoT Monitoring Stack',
        tools: ['ThingWorx', 'Azure IoT', 'AWS IoT Core'],
        complexity: 'high',
        priority: 'medium',
        description: 'Connected equipment monitoring and predictive maintenance'
      },
      {
        name: 'Regulatory Compliance Stack',
        tools: ['MasterControl', 'Sparta TrackWise', 'AssurX'],
        complexity: 'high',
        priority: 'high',
        description: 'Quality management and regulatory compliance tracking'
      }
    ]
  },
  'Logistics': {
    painPoints: [
      'Route optimization and fuel costs',
      'Asset tracking and fleet management',
      'Proof-of-delivery documentation',
      'Driver communication and dispatch',
      'Load planning and capacity optimization',
      'Customer delivery notifications',
      'Maintenance scheduling for vehicles',
      'Regulatory compliance (DOT, HOS)',
      'Warehouse management and picking',
      'Claims processing and insurance'
    ],
    recommendedStacks: [
      {
        name: 'Route Planning Stack',
        tools: ['Route4Me', 'OptimoRoute', 'Workwave'],
        complexity: 'medium',
        priority: 'high',
        description: 'Advanced route optimization and planning'
      },
      {
        name: 'Fleet Tracking Stack',
        tools: ['Samsara', 'Verizon Connect', 'Geotab'],
        complexity: 'medium',
        priority: 'high',
        description: 'GPS tracking and fleet management solutions'
      },
      {
        name: 'Digital POD Stack',
        tools: ['ePOD', 'Proof of Delivery App', 'GetSwift'],
        complexity: 'low',
        priority: 'medium',
        description: 'Digital proof of delivery and signature capture'
      }
    ]
  },
  'Marketing Agencies': {
    painPoints: [
      'Client reporting and dashboard creation',
      'Campaign performance tracking',
      'Time tracking and billing accuracy',
      'Multi-platform campaign management',
      'Creative asset organization',
      'Client approval workflows',
      'ROI measurement and attribution',
      'Team collaboration and project management',
      'Lead generation and prospecting',
      'Contract and scope management'
    ],
    recommendedStacks: [
      {
        name: 'Campaign Analytics Stack',
        tools: ['Google Analytics 4', 'Adobe Analytics', 'Mixpanel'],
        complexity: 'high',
        priority: 'high',
        description: 'Advanced campaign performance tracking and analytics'
      },
      {
        name: 'Client Dashboard Stack',
        tools: ['DashThis', 'Klipfolio', 'AgencyAnalytics'],
        complexity: 'medium',
        priority: 'high',
        description: 'White-label client reporting and dashboards'
      },
      {
        name: 'Invoicing Stack',
        tools: ['FreshBooks', 'Harvest', 'TimeCamp'],
        complexity: 'low',
        priority: 'medium',
        description: 'Time tracking and automated invoicing for agencies'
      }
    ]
  },
  'Nonprofits': {
    painPoints: [
      'Donor tracking and relationship management',
      'Event management and ticketing',
      'Grant reporting and compliance',
      'Volunteer coordination and scheduling',
      'Fundraising campaign management',
      'Financial transparency and reporting',
      'Impact measurement and storytelling',
      'Board member communication',
      'Membership management',
      'Social media and marketing coordination'
    ],
    recommendedStacks: [
      {
        name: 'CRM for Nonprofits',
        tools: ['Salesforce Nonprofit Cloud', 'Blackbaud CRM', 'NeonCRM'],
        complexity: 'high',
        priority: 'high',
        description: 'Nonprofit-specific donor and volunteer management'
      },
      {
        name: 'Event Management Stack',
        tools: ['Eventbrite', 'Greater Giving', 'BidPal'],
        complexity: 'medium',
        priority: 'medium',
        description: 'Event planning, ticketing, and auction management'
      },
      {
        name: 'Grant Tracking Stack',
        tools: ['Foundant GLM', 'Fluxx', 'Submittable'],
        complexity: 'high',
        priority: 'high',
        description: 'Grant application and compliance tracking'
      }
    ]
  },
  'E-commerce': {
    painPoints: [
      'Cart abandonment and conversion optimization',
      'Inventory synchronization across channels',
      'Ad performance and attribution tracking',
      'Customer service and support scaling',
      'Shipping and fulfillment optimization',
      'Product photography and content management',
      'Seasonal demand planning',
      'Returns and refunds processing',
      'International shipping and taxes',
      'SEO and content marketing'
    ],
    recommendedStacks: [
      {
        name: 'Shopify/WooCommerce Stack',
        tools: ['Shopify Plus', 'WooCommerce', 'Magento Commerce'],
        complexity: 'medium',
        priority: 'high',
        description: 'Complete e-commerce platform with extensions'
      },
      {
        name: 'Ad Analytics Stack',
        tools: ['Facebook Ads Manager', 'Google Ads', 'Triple Whale'],
        complexity: 'medium',
        priority: 'high',
        description: 'Multi-platform advertising analytics and optimization'
      },
      {
        name: 'Automated Retargeting Stack',
        tools: ['Klaviyo', 'Omnisend', 'Yotpo SMS'],
        complexity: 'medium',
        priority: 'medium',
        description: 'Email and SMS marketing automation'
      }
    ]
  },
  'Hospitality': {
    painPoints: [
      'Booking management and overbooking risks',
      'Guest review management and reputation',
      'Staff scheduling and labor costs',
      'Revenue management and pricing optimization',
      'Guest service consistency',
      'Maintenance and housekeeping coordination',
      'Food and beverage inventory',
      'Event planning and coordination',
      'Loyalty program management',
      'Regulatory compliance and safety'
    ],
    recommendedStacks: [
      {
        name: 'PMS Stack',
        tools: ['Oracle Hospitality', 'Cloudbeds', 'RoomRaccoon'],
        complexity: 'high',
        priority: 'high',
        description: 'Property management system for hotels and resorts'
      },
      {
        name: 'Reputation Management Stack',
        tools: ['ReviewTrackers', 'Reputation.com', 'TrustYou'],
        complexity: 'medium',
        priority: 'high',
        description: 'Online review monitoring and response management'
      },
      {
        name: 'Staff Scheduler',
        tools: ['When I Work', 'Deputy', 'Homebase'],
        complexity: 'low',
        priority: 'medium',
        description: 'Employee scheduling and time tracking'
      }
    ]
  },
  'Education': {
    painPoints: [
      'Student engagement and attendance tracking',
      'Online course delivery and management',
      'Grading and assessment automation',
      'Parent-teacher communication',
      'Curriculum planning and standards alignment',
      'Student information system integration',
      'Learning analytics and progress tracking',
      'Resource and classroom management',
      'Accessibility and accommodation tracking',
      'Professional development coordination'
    ],
    recommendedStacks: [
      {
        name: 'LMS Stack',
        tools: ['Canvas', 'Blackboard', 'Google Classroom'],
        complexity: 'medium',
        priority: 'high',
        description: 'Learning management system for course delivery'
      },
      {
        name: 'Engagement Tracking Stack',
        tools: ['Kahoot!', 'Nearpod', 'Flipgrid'],
        complexity: 'low',
        priority: 'medium',
        description: 'Student engagement and interactive learning tools'
      },
      {
        name: 'Assessment Stack',
        tools: ['Gradescope', 'ExamSoft', 'Respondus'],
        complexity: 'medium',
        priority: 'high',
        description: 'Automated grading and assessment management'
      }
    ]
  },
  'Fitness/Wellness': {
    painPoints: [
      'Class booking and capacity management',
      'Membership renewals and retention',
      'Point-of-sale and retail integration',
      'Trainer scheduling and payroll',
      'Equipment maintenance and safety',
      'Member engagement and app usage',
      'Nutrition tracking and meal planning',
      'Progress tracking and goal setting',
      'Community building and challenges',
      'Insurance and liability management'
    ],
    recommendedStacks: [
      {
        name: 'Membership Management Stack',
        tools: ['Mindbody', 'Zen Planner', 'ClubReady'],
        complexity: 'medium',
        priority: 'high',
        description: 'Complete fitness business management solution'
      },
      {
        name: 'Booking Stack',
        tools: ['ClassPass', 'Acuity Scheduling', 'Vagaro'],
        complexity: 'low',
        priority: 'high',
        description: 'Class booking and appointment scheduling'
      },
      {
        name: 'POS Stack',
        tools: ['Square', 'Toast POS', 'Clover'],
        complexity: 'low',
        priority: 'medium',
        description: 'Point-of-sale for retail and services'
      }
    ]
  },
  'Technology Services': {
    painPoints: [
      'Ticket resolution time and SLA tracking',
      'Client onboarding and project kickoff',
      'Service level agreement monitoring',
      'Technical documentation and knowledge base',
      'Resource allocation and capacity planning',
      'Client communication and status updates',
      'Billing accuracy and time tracking',
      'Security incident response',
      'Vendor management and procurement',
      'Change management and approvals'
    ],
    recommendedStacks: [
      {
        name: 'ITSM Stack',
        tools: ['ServiceNow', 'Jira Service Management', 'Freshservice'],
        complexity: 'high',
        priority: 'high',
        description: 'IT service management and ticketing system'
      },
      {
        name: 'Client Onboarding Stack',
        tools: ['Process Street', 'Nintex', 'KiSSFLOW'],
        complexity: 'medium',
        priority: 'medium',
        description: 'Automated client onboarding workflows'
      },
      {
        name: 'SLA Tracker',
        tools: ['SolarWinds Service Desk', 'ManageEngine ServiceDesk', 'BMC Helix'],
        complexity: 'high',
        priority: 'high',
        description: 'Service level agreement monitoring and reporting'
      }
    ]
  }
};

/**
 * GET /api/ai-gap-analysis/industries
 * Get list of all supported industries
 */
router.get('/industries', (req, res) => {
  const industries = Object.keys(INDUSTRY_MAPPINGS).map(industry => ({
    name: industry,
    painPointCount: INDUSTRY_MAPPINGS[industry].painPoints.length,
    stackCount: INDUSTRY_MAPPINGS[industry].recommendedStacks.length
  }));

  res.json({
    industries,
    totalIndustries: industries.length,
    totalPainPoints: industries.reduce((sum, ind) => sum + ind.painPointCount, 0),
    totalStacks: industries.reduce((sum, ind) => sum + ind.stackCount, 0)
  });
});

/**
 * GET /api/ai-gap-analysis/industry/:industryName
 * Get detailed information for a specific industry
 */
router.get('/industry/:industryName', (req, res) => {
  const { industryName } = req.params;
  
  const industry = INDUSTRY_MAPPINGS[industryName];
  if (!industry) {
    return res.status(404).json({ 
      error: 'Industry not found',
      availableIndustries: Object.keys(INDUSTRY_MAPPINGS)
    });
  }

  res.json({
    industry: industryName,
    ...industry,
    lastUpdated: '2025-08-10T00:00:00Z'
  });
});

/**
 * POST /api/ai-gap-analysis/tenant/:tenantId/analyze
 * Perform gap analysis for a tenant based on their industry and current capabilities
 */
router.post('/tenant/:tenantId/analyze', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { 
      industry, 
      currentCapabilities = [], 
      businessSize = 'small',
      forceReprocess = false 
    } = req.body;

    if (!tenantId || !industry) {
      return res.status(400).json({ 
        error: 'Tenant ID and industry are required',
        requiredFields: ['tenantId', 'industry']
      });
    }

    const industryData = INDUSTRY_MAPPINGS[industry];
    if (!industryData) {
      return res.status(400).json({ 
        error: 'Unsupported industry',
        supportedIndustries: Object.keys(INDUSTRY_MAPPINGS)
      });
    }

    // Check if AI gap analysis is enabled
    const gapAnalysisEnabled = process.env.AI_GAP_ANALYSIS_ENABLED === 'true';
    if (!gapAnalysisEnabled) {
      return res.status(503).json({ 
        error: 'AI gap analysis is currently disabled',
        feature: 'ai-gap-analysis',
        enabled: false
      });
    }

    // Perform gap analysis
    const gapAnalysis = performGapAnalysis(tenantId, industry, industryData, currentCapabilities, businessSize);
    
    res.json({
      ...gapAnalysis,
      analysisId: `gap-analysis-${tenantId}-${Date.now()}`,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error performing gap analysis:', error);
    res.status(500).json({ error: 'Failed to perform gap analysis' });
  }
});

/**
 * GET /api/ai-gap-analysis/tenant/:tenantId/recommendations
 * Get personalized recommendations for a tenant
 */
router.get('/tenant/:tenantId/recommendations', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { priority, limit = 10 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Mock recommendations based on tenant analysis
    const recommendations = generateMockRecommendations(tenantId, priority, parseInt(limit));
    
    res.json({
      tenantId,
      recommendations,
      totalRecommendations: recommendations.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * Helper function to perform gap analysis
 */
function performGapAnalysis(tenantId, industry, industryData, currentCapabilities, businessSize) {
  const { painPoints, recommendedStacks } = industryData;
  
  // Calculate coverage score based on current capabilities
  const addressedPainPoints = painPoints.filter(painPoint => 
    currentCapabilities.some(capability => 
      painPoint.toLowerCase().includes(capability.toLowerCase()) ||
      capability.toLowerCase().includes(painPoint.toLowerCase())
    )
  );

  const coverageScore = addressedPainPoints.length / painPoints.length;
  
  // Identify gaps
  const gaps = painPoints.filter(painPoint => 
    !currentCapabilities.some(capability => 
      painPoint.toLowerCase().includes(capability.toLowerCase()) ||
      capability.toLowerCase().includes(painPoint.toLowerCase())
    )
  );

  // Prioritize recommendations based on gaps and business size
  const prioritizedStacks = recommendedStacks
    .map(stack => ({
      ...stack,
      relevanceScore: calculateRelevanceScore(stack, gaps, businessSize),
      addressedPainPoints: gaps.filter(gap => 
        stack.description.toLowerCase().includes(gap.toLowerCase()) ||
        gap.toLowerCase().includes(stack.name.toLowerCase())
      )
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return {
    tenantId,
    industry,
    analysisDate: new Date().toISOString(),
    businessSize,
    coverageScore: Math.round(coverageScore * 100),
    totalPainPoints: painPoints.length,
    addressedPainPoints: addressedPainPoints.length,
    identifiedGaps: gaps.length,
    topGaps: gaps.slice(0, 5),
    recommendedStacks: prioritizedStacks.slice(0, 5),
    riskFactors: generateRiskFactors(coverageScore, gaps),
    nextSteps: generateNextSteps(gaps, prioritizedStacks)
  };
}

/**
 * Calculate relevance score for a stack based on gaps and business size
 */
function calculateRelevanceScore(stack, gaps, businessSize) {
  let score = 0;
  
  // Base priority score
  const priorityScores = { high: 3, medium: 2, low: 1 };
  score += priorityScores[stack.priority] || 1;
  
  // Complexity adjustment based on business size
  const complexityScores = { low: 3, medium: 2, high: 1 };
  const sizeMultipliers = { small: 1.5, medium: 1.0, large: 0.8 };
  
  if (businessSize === 'small' && stack.complexity === 'high') {
    score *= 0.5; // Penalize high complexity for small businesses
  }
  
  score += complexityScores[stack.complexity] || 1;
  score *= sizeMultipliers[businessSize] || 1;
  
  // Gap addressing bonus
  const addressedGapCount = gaps.filter(gap => 
    stack.description.toLowerCase().includes(gap.toLowerCase()) ||
    gap.toLowerCase().includes(stack.name.toLowerCase())
  ).length;
  
  score += addressedGapCount * 0.5;
  
  return score;
}

/**
 * Generate risk factors based on coverage and gaps
 */
function generateRiskFactors(coverageScore, gaps) {
  const risks = [];
  
  if (coverageScore < 0.3) {
    risks.push({
      type: 'high',
      title: 'Critical Coverage Gap',
      description: 'Less than 30% of industry pain points are addressed'
    });
  }
  
  if (gaps.some(gap => gap.toLowerCase().includes('compliance'))) {
    risks.push({
      type: 'high',
      title: 'Compliance Risk',
      description: 'Regulatory compliance gaps identified'
    });
  }
  
  if (gaps.some(gap => gap.toLowerCase().includes('security'))) {
    risks.push({
      type: 'medium',
      title: 'Security Risk',
      description: 'Security-related process gaps detected'
    });
  }
  
  return risks;
}

/**
 * Generate next steps based on gaps and recommendations
 */
function generateNextSteps(gaps, recommendations) {
  const steps = [];
  
  if (recommendations.length > 0) {
    steps.push(`Evaluate "${recommendations[0].name}" for immediate implementation`);
  }
  
  if (gaps.length > 5) {
    steps.push('Schedule comprehensive process review session');
  }
  
  steps.push('Review and prioritize recommended capability stacks');
  steps.push('Contact StackPro consultation team for implementation planning');
  
  return steps;
}

/**
 * Generate mock recommendations for demo
 */
function generateMockRecommendations(tenantId, priority, limit) {
  const mockRecommendations = [
    {
      id: 'rec-1',
      title: 'Implement Automated Invoicing',
      priority: 'high',
      estimatedROI: '300%',
      implementationTime: '2-4 weeks',
      description: 'Reduce manual invoicing time by 80%'
    },
    {
      id: 'rec-2', 
      title: 'Deploy Project Management Stack',
      priority: 'high',
      estimatedROI: '250%',
      implementationTime: '4-6 weeks',
      description: 'Improve project delivery times by 25%'
    },
    {
      id: 'rec-3',
      title: 'Enhance Customer Communication',
      priority: 'medium',
      estimatedROI: '180%',
      implementationTime: '1-2 weeks',
      description: 'Increase customer satisfaction scores'
    }
  ];

  let filtered = mockRecommendations;
  if (priority) {
    filtered = mockRecommendations.filter(rec => rec.priority === priority);
  }
  
  return filtered.slice(0, limit);
}

module.exports = router;
