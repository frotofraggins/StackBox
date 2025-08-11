/**
 * Health Check Page
 * Tests API connectivity and displays system status
 */
import { useState, useEffect } from 'react';
import { api, checkApiHealth } from '../lib/api';
import { API_URL, WS_URL, ENV, IS_FREE_TIER } from '../lib/env';

interface SystemStatus {
  api: 'healthy' | 'error' | 'checking';
  timestamp: string;
  environment: string;
  apiUrl: string;
  wsUrl: string;
  freeTier: boolean;
}

export default function HealthPage() {
  const [status, setStatus] = useState<SystemStatus>({
    api: 'checking',
    timestamp: new Date().toISOString(),
    environment: ENV,
    apiUrl: API_URL,
    wsUrl: WS_URL,
    freeTier: IS_FREE_TIER,
  });

  useEffect(() => {
    async function checkHealth() {
      const isHealthy = await checkApiHealth();
      setStatus(prev => ({
        ...prev,
        api: isHealthy ? 'healthy' : 'error',
        timestamp: new Date().toISOString(),
      }));
    }

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'checking': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            StackPro System Health
          </h1>

          <div className="space-y-6">
            {/* API Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <h3 className="font-medium text-gray-900">API Connection</h3>
                <p className="text-sm text-gray-500">{status.apiUrl}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.api)}`}>
                {status.api}
              </span>
            </div>

            {/* Environment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Environment</h4>
                <p className="text-sm text-gray-600">{status.environment}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">Free Tier</h4>
                <p className="text-sm text-gray-600">
                  {status.freeTier ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>

            {/* WebSocket Info */}
            {status.wsUrl && (
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900">WebSocket URL</h4>
                <p className="text-sm text-gray-600 break-all">{status.wsUrl}</p>
              </div>
            )}

            {/* Last Check */}
            <div className="text-center text-sm text-gray-500">
              Last checked: {new Date(status.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
