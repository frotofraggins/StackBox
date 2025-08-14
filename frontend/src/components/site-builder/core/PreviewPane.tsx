/**
 * StackPro Site Builder - Preview Pane
 * Live preview of the website being built
 */

import React, { useState, useRef, useEffect } from 'react';
import { SiteConfig } from './SiteBuilder';
import { X, Monitor, Smartphone, Tablet, ExternalLink } from 'lucide-react';

export interface PreviewPaneProps {
  siteConfig: SiteConfig;
  onClose: () => void;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

export const PreviewPane: React.FC<PreviewPaneProps> = ({ siteConfig, onClose }) => {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate preview HTML with theme applied
  const generatePreviewHTML = () => {
    const { theme, content, settings } = siteConfig;
    
    const html = content?.html || '<div class="text-center p-8"><h1>No content yet</h1><p>Start building your site!</p></div>';
    const css = content?.css || '';
    
    const themeCSS = `
      :root {
        --primary-color: ${theme.colors.primary};
        --secondary-color: ${theme.colors.secondary};
        --accent-color: ${theme.colors.accent};
        --text-color: ${theme.colors.text};
        --background-color: ${theme.colors.background};
        --heading-font: ${theme.fonts.heading}, sans-serif;
        --body-font: ${theme.fonts.body}, sans-serif;
        --container-width: ${theme.spacing.container};
        --section-padding: ${theme.spacing.section};
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: var(--body-font);
        color: var(--text-color);
        background-color: var(--background-color);
        line-height: 1.6;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--heading-font);
        color: var(--text-color);
        margin-top: 0;
        margin-bottom: 1rem;
      }
      
      .container {
        max-width: var(--container-width);
        margin: 0 auto;
        padding: 0 20px;
      }
      
      .section {
        padding: var(--section-padding) 0;
      }
      
      .btn {
        display: inline-block;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
      }
      
      .btn-primary {
        background-color: var(--primary-color);
        color: white;
      }
      
      .btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      
      .btn-secondary {
        background-color: var(--secondary-color);
        color: white;
      }
      
      .btn-secondary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      
      .btn-lg {
        padding: 16px 32px;
        font-size: 1.1rem;
      }
      
      .text-center {
        text-align: center;
      }
      
      .text-primary {
        color: var(--primary-color);
      }
      
      .bg-primary {
        background-color: var(--primary-color);
        color: white;
      }
      
      .text-white {
        color: white;
      }
      
      .display-4 {
        font-size: 2.5rem;
        font-weight: 700;
        line-height: 1.2;
      }
      
      .lead {
        font-size: 1.25rem;
        font-weight: 300;
      }
      
      .mb-3 {
        margin-bottom: 1rem;
      }
      
      .mb-4 {
        margin-bottom: 1.5rem;
      }
      
      .row {
        display: flex;
        flex-wrap: wrap;
        margin: 0 -15px;
      }
      
      .col-12 {
        flex: 0 0 100%;
        max-width: 100%;
        padding: 0 15px;
      }
      
      .col-md-8 {
        flex: 0 0 66.666667%;
        max-width: 66.666667%;
        padding: 0 15px;
      }
      
      .justify-content-center {
        justify-content: center;
      }
      
      .form-control {
        display: block;
        width: 100%;
        padding: 8px 12px;
        font-size: 1rem;
        line-height: 1.5;
        color: var(--text-color);
        background-color: white;
        border: 1px solid #ced4da;
        border-radius: 4px;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      }
      
      .form-control:focus {
        outline: 0;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.25);
      }
      
      .form-label {
        display: inline-block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      @media (max-width: 768px) {
        .container {
          padding: 0 15px;
        }
        
        .display-4 {
          font-size: 2rem;
        }
        
        .section {
          padding: calc(var(--section-padding) * 0.6) 0;
        }
        
        .col-md-8 {
          flex: 0 0 100%;
          max-width: 100%;
        }
      }
      
      ${css}
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${settings.seo.title}</title>
          <meta name="description" content="${settings.seo.description}">
          <style>${themeCSS}</style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  };

  // Update iframe content when config changes
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        setIsLoading(true);
        doc.open();
        doc.write(generatePreviewHTML());
        doc.close();
        
        // Handle iframe load
        iframe.onload = () => {
          setIsLoading(false);
        };
      }
    }
  }, [siteConfig]);

  // Device dimensions
  const getDeviceDimensions = () => {
    switch (device) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getDeviceDimensions();

  // Open in new tab
  const openInNewTab = () => {
    const previewHTML = generatePreviewHTML();
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="preview-pane h-full bg-surface-2 flex flex-col">
      {/* Preview Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          
          {/* Device Selector */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-lg ${
                device === 'desktop' 
                  ? 'bg-blue-100 text-secondary' 
                  : 'text-muted hover:text-gray-900'
              }`}
              title="Desktop"
            >
              <Monitor className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setDevice('tablet')}
              className={`p-2 rounded-lg ${
                device === 'tablet' 
                  ? 'bg-blue-100 text-secondary' 
                  : 'text-muted hover:text-gray-900'
              }`}
              title="Tablet"
            >
              <Tablet className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-lg ${
                device === 'mobile' 
                  ? 'bg-blue-100 text-secondary' 
                  : 'text-muted hover:text-gray-900'
              }`}
              title="Mobile"
            >
              <Smartphone className="h-5 w-5" />
            </button>
          </div>
          
          {/* Device Label */}
          <span className="text-sm text-gray-500">
            {dimensions.width} × {dimensions.height}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className="flex items-center px-3 py-2 text-muted hover:text-gray-900 rounded-lg"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-gray-900 rounded-lg"
            title="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-surface-2 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-secondary rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-4 h-4 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}

        <div 
          className={`preview-container bg-white shadow-lg ${
            device === 'desktop' ? 'w-full h-full' : 'rounded-lg overflow-hidden'
          }`}
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: device === 'desktop' ? '100%' : dimensions.width,
            maxHeight: device === 'desktop' ? '100%' : dimensions.height
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Site Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Preview Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-center">
        <p className="text-sm text-gray-500">
          Preview for: {siteConfig.settings.domain || `${siteConfig.clientId}.stackpro.io`}
        </p>
      </div>
    </div>
  );
};
