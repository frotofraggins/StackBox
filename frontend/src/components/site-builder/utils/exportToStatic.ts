/**
 * StackPro Site Builder - Static Site Export Utility
 * Converts GrapesJS content to static HTML/CSS files
 */

import { SiteConfig, StaticSite } from '../core/SiteBuilder';

export interface ExportOptions {
  minifyCSS?: boolean;
  minifyHTML?: boolean;
  inlineCSS?: boolean;
  generateSitemap?: boolean;
  optimizeImages?: boolean;
}

export const exportToStatic = async (
  siteConfig: SiteConfig,
  editor: any,
  options: ExportOptions = {}
): Promise<StaticSite> => {
  try {
    // Get content from GrapesJS editor
    let html = '';
    let css = '';
    let assets: string[] = [];

    if (editor) {
      // Extract HTML and CSS from editor
      html = editor.getHtml();
      css = editor.getCss();
      
      // Extract asset URLs
      const components = editor.getComponents();
      assets = extractAssetUrls(components);
    } else {
      // Fallback to stored content
      html = siteConfig.content?.html || '';
      css = siteConfig.content?.css || '';
      assets = siteConfig.content?.assets || [];
    }

    // Generate complete HTML document
    const completeHTML = generateCompleteHTML(html, css, siteConfig, options);

    // Process CSS
    let processedCSS = css;
    if (options.minifyCSS) {
      processedCSS = minifyCSS(css);
    }

    // Generate additional files
    const staticSite: StaticSite = {
      html: completeHTML,
      css: processedCSS,
      assets,
      config: siteConfig
    };

    // Add JavaScript if needed
    const js = generateJavaScript(siteConfig);
    if (js) {
      staticSite.js = js;
    }

    return staticSite;
  } catch (error) {
    console.error('Export to static failed:', error);
    throw new Error(`Failed to export static site: ${error.message}`);
  }
};

/**
 * Generate complete HTML document with all necessary elements
 */
const generateCompleteHTML = (
  bodyHTML: string,
  css: string,
  siteConfig: SiteConfig,
  options: ExportOptions
): string => {
  const { settings, theme } = siteConfig;

  // Generate theme CSS variables
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
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
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
  `;

  // Combine all CSS
  const allCSS = options.inlineCSS 
    ? `${themeCSS}\n${css}`
    : css;

  // Generate meta tags
  const metaTags = generateMetaTags(settings);

  // Generate structured data
  const structuredData = generateStructuredData(settings);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${settings.seo.title}</title>
  <meta name="description" content="${settings.seo.description}">
  ${metaTags}
  ${settings.favicon ? `<link rel="icon" href="${settings.favicon}">` : ''}
  <style>${options.inlineCSS ? allCSS : themeCSS}</style>
  ${!options.inlineCSS ? `<link rel="stylesheet" href="styles.css">` : ''}
  ${structuredData}
</head>
<body>
  ${bodyHTML}
  <script src="script.js"></script>
</body>
</html>`;
};

/**
 * Generate SEO meta tags
 */
const generateMetaTags = (settings: any): string => {
  const keywords = settings.seo.keywords.join(', ');
  
  return `
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="${settings.siteName}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="${settings.seo.title}">
    <meta property="og:description" content="${settings.seo.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://${settings.domain}">
    ${settings.logo ? `<meta property="og:image" content="${settings.logo}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${settings.seo.title}">
    <meta name="twitter:description" content="${settings.seo.description}">
    ${settings.logo ? `<meta name="twitter:image" content="${settings.logo}">` : ''}
  `;
};

/**
 * Generate structured data (JSON-LD)
 */
const generateStructuredData = (settings: any): string => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": settings.siteName,
    "description": settings.siteDescription,
    "url": `https://${settings.domain}`,
    ...(settings.logo && { "logo": settings.logo })
  };

  return `<script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
</script>`;
};

/**
 * Generate JavaScript for interactive features
 */
const generateJavaScript = (siteConfig: SiteConfig): string => {
  return `
// StackPro Generated JavaScript
(function() {
  'use strict';

  // Form handling
  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Convert FormData to object
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Send to backend
    fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        clientId: '${siteConfig.clientId}'
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        form.innerHTML = '<div class="alert alert-success">Thank you! Your message has been sent.</div>';
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    })
    .catch(error => {
      console.error('Form submission error:', error);
      form.innerHTML = '<div class="alert alert-error">Sorry, there was an error sending your message. Please try again.</div>';
    });
  }

  // Smooth scrolling for anchor links
  function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Setup form handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
    });

    // Setup smooth scrolling
    setupSmoothScrolling();

    // Add loading states to buttons
    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        this.style.opacity = '0.7';
        this.textContent = 'Sending...';
      });
    });
  });
})();
  `;
};

/**
 * Extract asset URLs from GrapesJS components
 */
const extractAssetUrls = (components: any): string[] => {
  const assets: string[] = [];
  
  const traverseComponents = (component: any) => {
    if (component.attributes) {
      // Extract image sources
      if (component.attributes.src) {
        assets.push(component.attributes.src);
      }
      
      // Extract background images from styles
      if (component.attributes.style) {
        const bgImageMatch = component.attributes.style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (bgImageMatch) {
          assets.push(bgImageMatch[1]);
        }
      }
    }
    
    // Recursively check child components
    if (component.components && Array.isArray(component.components)) {
      component.components.forEach(traverseComponents);
    }
  };
  
  if (Array.isArray(components)) {
    components.forEach(traverseComponents);
  } else if (components) {
    traverseComponents(components);
  }
  
  // Remove duplicates and return
  return Array.from(new Set(assets));
};

/**
 * Minify CSS (basic implementation)
 */
const minifyCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .replace(/\s*{\s*/g, '{') // Remove spaces around braces
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*,\s*/g, ',') // Remove spaces around commas
    .replace(/\s*:\s*/g, ':') // Remove spaces around colons
    .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
    .trim();
};

/**
 * Minify HTML (basic implementation)
 */
const minifyHTML = (html: string): string => {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/>\s+</g, '><') // Remove spaces between tags
    .trim();
};

/**
 * Generate sitemap.xml content
 */
export const generateSitemap = (siteConfig: SiteConfig): string => {
  const { settings } = siteConfig;
  const baseUrl = `https://${settings.domain}`;
  const lastmod = new Date().toISOString().split('T')[0];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
};

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (siteConfig: SiteConfig): string => {
  const { settings } = siteConfig;
  const baseUrl = `https://${settings.domain}`;
  
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
};
