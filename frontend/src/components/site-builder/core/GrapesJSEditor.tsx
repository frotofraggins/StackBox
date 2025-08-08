/**
 * StackPro GrapesJS Editor Wrapper
 * React wrapper for GrapesJS drag-and-drop editor
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SiteConfig, ThemeConfig } from './SiteBuilder';

// GrapesJS will be loaded dynamically
declare global {
  interface Window {
    grapesjs: any;
  }
}

export interface GrapesJSEditorProps {
  config: SiteConfig;
  theme: ThemeConfig;
  onChange: (content: any) => void;
}

export interface GrapesJSEditorRef {
  getEditor: () => any;
  getContent: () => any;
  loadContent: (content: any) => void;
  applyTheme: (theme: ThemeConfig) => void;
  insertAsset: (asset: any) => void;
}

export const GrapesJSEditor = forwardRef<GrapesJSEditorRef, GrapesJSEditorProps>(
  ({ config, theme, onChange }, ref) => {
    const editorRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInitialized = useRef(false);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
      getContent: () => {
        if (editorRef.current) {
          return {
            html: editorRef.current.getHtml(),
            css: editorRef.current.getCss(),
            components: editorRef.current.getComponents(),
            styles: editorRef.current.getStyle()
          };
        }
        return null;
      },
      loadContent: (content: any) => {
        if (editorRef.current && content) {
          editorRef.current.setComponents(content.components || content.html || '');
          if (content.css || content.styles) {
            editorRef.current.setStyle(content.css || content.styles);
          }
        }
      },
      applyTheme: (newTheme: ThemeConfig) => {
        applyThemeToEditor(newTheme);
      },
      insertAsset: (asset: any) => {
        if (editorRef.current) {
          const selected = editorRef.current.getSelected();
          if (selected) {
            if (asset.type === 'image') {
              selected.addAttributes({ src: asset.url });
            }
          }
        }
      }
    }));

    // Apply theme to editor
    const applyThemeToEditor = (themeConfig: ThemeConfig) => {
      if (editorRef.current) {
        const cssRules = editorRef.current.CssComposer;
        
        // Apply CSS variables for theme
        const themeCSS = `
          :root {
            --primary-color: ${themeConfig.colors.primary};
            --secondary-color: ${themeConfig.colors.secondary};
            --accent-color: ${themeConfig.colors.accent};
            --text-color: ${themeConfig.colors.text};
            --background-color: ${themeConfig.colors.background};
            --heading-font: ${themeConfig.fonts.heading}, sans-serif;
            --body-font: ${themeConfig.fonts.body}, sans-serif;
            --container-width: ${themeConfig.spacing.container};
            --section-padding: ${themeConfig.spacing.section};
          }
          
          body {
            font-family: var(--body-font);
            color: var(--text-color);
            background-color: var(--background-color);
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--heading-font);
            color: var(--text-color);
          }
          
          .container {
            max-width: var(--container-width);
            margin: 0 auto;
            padding: 0 20px;
          }
          
          .section {
            padding: var(--section-padding) 0;
          }
          
          .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
          }
          
          .btn-secondary {
            background-color: var(--secondary-color);
            border-color: var(--secondary-color);
          }
          
          .text-primary {
            color: var(--primary-color);
          }
          
          .bg-primary {
            background-color: var(--primary-color);
          }
        `;
        
        // Add theme CSS to the editor
        cssRules.clear();
        cssRules.add(themeCSS);
      }
    };

    // Initialize GrapesJS editor
    useEffect(() => {
      if (!containerRef.current || isInitialized.current) return;

      // Load GrapesJS dynamically
      const loadGrapesJS = async () => {
        try {
          // Check if GrapesJS is already loaded
          if (!window.grapesjs) {
            // Load GrapesJS CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/grapesjs@0.20.4/dist/css/grapes.min.css';
            document.head.appendChild(cssLink);

            // Load GrapesJS JavaScript
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/grapesjs@0.20.4/dist/grapes.min.js';
            document.head.appendChild(script);

            // Wait for GrapesJS to load
            await new Promise((resolve) => {
              script.onload = resolve;
            });
          }

          initializeEditor();
        } catch (error) {
          console.error('Failed to load GrapesJS:', error);
        }
      };

      const initializeEditor = () => {
        if (!window.grapesjs || !containerRef.current) return;

        const grapesjs = window.grapesjs;
        
        // Initialize the editor
        editorRef.current = grapesjs.init({
          container: containerRef.current,
          height: '100%',
          width: 'auto',
          storageManager: false, // We handle storage ourselves
          undoManager: { enable: true },
          
          // Canvas configuration
          canvas: {
            styles: [
              'https://unpkg.com/tailwindcss@2.2.19/dist/tailwind.min.css'
            ]
          },

          // Panels configuration
          panels: {
            defaults: [
              {
                id: 'layers',
                el: '.panel__right',
                resizable: {
                  maxDim: 350,
                  minDim: 200,
                  tc: 0,
                  cl: 1,
                  cr: 0,
                  bc: 0
                }
              },
              {
                id: 'panel-switcher',
                el: '.panel__switcher',
                buttons: [
                  {
                    id: 'show-layers',
                    active: true,
                    label: 'Layers',
                    command: 'show-layers',
                    togglable: false
                  },
                  {
                    id: 'show-style',
                    active: true,
                    label: 'Styles',
                    command: 'show-styles',
                    togglable: false
                  }
                ]
              }
            ]
          },

          // Block manager configuration
          blockManager: {
            appendTo: '#blocks',
            blocks: [
              {
                id: 'section',
                label: '<i class="fa fa-square-o"></i><div>Section</div>',
                attributes: { class: 'gjs-block-section' },
                content: `
                  <section class="section">
                    <div class="container">
                      <div class="row">
                        <div class="col-12">
                          <h2>Section Title</h2>
                          <p>Section content goes here...</p>
                        </div>
                      </div>
                    </div>
                  </section>
                `
              },
              {
                id: 'text',
                label: '<i class="fa fa-text-width"></i><div>Text</div>',
                content: '<div data-gjs-type="text">Insert your text here</div>'
              },
              {
                id: 'image',
                label: '<i class="fa fa-picture-o"></i><div>Image</div>',
                select: true,
                content: { type: 'image' },
                activate: true
              },
              {
                id: 'button',
                label: '<i class="fa fa-hand-pointer-o"></i><div>Button</div>',
                content: `
                  <a href="#" class="btn btn-primary">
                    Click me
                  </a>
                `
              },
              {
                id: 'hero',
                label: '<i class="fa fa-star"></i><div>Hero Section</div>',
                content: `
                  <section class="section bg-primary text-white">
                    <div class="container text-center">
                      <h1 class="display-4 mb-4">Welcome to Our Business</h1>
                      <p class="lead mb-4">We provide exceptional services to help your business grow</p>
                      <a href="#" class="btn btn-secondary btn-lg">Get Started</a>
                    </div>
                  </section>
                `
              },
              {
                id: 'contact-form',
                label: '<i class="fa fa-envelope"></i><div>Contact Form</div>',
                content: `
                  <section class="section">
                    <div class="container">
                      <div class="row justify-content-center">
                        <div class="col-md-8">
                          <h2 class="text-center mb-4">Contact Us</h2>
                          <form>
                            <div class="mb-3">
                              <label for="name" class="form-label">Name</label>
                              <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="mb-3">
                              <label for="email" class="form-label">Email</label>
                              <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                              <label for="message" class="form-label">Message</label>
                              <textarea class="form-control" id="message" rows="5" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Send Message</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </section>
                `
              }
            ]
          },

          // Style manager configuration
          styleManager: {
            appendTo: '.styles-container',
            sectors: [
              {
                name: 'Dimension',
                open: false,
                buildProps: ['width', 'min-height', 'padding'],
                properties: [
                  {
                    type: 'integer',
                    name: 'The width',
                    property: 'width',
                    units: ['px', '%'],
                    defaults: 'auto',
                    min: 0
                  }
                ]
              },
              {
                name: 'Typography',
                open: false,
                buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height'],
                properties: [
                  {
                    name: 'Font',
                    property: 'font-family'
                  },
                  {
                    name: 'Weight',
                    property: 'font-weight'
                  },
                  {
                    name: 'Font color',
                    property: 'color'
                  }
                ]
              },
              {
                name: 'Decorations',
                open: false,
                buildProps: ['opacity', 'background-color', 'border-radius', 'border', 'box-shadow', 'background'],
                properties: [
                  {
                    type: 'slider',
                    property: 'opacity',
                    defaults: 1,
                    step: 0.01,
                    max: 1,
                    min: 0
                  },
                  {
                    name: 'Background',
                    property: 'background-color'
                  }
                ]
              },
              {
                name: 'Extra',
                open: false,
                buildProps: ['transition', 'perspective', 'transform'],
                properties: [
                  {
                    name: 'Transition',
                    property: 'transition',
                    type: 'composite',
                    properties: [
                      {
                        name: 'Property',
                        property: 'transition-property'
                      },
                      {
                        name: 'Duration',
                        property: 'transition-duration'
                      },
                      {
                        name: 'Timing Function',
                        property: 'transition-timing-function'
                      }
                    ]
                  }
                ]
              }
            ]
          },

          // Layer manager
          layerManager: {
            appendTo: '.layers-container'
          },

          // Device manager
          deviceManager: {
            devices: [
              {
                name: 'Desktop',
                width: ''
              },
              {
                name: 'Mobile',
                width: '320px',
                widthMedia: '480px'
              }
            ]
          }
        });

        // Handle content changes
        editorRef.current.on('component:update', () => {
          const content = {
            html: editorRef.current.getHtml(),
            css: editorRef.current.getCss(),
            components: editorRef.current.getComponents(),
            styles: editorRef.current.getStyle()
          };
          onChange(content);
        });

        // Load initial content if available
        if (config.content) {
          editorRef.current.setComponents(config.content.components || config.content.html || '');
          if (config.content.css || config.content.styles) {
            editorRef.current.setStyle(config.content.css || config.content.styles);
          }
        }

        // Apply initial theme
        applyThemeToEditor(theme);

        isInitialized.current = true;
      };

      loadGrapesJS();

      // Cleanup on unmount
      return () => {
        if (editorRef.current) {
          editorRef.current.destroy();
          editorRef.current = null;
        }
        isInitialized.current = false;
      };
    }, []);

    // Apply theme changes
    useEffect(() => {
      if (editorRef.current && isInitialized.current) {
        applyThemeToEditor(theme);
      }
    }, [theme]);

    return (
      <div className="gjs-editor-wrapper h-full">
        <div className="gjs-editor-container h-full flex">
          {/* Blocks Panel */}
          <div className="gjs-blocks-panel w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Components</h3>
              <div id="blocks" className="space-y-2"></div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            <div ref={containerRef} className="flex-1"></div>
          </div>

          {/* Right Panel */}
          <div className="panel__right w-64 bg-white border-l border-gray-200">
            <div className="panel__switcher flex border-b border-gray-200">
              {/* Panel switcher will be populated by GrapesJS */}
            </div>
            <div className="layers-container p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Layers</h3>
            </div>
            <div className="styles-container p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Styles</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GrapesJSEditor.displayName = 'GrapesJSEditor';
