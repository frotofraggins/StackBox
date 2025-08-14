/**
 * StackPro Site Builder - Theme Panel
 * Allows users to customize colors, fonts, and spacing
 */

import React, { useState } from 'react';
import { ThemeConfig } from '../core/SiteBuilder';
import { Palette, Type, Layout, RotateCcw } from 'lucide-react';

export interface ThemePanelProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

interface ColorPreset {
  name: string;
  colors: ThemeConfig['colors'];
}

interface FontPreset {
  name: string;
  fonts: ThemeConfig['fonts'];
}

export const ThemePanel: React.FC<ThemePanelProps> = ({ theme, onChange }) => {
  const [activeSection, setActiveSection] = useState<'colors' | 'fonts' | 'spacing'>('colors');

  // Color presets for quick selection
  const colorPresets: ColorPreset[] = [
    {
      name: 'Professional Blue',
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        accent: '#10B981',
        text: '#1F2937',
        background: '#FFFFFF'
      }
    },
    {
      name: 'Legal Dark',
      colors: {
        primary: '#1F2937',
        secondary: '#4B5563',
        accent: '#F59E0B',
        text: '#111827',
        background: '#FFFFFF'
      }
    },
    {
      name: 'Medical Green',
      colors: {
        primary: '#059669',
        secondary: '#6B7280',
        accent: '#3B82F6',
        text: '#1F2937',
        background: '#FFFFFF'
      }
    },
    {
      name: 'Creative Purple',
      colors: {
        primary: '#8B5CF6',
        secondary: '#6B7280',
        accent: '#F59E0B',
        text: '#1F2937',
        background: '#FFFFFF'
      }
    },
    {
      name: 'Real Estate Orange',
      colors: {
        primary: '#EA580C',
        secondary: '#6B7280',
        accent: '#3B82F6',
        text: '#1F2937',
        background: '#FFFFFF'
      }
    }
  ];

  // Font presets
  const fontPresets: FontPreset[] = [
    {
      name: 'Modern Sans',
      fonts: {
        heading: 'Inter',
        body: 'Inter'
      }
    },
    {
      name: 'Classic Serif',
      fonts: {
        heading: 'Georgia',
        body: 'Georgia'
      }
    },
    {
      name: 'Professional Mix',
      fonts: {
        heading: 'Playfair Display',
        body: 'Source Sans Pro'
      }
    },
    {
      name: 'Tech Sans',
      fonts: {
        heading: 'Roboto',
        body: 'Roboto'
      }
    },
    {
      name: 'Editorial',
      fonts: {
        heading: 'Merriweather',
        body: 'Open Sans'
      }
    }
  ];

  // Handle color change
  const handleColorChange = (colorType: keyof ThemeConfig['colors'], value: string) => {
    const newTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [colorType]: value
      }
    };
    onChange(newTheme);
  };

  // Handle font change
  const handleFontChange = (fontType: keyof ThemeConfig['fonts'], value: string) => {
    const newTheme = {
      ...theme,
      fonts: {
        ...theme.fonts,
        [fontType]: value
      }
    };
    onChange(newTheme);
  };

  // Handle spacing change
  const handleSpacingChange = (spacingType: keyof ThemeConfig['spacing'], value: string) => {
    const newTheme = {
      ...theme,
      spacing: {
        ...theme.spacing,
        [spacingType]: value
      }
    };
    onChange(newTheme);
  };

  // Apply color preset
  const applyColorPreset = (preset: ColorPreset) => {
    const newTheme = {
      ...theme,
      colors: preset.colors
    };
    onChange(newTheme);
  };

  // Apply font preset
  const applyFontPreset = (preset: FontPreset) => {
    const newTheme = {
      ...theme,
      fonts: preset.fonts
    };
    onChange(newTheme);
  };

  // Reset to default theme
  const resetTheme = () => {
    const defaultTheme: ThemeConfig = {
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
    };
    onChange(defaultTheme);
  };

  return (
    <div className="theme-panel h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Theme Settings</h3>
          <button
            onClick={resetTheme}
            className="p-2 text-muted hover:text-gray-900 rounded-lg"
            title="Reset to default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-surface-2 rounded-lg p-1">
          <button
            onClick={() => setActiveSection('colors')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'colors'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted hover:text-gray-900'
            }`}
          >
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </button>
          <button
            onClick={() => setActiveSection('fonts')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'fonts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted hover:text-gray-900'
            }`}
          >
            <Type className="h-4 w-4 mr-2" />
            Fonts
          </button>
          <button
            onClick={() => setActiveSection('spacing')}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'spacing'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-muted hover:text-gray-900'
            }`}
          >
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Colors Section */}
        {activeSection === 'colors' && (
          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Presets</h4>
              <div className="grid grid-cols-1 gap-2">
                {colorPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex space-x-1 mr-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.primary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.secondary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.accent }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Custom Colors</h4>
              <div className="space-y-4">
                {/* Primary Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">Primary</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: theme.colors.primary }}
                    ></div>
                    <input
                      type="color"
                      value={theme.colors.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">Secondary</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: theme.colors.secondary }}
                    ></div>
                    <input
                      type="color"
                      value={theme.colors.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">Accent</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: theme.colors.accent }}
                    ></div>
                    <input
                      type="color"
                      value={theme.colors.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">Text</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: theme.colors.text }}
                    ></div>
                    <input
                      type="color"
                      value={theme.colors.text}
                      onChange={(e) => handleColorChange('text', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted">Background</label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: theme.colors.background }}
                    ></div>
                    <input
                      type="color"
                      value={theme.colors.background}
                      onChange={(e) => handleColorChange('background', e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fonts Section */}
        {activeSection === 'fonts' && (
          <div className="space-y-6">
            {/* Font Presets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Font Combinations</h4>
              <div className="space-y-2">
                {fontPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyFontPreset(preset)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-1">{preset.name}</div>
                    <div className="text-xs text-gray-500">
                      Heading: {preset.fonts.heading} • Body: {preset.fonts.body}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Fonts */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Custom Fonts</h4>
              <div className="space-y-4">
                {/* Heading Font */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Heading Font</label>
                  <select
                    value={theme.fonts.heading}
                    onChange={(e) => handleFontChange('heading', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-secondary"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Lato">Lato</option>
                  </select>
                  <div
                    className="mt-2 p-2 text-lg font-bold border border-gray-200 rounded"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    Heading Preview
                  </div>
                </div>

                {/* Body Font */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Body Font</label>
                  <select
                    value={theme.fonts.body}
                    onChange={(e) => handleFontChange('body', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-secondary"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Nunito">Nunito</option>
                    <option value="PT Sans">PT Sans</option>
                  </select>
                  <div
                    className="mt-2 p-2 text-sm border border-gray-200 rounded"
                    style={{ fontFamily: theme.fonts.body }}
                  >
                    This is how your body text will look. It should be easy to read and comfortable for longer paragraphs.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spacing Section */}
        {activeSection === 'spacing' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Layout Settings</h4>
              <div className="space-y-4">
                {/* Container Width */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Container Width</label>
                  <select
                    value={theme.spacing.container}
                    onChange={(e) => handleSpacingChange('container', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-secondary"
                  >
                    <option value="1140px">Narrow (1140px)</option>
                    <option value="1200px">Standard (1200px)</option>
                    <option value="1320px">Wide (1320px)</option>
                    <option value="100%">Full Width (100%)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Maximum width of content containers</p>
                </div>

                {/* Section Padding */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Section Padding</label>
                  <select
                    value={theme.spacing.section}
                    onChange={(e) => handleSpacingChange('section', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-secondary"
                  >
                    <option value="40px">Compact (40px)</option>
                    <option value="60px">Comfortable (60px)</option>
                    <option value="80px">Standard (80px)</option>
                    <option value="120px">Spacious (120px)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Vertical padding for sections</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Layout Preview</h4>
              <div className="border border-gray-200 rounded-lg p-4 bg-surface-2">
                <div 
                  className="bg-white rounded shadow-sm mx-auto p-4"
                  style={{ 
                    maxWidth: theme.spacing.container === '100%' ? '100%' : theme.spacing.container,
                    padding: `${parseInt(theme.spacing.section) / 2}px 16px`
                  }}
                >
                  <div className="text-center">
                    <h5 
                      className="font-bold mb-2"
                      style={{ fontFamily: theme.fonts.heading }}
                    >
                      Section Title
                    </h5>
                    <p 
                      className="text-sm text-muted"
                      style={{ fontFamily: theme.fonts.body }}
                    >
                      This shows how your sections will be spaced
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
