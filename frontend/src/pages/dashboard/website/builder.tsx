/**
 * StackPro Site Builder Page
 * Main interface for building and editing websites
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SiteBuilder } from '../../../components/site-builder/core/SiteBuilder';

export default function SiteBuilderPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get client ID from token or URL
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Decode token to get client ID (simplified for demo)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setClientId(payload.clientId || 'demo-company-12345');
    } catch (error) {
      console.error('Failed to decode token:', error);
      setClientId('demo-company-12345');
    }

    setIsLoading(false);
  }, [router]);

  const handleSave = (config: any) => {
    console.log('Site saved:', config);
    // Show success notification
  };

  const handlePreview = () => {
    console.log('Preview requested');
    // Handle preview logic
  };

  const handlePublish = (staticSite: any) => {
    console.log('Site published:', staticSite);
    // Show success notification with live URL
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Site Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="site-builder-page">
      <SiteBuilder
        clientId={clientId}
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />
    </div>
  );
}
