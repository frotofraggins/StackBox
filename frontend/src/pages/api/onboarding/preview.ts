import type { NextApiRequest, NextApiResponse } from 'next'
import { getMockPreviewData } from '../../../lib/onboarding'

interface OnboardingPreviewRequest {
  businessType?: string
  businessSize?: string
  industry?: string
  connectors?: string[]
  consentSettings?: {
    analytics: boolean
    marketing: boolean
    personalization: boolean
  }
}

interface PreviewData {
  degraded: boolean
  sampleData: Array<{
    source: string
    type: string
    count: string
    trend: string
  }>
  message?: string
  guidance?: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreviewData | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data: OnboardingPreviewRequest = req.body

    // Always return degraded mode in free tier
    const isFreeTier = process.env.NEXT_PUBLIC_FREE_TIER === 'true'
    const isDataLakeEnabled = process.env.CAP_DATALAKE_ENABLED === 'true'

    if (isFreeTier || !isDataLakeEnabled) {
      const mockData = getMockPreviewData()
      
      // Customize sample data based on business type and selected connectors
      const customizedData = customizeSampleData(mockData.sampleData, data)
      
      return res.status(200).json({
        degraded: true,
        sampleData: customizedData,
        message: 'This is sample data. Connect your actual systems to see real insights.',
        guidance: 'Complete your setup to unlock personalized recommendations and insights.'
      })
    }

    // In a real implementation, this would query actual data sources
    // For now, always return mock data
    const mockData = getMockPreviewData()
    const customizedData = customizeSampleData(mockData.sampleData, data)

    return res.status(200).json({
      degraded: true,
      sampleData: customizedData,
      message: 'Preview mode - showing sample data patterns based on your selections.'
    })

  } catch (error) {
    console.error('Onboarding preview error:', error)
    
    // Graceful fallback
    const fallbackData = getMockPreviewData()
    return res.status(200).json({
      degraded: true,
      sampleData: fallbackData.sampleData,
      message: 'Sample data preview - complete setup to see your actual insights.'
    })
  }
}

function customizeSampleData(
  baseSampleData: Array<{
    source: string
    type: string
    count: string
    trend: string
  }>,
  userData: OnboardingPreviewRequest
): Array<{
  source: string
  type: string
  count: string
  trend: string
}> {
  const customData = [...baseSampleData]
  
  // Customize based on business type
  if (userData.businessType === 'law-firm') {
    customData[0] = {
      source: 'Case Management',
      type: 'Active Cases',
      count: '42 cases',
      trend: '+5%'
    }
    customData[1] = {
      source: 'Client Portal',
      type: 'Client Interactions',
      count: '128 contacts',
      trend: '+12%'
    }
    customData[2] = {
      source: 'Billing System',
      type: 'Outstanding Invoices',
      count: '$45,200',
      trend: '-8%'
    }
  } else if (userData.businessType === 'ecommerce') {
    customData[0] = {
      source: 'Online Store',
      type: 'Orders',
      count: '156 orders',
      trend: '+18%'
    }
    customData[1] = {
      source: 'Customer Database',
      type: 'New Customers',
      count: '89 customers',
      trend: '+24%'
    }
    customData[2] = {
      source: 'Payment Gateway',
      type: 'Revenue',
      count: '$12,450',
      trend: '+15%'
    }
  } else if (userData.businessType === 'consulting') {
    customData[0] = {
      source: 'Project Management',
      type: 'Active Projects',
      count: '12 projects',
      trend: '+3%'
    }
    customData[1] = {
      source: 'Time Tracking',
      type: 'Billable Hours',
      count: '340 hours',
      trend: '+7%'
    }
    customData[2] = {
      source: 'Client Relations',
      type: 'Proposals Sent',
      count: '8 proposals',
      trend: '+33%'
    }
  }

  // Add specific connectors if selected
  if (userData.connectors && userData.connectors.length > 0) {
    const connectorMap: Record<string, { source: string; type: string; count: string; trend: string }> = {
      'google-analytics': {
        source: 'Google Analytics',
        type: 'Website Visitors',
        count: '2,456 visitors',
        trend: '+14%'
      },
      'salesforce': {
        source: 'Salesforce',
        type: 'Sales Pipeline',
        count: '$89,400',
        trend: '+22%'
      },
      'stripe': {
        source: 'Stripe',
        type: 'Payment Volume',
        count: '$15,600',
        trend: '+18%'
      },
      'mailchimp': {
        source: 'Mailchimp',
        type: 'Email Opens',
        count: '68% open rate',
        trend: '+4%'
      }
    }

    // Replace the last items with selected connectors
    userData.connectors.slice(0, 2).forEach((connectorId, index) => {
      if (connectorMap[connectorId] && customData[index + 1]) {
        customData[index + 1] = connectorMap[connectorId]
      }
    })
  }

  return customData
}
