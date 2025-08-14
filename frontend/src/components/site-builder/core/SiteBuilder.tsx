/**
 * StackPro Site Builder - Main Component
 * React-based drag-and-drop website builder using GrapesJS
 */

import React, { useState, useEffect, useRef } from 'react';
import { GrapesJSEditor } from './GrapesJSEditor';
import { ThemePanel } from '../panels/ThemePanel';
import { AssetPanel } from '../panels/AssetPanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { PreviewPane } from './PreviewPane';
import { TemplateSelector } from '../templates/TemplateSelector';
import { exportToStatic } from '../utils/exportToStatic';
import { Save, Eye, Settings, Palette, Image, Download, Undo, Redo } from 'lucide-react';

export interface SiteBuilderProps {
  clientId: string;
  initialConfig?: SiteConfig;
  onSave?: (config: SiteConfig) => void;
  onPreview?: () => void;
  onPublish?: (staticFiles: StaticSite) => void;
}

export interface SiteConfig {
  id: string;
  clientId: string;
  template: string;
  theme: ThemeConfig;
  content: any; // GrapesJS data
  settings: SiteSettings;
  lastModified: string;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    container: string;
    section: string;
  };
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  domain: string;
  logo?: string;
  favicon?: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface StaticSite {
  html: string;
  css: string;
  js?: string;
  assets: string[];
  config: SiteConfig;
}

export const SiteBuilder: React.FC<SiteBuilderProps> = ({
  clientId,
  initialConfig,
  onSave,
  onPreview,
  onPublish
}) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(
    initialConfig || {
      id: `site-${clientId}-${Date.now()}`,
      clientId,
      template: 'business-basic',
      theme: {
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981',
          text: '#1F2937',
          background: '#FFFFFF'
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter'
        },
        spacing: {
          container: '1200px',
          section: '80px'
        }
      },
      content: null,
      settings: {
        siteName: 'My Business',
        siteDescription: 'Professional business website',
        domain: `${clientId}.stackpro.io`,
        seo: {
          title: 'My Business - Professional Services',
          description: 'Professional business services and solutions',
          keywords: ['business', 'professional', 'services']
        }
      },
      lastModified: new Date().toISOString()
    }
  );

  const [activePanel, setActivePanel] = useState<'theme' | 'assets' | 'settings' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(!initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [history, setHistory] = useState<SiteConfig[]>([siteConfig]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef<any>(null);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (siteConfig.content) {
        handleSave(true); // Auto-save
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [siteConfig]);

  // Handle content changes from GrapesJS
  const handleContentChange = (content: any) => {
    const newConfig = {
      ...siteConfig,
      content,
      lastModified: new Date().toISOString()
    };
    
    setSiteConfig(newConfig);
    
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Handle theme changes
  const handleThemeChange = (theme: ThemeConfig) => {
    const newConfig = {
      ...siteConfig,
      theme,
      lastModified: new Date().toISOString()
    };
    
    setSiteConfig(newConfig);
    
    // Apply theme to editor
    if (editorRef.current) {
      editorRef.current.applyTheme(theme);
    }
  };

  // Handle settings changes
  const handleSettingsChange = (settings: SiteSettings) => {
    setSiteConfig({
      ...siteConfig,
      settings,
      lastModified: new Date().toISOString()
    });
  };

  // Save site configuration
  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true);
    
    try {
      // Save to backend
      const response = await fetch(`/api/site-builder/sites/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(siteConfig)
      });

      if (response.ok) {
        if (!isAutoSave) {
          // Show success notification
          console.log('Site saved successfully');
        }
        
        if (onSave) {
          onSave(siteConfig);
        }
      } else {
        throw new Error('Failed to save site');
      }
    } catch (error) {
      console.error('Save error:', error);
      // Show error notification
    } finally {
      setIsSaving(false);
    }
  };

  // Preview site
  const handlePreview = () => {
    setShowPreview(true);
    if (onPreview) {
      onPreview();
    }
  };

  // Publish site
  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // Generate static site
      const staticSite = await exportToStatic(siteConfig, editorRef.current);
      
      // Publish to backend
      const response = await fetch(`/api/site-builder/publish/${clientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          siteConfig,
          staticSite
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Site published successfully:', result.url);
        
        if (onPublish) {
          onPublish(staticSite);
        }
      } else {
        throw new Error('Failed to publish site');
      }
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSiteConfig(history[newIndex]);
      
      if (editorRef.current) {
        editorRef.current.loadContent(history[newIndex].content);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSiteConfig(history[newIndex]);
      
      if (editorRef.current) {
        editorRef.current.loadContent(history[newIndex].content);
      }
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSiteConfig({
      ...siteConfig,
      template: templateId
    });
    setShowTemplateSelector(false);
  };

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        clientId={clientId}
        onSelect={handleTemplateSelect}
        onSkip={() => setShowTemplateSelector(false)}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface-2">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Site Builder - {siteConfig.settings.siteName}
          </h1>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 text-muted hover:text-gray-900 disabled:opacity-50"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-muted hover:text-gray-900 disabled:opacity-50"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActivePanel(activePanel === 'theme' ? null : 'theme')}
            className={`p-2 rounded-lg ${
              activePanel === 'theme' 
                ? 'bg-blue-100 text-secondary' 
                : 'text-muted hover:text-gray-900'
            }`}
            title="Theme"
          >
            <Palette className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'assets' ? null : 'assets')}
            className={`p-2 rounded-lg ${
              activePanel === 'assets' 
                ? 'bg-blue-100 text-secondary' 
                : 'text-muted hover:text-gray-900'
            }`}
            title="Assets"
          >
            <Image className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            className={`p-2 rounded-lg ${
              activePanel === 'settings' 
                ? 'bg-blue-100 text-secondary' 
                : 'text-muted hover:text-gray-900'
            }`}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          <button
            onClick={handlePreview}
            className="flex items-center px-3 py-2 text-muted hover:text-gray-900 rounded-lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center px-3 py-2 bg-surface-2 text-muted rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Side Panel */}
        {activePanel && (
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            {activePanel === 'theme' && (
              <ThemePanel
                theme={siteConfig.theme}
                onChange={handleThemeChange}
              />
            )}
            {activePanel === 'assets' && (
              <AssetPanel
                clientId={clientId}
                onAssetSelect={(asset) => {
                  // Handle asset selection in editor
                  if (editorRef.current) {
                    editorRef.current.insertAsset(asset);
                  }
                }}
              />
            )}
            {activePanel === 'settings' && (
              <SettingsPanel
                settings={siteConfig.settings}
                onChange={handleSettingsChange}
              />
            )}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {showPreview ? (
            <PreviewPane
              siteConfig={siteConfig}
              onClose={() => setShowPreview(false)}
            />
          ) : (
            <GrapesJSEditor
              ref={editorRef}
              config={siteConfig}
              onChange={handleContentChange}
              theme={siteConfig.theme}
            />
          )}
        </div>
      </div>
    </div>
  );
};
