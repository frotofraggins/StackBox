'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { OnboardingData, EmailConfiguration } from '../../../lib/onboarding';

interface EmailStepProps {
  data: OnboardingData;
  onComplete: (data: Partial<OnboardingData>) => void;
  onBack?: () => void;
}

interface DNSRecord {
  name: string;
  type: 'TXT' | 'CNAME' | 'NS' | 'MX';
  value: string;
  ttl?: number;
  priority?: number;
  description?: string;
}

interface DomainSetup {
  setupId: string;
  domain: string;
  status: 'pending-dns' | 'pending-verification' | 'verified' | 'failed';
  dnsRecords: DNSRecord[];
  nextSteps: string[];
  estimatedTime: string;
}

export default function EmailStep({ data, onComplete, onBack }: EmailStepProps) {
  const emailConfig = data.emailConfiguration || {} as EmailConfiguration;
  const tenantId = `tenant_${data.businessType || 'demo'}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    emailConfig.emailFeatures || []
  );
  const [domainChoice, setDomainChoice] = useState<'bring' | 'buy' | 'stackpro' | null>(
    emailConfig.domainChoice || null
  );
  const [customDomain, setCustomDomain] = useState(emailConfig.customDomain || '');
  const [mode, setMode] = useState<'delegated-subdomain' | 'full-zone'>(
    emailConfig.mode || 'delegated-subdomain'
  );
  const [forwardTo, setForwardTo] = useState(emailConfig.forwardTo || '');
  const [domainSetup, setDomainSetup] = useState<DomainSetup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  const emailFeatureOptions = [
    {
      id: 'transactional',
      title: 'Transactional & Forwarding',
      description: 'Professional email addresses that forward to your existing email',
      recommended: true
    },
    {
      id: 'marketing',
      title: 'Marketing Campaigns',
      description: 'Bulk email campaigns with analytics and automation',
      premium: true
    }
  ];

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleGenerateDNS = async () => {
    if (!customDomain || !selectedFeatures.length) {
      setError('Please select email features and enter a domain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/domains/request-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          tenantId,
          domain: customDomain,
          mode,
          addresses: ['admin', 'info', 'support'],
          forwardTo: forwardTo || undefined
        }),
      });

      const data = await response.json();

      if (data.degraded) {
        setError(data.error || 'Email stack is currently disabled');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup domain');
      }

      setDomainSetup(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate DNS records');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, recordId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(recordId);
      setTimeout(() => setCopiedRecord(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatDNSRecord = (record: DNSRecord): string => {
    if (record.type === 'MX') {
      return `${record.name} ${record.ttl || 300} IN ${record.type} ${record.priority || 10} ${record.value}`;
    }
    return `${record.name} ${record.ttl || 300} IN ${record.type} "${record.value}"`;
  };

  const handleNext = () => {
    const emailConfiguration: EmailConfiguration = {
      emailFeatures: selectedFeatures,
      domainChoice,
      customDomain,
      mode,
      forwardTo,
      domainSetup,
      setupCompleted: domainSetup?.status === 'verified'
    };

    onComplete({ emailConfiguration });
  };

  const isEnabled = process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true';

  if (!isEnabled) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Email Stack Coming Soon
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Professional email capabilities will be available in the next release.
          </p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onComplete({ emailConfiguration: { emailFeatures: [], skipEmail: true } })}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Skip Email Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Professional Email Setup
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure professional email addresses and marketing capabilities for your business.
        </p>
      </div>

      {/* Feature Selection */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Select Email Features
        </h4>
        <div className="space-y-3">
          {emailFeatureOptions.map((option) => (
            <div key={option.id} className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id={option.id}
                  type="checkbox"
                  checked={selectedFeatures.includes(option.id)}
                  onChange={() => handleFeatureToggle(option.id)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={option.id} className="font-medium text-gray-700 dark:text-gray-300">
                  {option.title}
                  {option.recommended && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-100">
                      Recommended
                    </span>
                  )}
                  {option.premium && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                      Premium
                    </span>
                  )}
                </label>
                <p className="text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedFeatures.length > 0 && (
        <>
          {/* Domain Choice */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Domain Configuration
            </h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="bring-domain"
                  type="radio"
                  name="domain-choice"
                  checked={domainChoice === 'bring'}
                  onChange={() => setDomainChoice('bring')}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="bring-domain" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use my existing domain
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="buy-domain"
                  type="radio"
                  name="domain-choice"
                  checked={domainChoice === 'buy'}
                  onChange={() => setDomainChoice('buy')}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="buy-domain" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buy a new domain through StackPro
                  <span className="ml-1 text-xs text-gray-500">(Coming Soon)</span>
                </label>
              </div>
            </div>
          </div>

          {domainChoice === 'bring' && (
            <div className="space-y-4">
              <div>
                <label htmlFor="custom-domain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Domain
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="custom-domain"
                    placeholder="mail.yourbusiness.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  We recommend using a subdomain like mail.yourdomain.com
                </p>
              </div>

              <div>
                <label htmlFor="forward-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Forward emails to
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="forward-to"
                    placeholder="your@email.com"
                    value={forwardTo}
                    onChange={(e) => setForwardTo(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  DNS Management Mode
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="delegated"
                      type="radio"
                      name="mode"
                      checked={mode === 'delegated-subdomain'}
                      onChange={() => setMode('delegated-subdomain')}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="delegated" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Subdomain Delegation (Recommended)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="full-zone"
                      type="radio"
                      name="mode"
                      checked={mode === 'full-zone'}
                      onChange={() => setMode('full-zone')}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="full-zone" className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Full Zone Management
                    </label>
                  </div>
                </div>
              </div>

              {!domainSetup && (
                <button
                  type="button"
                  onClick={handleGenerateDNS}
                  disabled={loading || !customDomain}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate DNS Records'}
                </button>
              )}
            </div>
          )}

          {domainChoice === 'buy' && (
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Domain Purchase Coming Soon
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      We're adding domain purchase capabilities. For now, please use an existing domain 
                      or register one with your preferred registrar and select "Use my existing domain".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Setup Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {domainSetup && (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  DNS Records Generated
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Add these DNS records to configure email for {domainSetup.domain}</p>
                  <p className="mt-1 font-medium">Estimated setup time: {domainSetup.estimatedTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              DNS Records to Add ({domainSetup.dnsRecords.length})
            </h4>
            <div className="space-y-2">
              {domainSetup.dnsRecords.map((record, index) => (
                <div key={index} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {record.type}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.name}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {record.description}
                      </p>
                      <div className="mt-2 rounded bg-gray-50 p-2 font-mono text-xs dark:bg-gray-800">
                        <div className="break-all">{formatDNSRecord(record)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formatDNSRecord(record), `${index}`)}
                      className="ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-600"
                    >
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      {copiedRecord === `${index}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Next Steps:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              {domainSetup.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={selectedFeatures.length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
