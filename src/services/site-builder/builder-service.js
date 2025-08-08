/**
 * StackPro Site Builder Service
 * Handles site creation, updates, and deployment orchestration
 */

const { logger } = require('../../utils/logger');

class BuilderService {
  constructor() {
    // In-memory storage for demo - replace with database
    this.sites = new Map();
    this.templates = new Map();
    
    this.initializeTemplates();
  }

  /**
   * Initialize default templates
   */
  initializeTemplates() {
    const defaultTemplates = [
      {
        id: 'law-firm-professional',
        name: 'Professional Law Firm',
        category: 'legal',
        description: 'Clean, professional template perfect for law firms and legal services',
        preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
        content: {
          html: `
            <section class="section bg-primary text-white">
              <div class="container text-center">
                <h1 class="display-4 mb-4">Professional Legal Services</h1>
                <p class="lead mb-4">Experienced attorneys providing comprehensive legal solutions</p>
                <a href="#contact" class="btn btn-secondary btn-lg">Schedule Consultation</a>
              </div>
            </section>
            
            <section class="section">
              <div class="container">
                <div class="row">
                  <div class="col-12 text-center mb-5">
                    <h2>Our Practice Areas</h2>
                    <p>We provide expert legal representation in multiple areas of law</p>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-4">
                    <h3>Corporate Law</h3>
                    <p>Comprehensive business legal services including contracts, mergers, and compliance.</p>
                  </div>
                  <div class="col-md-4 mb-4">
                    <h3>Family Law</h3>
                    <p>Divorce, child custody, adoption, and other family legal matters handled with care.</p>
                  </div>
                  <div class="col-md-4 mb-4">
                    <h3>Real Estate</h3>
                    <p>Property transactions, zoning issues, and real estate litigation services.</p>
                  </div>
                </div>
              </div>
            </section>

            <section class="section" id="contact">
              <div class="container">
                <div class="row justify-content-center">
                  <div class="col-md-8">
                    <h2 class="text-center mb-4">Contact Us</h2>
                    <form>
                      <div class="mb-3">
                        <label for="name" class="form-label">Name</label>
                        <input type="text" class="form-control" id="name" name="name" required>
                      </div>
                      <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email" required>
                      </div>
                      <div class="mb-3">
                        <label for="phone" class="form-label">Phone</label>
                        <input type="tel" class="form-control" id="phone" name="phone">
                      </div>
                      <div class="mb-3">
                        <label for="message" class="form-label">Message</label>
                        <textarea class="form-control" id="message" name="message" rows="5" required></textarea>
                      </div>
                      <button type="submit" class="btn btn-primary">Send Message</button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          `,
          css: `
            .section {
              padding: 80px 0;
            }
            
            .bg-primary {
              background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            }
            
            h3 {
              color: var(--primary-color);
              margin-bottom: 1rem;
            }
          `
        },
        features: ['Contact Forms', 'Service Pages', 'Attorney Profiles', 'Testimonials'],
        popular: true
      },
      {
        id: 'real-estate-modern',
        name: 'Modern Real Estate',
        category: 'real-estate',
        description: 'Showcase properties with style and attract more clients',
        preview: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
        content: {
          html: `
            <section class="section bg-primary text-white">
              <div class="container text-center">
                <h1 class="display-4 mb-4">Find Your Dream Home</h1>
                <p class="lead mb-4">Professional real estate services in your local market</p>
                <a href="#properties" class="btn btn-secondary btn-lg">View Properties</a>
              </div>
            </section>
            
            <section class="section" id="properties">
              <div class="container">
                <div class="row">
                  <div class="col-12 text-center mb-5">
                    <h2>Featured Properties</h2>
                    <p>Discover our handpicked selection of premium properties</p>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-4 mb-4">
                    <div class="property-card">
                      <h3>Modern Family Home</h3>
                      <p><strong>$450,000</strong></p>
                      <p>Beautiful 4-bedroom home in desirable neighborhood with updated kitchen and spacious yard.</p>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="property-card">
                      <h3>Downtown Condo</h3>
                      <p><strong>$320,000</strong></p>
                      <p>Stylish 2-bedroom condo with city views, modern amenities, and prime location.</p>
                    </div>
                  </div>
                  <div class="col-md-4 mb-4">
                    <div class="property-card">
                      <h3>Luxury Estate</h3>
                      <p><strong>$850,000</strong></p>
                      <p>Stunning 5-bedroom estate with pool, gourmet kitchen, and premium finishes throughout.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          `,
          css: `
            .property-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 24px;
              height: 100%;
              transition: transform 0.2s ease;
            }
            
            .property-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            
            .property-card h3 {
              color: var(--primary-color);
              margin-bottom: 8px;
            }
            
            .property-card p strong {
              color: var(--accent-color);
              font-size: 1.25rem;
            }
          `
        },
        features: ['Property Listings', 'Virtual Tours', 'Agent Profiles', 'Market Data'],
        popular: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    logger.info(`✅ Initialized ${defaultTemplates.length} site templates`);
  }

  /**
   * Create a new site for a client
   * @param {string} clientId - Client identifier
   * @param {Object} siteData - Site configuration data
   * @returns {Promise<Object>} Created site
   */
  async createSite(clientId, siteData) {
    try {
      const siteId = `site-${clientId}-${Date.now()}`;
      
      // Apply template if specified
      let content = null;
      if (siteData.templateId && this.templates.has(siteData.templateId)) {
        const template = this.templates.get(siteData.templateId);
        content = template.content;
        logger.info(`Applied template: ${template.name} to site ${siteId}`);
      }

      const site = {
        id: siteId,
        clientId,
        template: siteData.templateId || 'blank',
        theme: siteData.theme || {
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
        content: content,
        settings: siteData.settings || {
          siteName: 'My Business',
          siteDescription: 'Professional business website',
          domain: `${clientId}.stackpro.io`,
          seo: {
            title: 'My Business - Professional Services',
            description: 'Professional business services and solutions',
            keywords: ['business', 'professional', 'services']
          }
        },
        status: 'draft',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      this.sites.set(siteId, site);
      
      logger.info(`✅ Created site: ${siteId} for client: ${clientId}`);
      
      return {
        success: true,
        site
      };
    } catch (error) {
      logger.error('Failed to create site:', error);
      throw error;
    }
  }

  /**
   * Get site by client ID
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object|null>} Site data or null
   */
  async getSiteByClient(clientId) {
    try {
      // Find site for this client
      for (const [siteId, site] of this.sites.entries()) {
        if (site.clientId === clientId) {
          logger.info(`Found site: ${siteId} for client: ${clientId}`);
          return site;
        }
      }

      logger.info(`No site found for client: ${clientId}`);
      return null;
    } catch (error) {
      logger.error('Failed to get site by client:', error);
      throw error;
    }
  }

  /**
   * Update site configuration
   * @param {string} siteId - Site identifier
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated site
   */
  async updateSite(siteId, updates) {
    try {
      const existingSite = this.sites.get(siteId);
      
      if (!existingSite) {
        throw new Error(`Site not found: ${siteId}`);
      }

      const updatedSite = {
        ...existingSite,
        ...updates,
        lastModified: new Date().toISOString()
      };

      this.sites.set(siteId, updatedSite);
      
      logger.info(`✅ Updated site: ${siteId}`);
      
      return {
        success: true,
        site: updatedSite
      };
    } catch (error) {
      logger.error('Failed to update site:', error);
      throw error;
    }
  }

  /**
   * Publish site to production
   * @param {string} siteId - Site identifier
   * @param {Object} staticSite - Generated static site files
   * @returns {Promise<Object>} Publication result
   */
  async publishSite(siteId, staticSite) {
    try {
      const site = this.sites.get(siteId);
      
      if (!site) {
        throw new Error(`Site not found: ${siteId}`);
      }

      // Update site status
      const updatedSite = {
        ...site,
        status: 'published',
        publishedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      this.sites.set(siteId, updatedSite);

      // In production, this would:
      // 1. Upload static files to S3/CloudFront
      // 2. Update DNS records
      // 3. Deploy to container infrastructure
      // 4. Set up SSL certificates
      // 5. Configure CDN

      const publicUrl = site.settings.domain || `${site.clientId}.stackpro.io`;
      
      logger.info(`✅ Published site: ${siteId} to: https://${publicUrl}`);
      
      return {
        success: true,
        url: `https://${publicUrl}`,
        site: updatedSite,
        deployedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to publish site:', error);
      throw error;
    }
  }

  /**
   * Get available templates
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} List of templates
   */
  async getTemplates(category = null) {
    try {
      let templates = Array.from(this.templates.values());
      
      if (category && category !== 'all') {
        templates = templates.filter(template => template.category === category);
      }

      // Sort by popularity, then by name
      templates.sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.name.localeCompare(b.name);
      });

      logger.info(`Retrieved ${templates.length} templates${category ? ` for category: ${category}` : ''}`);
      
      return templates;
    } catch (error) {
      logger.error('Failed to get templates:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template identifier
   * @returns {Promise<Object|null>} Template or null
   */
  async getTemplate(templateId) {
    try {
      const template = this.templates.get(templateId);
      
      if (template) {
        logger.info(`Retrieved template: ${templateId}`);
      } else {
        logger.info(`Template not found: ${templateId}`);
      }

      return template || null;
    } catch (error) {
      logger.error('Failed to get template:', error);
      throw error;
    }
  }

  /**
   * Delete site
   * @param {string} siteId - Site identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteSite(siteId) {
    try {
      const site = this.sites.get(siteId);
      
      if (!site) {
        throw new Error(`Site not found: ${siteId}`);
      }

      // In production, this would also:
      // 1. Remove files from S3/CloudFront
      // 2. Clean up DNS records
      // 3. Remove container deployments
      // 4. Clean up SSL certificates

      this.sites.delete(siteId);
      
      logger.info(`✅ Deleted site: ${siteId}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to delete site:', error);
      throw error;
    }
  }

  /**
   * Get site statistics for a client
   * @param {string} clientId - Client identifier
   * @returns {Promise<Object>} Site statistics
   */
  async getSiteStats(clientId) {
    try {
      const site = await this.getSiteByClient(clientId);
      
      if (!site) {
        return {
          hasWebsite: false,
          status: null,
          lastModified: null
        };
      }

      // In production, this would include:
      // - Page views and traffic analytics
      // - Performance metrics
      // - SEO scores
      // - Uptime statistics

      return {
        hasWebsite: true,
        status: site.status,
        lastModified: site.lastModified,
        publishedAt: site.publishedAt,
        url: site.settings.domain ? `https://${site.settings.domain}` : `https://${clientId}.stackpro.io`,
        pageCount: 1, // Simple sites start with 1 page
        templateUsed: site.template
      };
    } catch (error) {
      logger.error('Failed to get site stats:', error);
      throw error;
    }
  }
}

module.exports = { BuilderService };
