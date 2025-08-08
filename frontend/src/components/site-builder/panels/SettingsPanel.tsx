/**
 * StackPro Site Builder - Settings Panel
 * Manages site settings, SEO, and domain configuration
 */

import React, { useState } from 'react';
import { SiteSettings } from '../core/SiteBuilder';
import { Globe, Search, Image, Tag, ExternalLink, Trash2 } from 'lucide-react';

export interface SettingsPanelProps {
  settings: SiteSettings;
  onChange: (settings: SiteSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  const [activeSection, setActiveSection] = useState<'general' | 'seo' | 'domain'>('general');
  const [newKeyword, setNewKeyword] = useState('');

  // Handle settings change
  const handleChange = (field: keyof SiteSettings, value: any) => {
    const newSettings = {
      ...settings,
      [field]: value
    };
    onChange(newSettings);
  };

  // Handle SEO change
  const handleSEOChange = (field: keyof SiteSettings['seo'], value: any) => {
    const newSettings = {
      ...settings,
      seo: {
        ...settings.seo,
        [field]: value
      }
    };
    onChange(newSettings);
  };

  // Add SEO keyword
  const addKeyword = () => {
    if (newKeyword.trim() && !settings.seo.keywords.includes(newKeyword.trim())) {
      const keywords = [...settings.seo.keywords, newKeyword.trim()];
      handleSEOChange('keywords', keywords);
      setNewKeyword('');
    }
  };

  // Remove SEO keyword
  const removeKeyword = (keyword: string) => {
    const keywords = settings.seo.keywords.filter(k => k !== keyword);
    handleSEOChange('keywords', keywords);
  };

  // Handle Enter key in keyword input
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="settings-panel h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Settings</h3>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('general')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'general'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveSection('seo')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'seo'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="h-4 w-4 mr-2" />
            SEO
          </button>
          <button
            onClick={() => setActiveSection('domain')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'domain'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Domain
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* General Section */}
        {activeSection === 'general' && (
          <div className="space-y-6">
            {/* Site Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Site Information</h4>
              <div className="space-y-4">
                {/* Site Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleChange('siteName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Business Name"
                  />
                </div>

                {/* Site Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => handleChange('siteDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of your business..."
                  />
                </div>

                {/* Domain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={settings.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="yourbusiness.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use your StackPro subdomain
                  </p>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Branding</h4>
              <div className="space-y-4">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.logo || ''}
                    onChange={(e) => handleChange('logo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                  {settings.logo && (
                    <div className="mt-2">
                      <img
                        src={settings.logo}
                        alt="Logo preview"
                        className="h-12 w-auto border border-gray-200 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Favicon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={settings.favicon || ''}
                    onChange={(e) => handleChange('favicon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/favicon.ico"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Small icon displayed in browser tab (16x16 or 32x32px)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO Section */}
        {activeSection === 'seo' && (
          <div className="space-y-6">
            {/* Meta Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Meta Information</h4>
              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title *
                  </label>
                  <input
                    type="text"
                    value={settings.seo.title}
                    onChange={(e) => handleSEOChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your Business - Professional Services"
                    maxLength={60}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.seo.title.length}/60 characters (recommended)
                  </p>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description *
                  </label>
                  <textarea
                    value={settings.seo.description}
                    onChange={(e) => handleSEOChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description that appears in search results..."
                    maxLength={160}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {settings.seo.description.length}/160 characters (recommended)
                  </p>
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Keywords</h4>
              <div className="space-y-3">
                {/* Add Keywords */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeywordKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add keyword..."
                  />
                  <button
                    onClick={addKeyword}
                    disabled={!newKeyword.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </div>

                {/* Keywords List */}
                {settings.seo.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {settings.seo.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Add keywords that describe your business and services
                </p>
              </div>
            </div>

            {/* SEO Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Search Preview</h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-blue-600 text-lg font-medium truncate">
                  {settings.seo.title || settings.siteName}
                </div>
                <div className="text-green-600 text-sm">
                  {settings.domain || 'yoursite.stackpro.io'}
                </div>
                <div className="text-gray-600 text-sm mt-1">
                  {settings.seo.description || settings.siteDescription || 'No description provided'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Domain Section */}
        {activeSection === 'domain' && (
          <div className="space-y-6">
            {/* Domain Configuration */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Domain Configuration</h4>
              <div className="space-y-4">
                {/* Current Domain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Domain
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={settings.domain}
                      onChange={(e) => handleChange('domain', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="yourbusiness.com"
                    />
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Verify
                    </button>
                  </div>
                </div>

                {/* Domain Status */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-yellow-800">Domain Setup Required</h5>
                      <p className="text-sm text-yellow-700 mt-1">
                        Point your domain to our servers to complete setup
                      </p>
                    </div>
                  </div>
                </div>

                {/* DNS Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">DNS Configuration</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-mono">CNAME</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-mono">www</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-mono">stackpro.io</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SSL Configuration */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">SSL Certificate</h4>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-green-800">SSL Enabled</h5>
                      <p className="text-sm text-green-700 mt-1">
                        Your site is secured with automatic SSL certificate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  SSL certificates are automatically managed and renewed for all StackPro sites.
                </div>
              </div>
            </div>

            {/* Performance Settings */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">CDN Enabled</label>
                    <p className="text-sm text-gray-500">Global content delivery network</p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Image Optimization</label>
                    <p className="text-sm text-gray-500">Automatic image compression</p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Caching</label>
                    <p className="text-sm text-gray-500">Browser and edge caching</p>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Changes are automatically saved
        </div>
      </div>
    </div>
  );
};
