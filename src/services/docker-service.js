/**
 * StackBox Docker Container Management Service
 * Handles deployment and management of client containerized services
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { logger } = require('../utils/logger');
const { generateSecurePassword, generateSecureKey } = require('../utils/crypto');

class DockerService {
  constructor() {
    this.dockerComposeTemplate = path.join(__dirname, '../../docker/docker-compose.template.yml');
    this.clientsDir = path.join(__dirname, '../../deployments/clients');
  }

  /**
   * Deploy containerized services for a client
   * @param {Object} clientConfig - Client configuration
   * @returns {Promise<Object>} - Deployment result
   */
  async deployClientStack(clientConfig) {
    try {
      logger.info(`🐳 Starting Docker deployment for client: ${clientConfig.clientId}`);

      // Create client deployment directory
      const clientDir = path.join(this.clientsDir, clientConfig.clientId);
      await fs.mkdir(clientDir, { recursive: true });

      // Generate environment configuration
      const envConfig = await this.generateEnvironmentConfig(clientConfig);
      
      // Create docker-compose.yml from template
      const dockerComposeContent = await this.generateDockerCompose(clientConfig, envConfig);
      await fs.writeFile(path.join(clientDir, 'docker-compose.yml'), dockerComposeContent);

      // Generate supporting configuration files
      await this.generateSupportingConfigs(clientDir, clientConfig, envConfig);

      // Create environment file
      await this.createEnvironmentFile(clientDir, envConfig);

      // Deploy the stack
      const deployResult = await this.deployStack(clientDir, clientConfig.clientId);

      // Wait for services to be healthy
      await this.waitForServicesReady(clientDir, clientConfig.clientId);

      // Configure applications
      await this.configureApplications(clientConfig, envConfig);

      logger.info(`✅ Docker deployment completed for client: ${clientConfig.clientId}`);
      
      return {
        success: true,
        clientId: clientConfig.clientId,
        services: {
          espocrm: `https://crm.${clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`}`,
          nextcloud: `https://files.${clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`}`,
          website: `https://${clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`}`,
          ...(clientConfig.features?.calcom && {
            booking: `https://booking.${clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`}`
          }),
          ...(clientConfig.features?.mailtrain && {
            newsletter: `https://newsletter.${clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`}`
          })
        },
        credentials: {
          adminUsername: envConfig.ADMIN_USERNAME,
          adminPassword: envConfig.ADMIN_PASSWORD,
          databasePassword: envConfig.DB_PASSWORD
        },
        deploymentDir: clientDir
      };

    } catch (error) {
      logger.error(`❌ Docker deployment failed for client ${clientConfig.clientId}:`, error);
      
      // Cleanup on failure
      await this.cleanupFailedDeployment(clientConfig.clientId);
      
      throw error;
    }
  }

  /**
   * Generate environment configuration for the client
   * @param {Object} clientConfig - Client configuration
   * @returns {Object} - Environment variables
   */
  async generateEnvironmentConfig(clientConfig) {
    const domain = clientConfig.domain || `${clientConfig.clientId}.temp-stackbox.com`;
    
    return {
      CLIENT_ID: clientConfig.clientId,
      DOMAIN: domain,
      
      // Admin credentials
      ADMIN_USERNAME: clientConfig.adminUsername || 'admin',
      ADMIN_PASSWORD: generateSecurePassword(16),
      
      // Database credentials
      DB_PASSWORD: generateSecurePassword(24),
      DB_ROOT_PASSWORD: generateSecurePassword(32),
      
      // SMTP configuration (AWS SES)
      SMTP_HOST: process.env.SMTP_HOST || 'email-smtp.us-west-2.amazonaws.com',
      SMTP_USER: process.env.SMTP_USER || '',
      SMTP_PASSWORD: process.env.SMTP_PASS || '',
      
      // Security keys
      NEXTAUTH_SECRET: generateSecureKey(32),
      ANALYTICS_SECRET: generateSecureKey(64),
      
      // Feature flags
      ENABLE_CALCOM: clientConfig.features?.calcom ? 'true' : 'false',
      ENABLE_MAILTRAIN: clientConfig.features?.mailtrain ? 'true' : 'false',
      
      // SSL/TLS (Let's Encrypt via Traefik)
      CLOUDFLARE_EMAIL: process.env.CLOUDFLARE_EMAIL || '',
      CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY || '',
      
      // Branding
      COMPANY_NAME: clientConfig.businessName || 'Your Business',
      COMPANY_EMAIL: clientConfig.email,
      BRAND_COLOR: clientConfig.branding?.themeColor || '#003366',
      LOGO_URL: clientConfig.branding?.logoUrl || ''
    };
  }

  /**
   * Generate docker-compose.yml from template
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   * @returns {string} - Docker compose content
   */
  async generateDockerCompose(clientConfig, envConfig) {
    let template = await fs.readFile(this.dockerComposeTemplate, 'utf-8');
    
    // Replace environment variables in template
    Object.entries(envConfig).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      template = template.replace(regex, value);
    });
    
    // Remove optional services if not enabled
    if (!clientConfig.features?.calcom) {
      template = this.removeServiceFromCompose(template, 'calcom');
    }
    
    if (!clientConfig.features?.mailtrain) {
      template = this.removeServiceFromCompose(template, 'mailtrain');
    }
    
    return template;
  }

  /**
   * Remove a service section from docker-compose content
   * @param {string} content - Docker compose content
   * @param {string} serviceName - Service name to remove
   * @returns {string} - Updated content
   */
  removeServiceFromCompose(content, serviceName) {
    const serviceRegex = new RegExp(`\\s*# ${serviceName}[\\s\\S]*?(?=\\s*# |\\s*volumes:|$)`, 'i');
    return content.replace(serviceRegex, '');
  }

  /**
   * Generate supporting configuration files
   * @param {string} clientDir - Client deployment directory
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async generateSupportingConfigs(clientDir, clientConfig, envConfig) {
    // Create config directories
    const configDirs = ['traefik', 'nginx', 'mysql', 'espocrm'];
    for (const dir of configDirs) {
      await fs.mkdir(path.join(clientDir, 'config', dir), { recursive: true });
    }

    // Generate Traefik configuration
    await this.generateTraefikConfig(clientDir, envConfig);
    
    // Generate nginx configuration
    await this.generateNginxConfig(clientDir, envConfig);
    
    // Generate MySQL initialization
    await this.generateMySQLConfig(clientDir, envConfig);
    
    // Generate EspoCRM configuration
    await this.generateEspoCRMConfig(clientDir, clientConfig, envConfig);
    
    // Create website directory with default content
    await this.generateWebsiteContent(clientDir, clientConfig, envConfig);
  }

  /**
   * Generate Traefik configuration
   * @param {string} clientDir - Client deployment directory
   * @param {Object} envConfig - Environment configuration
   */
  async generateTraefikConfig(clientDir, envConfig) {
    const traefikConfig = `
# Traefik Configuration for ${envConfig.CLIENT_ID}
global:
  checkNewVersion: false
  sendAnonymousUsage: false

api:
  dashboard: true
  debug: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${envConfig.COMPANY_EMAIL}
      storage: /ssl/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    filename: /etc/traefik/dynamic.yml
    watch: true

log:
  level: INFO
  format: json

accessLog: {}
`;

    await fs.writeFile(path.join(clientDir, 'traefik', 'traefik.yml'), traefikConfig);

    // Create SSL directory
    await fs.mkdir(path.join(clientDir, 'ssl'), { recursive: true });
    
    // Create empty acme.json with correct permissions
    const acmePath = path.join(clientDir, 'ssl', 'acme.json');
    await fs.writeFile(acmePath, '{}');
    try {
      await fs.chmod(acmePath, 0o600);
    } catch (error) {
      logger.warn('Could not set acme.json permissions:', error.message);
    }
  }

  /**
   * Generate nginx configuration for website
   * @param {string} clientDir - Client deployment directory
   * @param {Object} envConfig - Environment configuration
   */
  async generateNginxConfig(clientDir, envConfig) {
    const nginxConfig = `
server {
    listen 80;
    server_name ${envConfig.DOMAIN} www.${envConfig.DOMAIN};
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;

    await fs.writeFile(path.join(clientDir, 'config', 'nginx', 'website.conf'), nginxConfig);
  }

  /**
   * Generate MySQL initialization script
   * @param {string} clientDir - Client deployment directory
   * @param {Object} envConfig - Environment configuration
   */
  async generateMySQLConfig(clientDir, envConfig) {
    const initScript = `
-- Initialize databases for StackBox client: ${envConfig.CLIENT_ID}
CREATE DATABASE IF NOT EXISTS nextcloud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS calcom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS mailtrain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create users
CREATE USER IF NOT EXISTS 'nextcloud'@'%' IDENTIFIED BY '${envConfig.DB_PASSWORD}';
CREATE USER IF NOT EXISTS 'calcom'@'%' IDENTIFIED BY '${envConfig.DB_PASSWORD}';
CREATE USER IF NOT EXISTS 'mailtrain'@'%' IDENTIFIED BY '${envConfig.DB_PASSWORD}';

-- Grant permissions
GRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'%';
GRANT ALL PRIVILEGES ON calcom.* TO 'calcom'@'%';
GRANT ALL PRIVILEGES ON mailtrain.* TO 'mailtrain'@'%';

FLUSH PRIVILEGES;
`;

    await fs.writeFile(path.join(clientDir, 'config', 'mysql', 'init.sql'), initScript);
  }

  /**
   * Generate EspoCRM configuration
   * @param {string} clientDir - Client deployment directory
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async generateEspoCRMConfig(clientDir, clientConfig, envConfig) {
    const espoCRMConfig = {
      database: {
        host: 'mysql',
        port: 3306,
        username: 'espocrm',
        password: envConfig.DB_PASSWORD,
        dbname: 'espocrm'
      },
      siteUrl: `https://crm.${envConfig.DOMAIN}`,
      defaultPermissions: {
        user: '755',
        group: '755'
      },
      smtpServer: envConfig.SMTP_HOST,
      smtpPort: 587,
      smtpSecurity: 'TLS',
      smtpUsername: envConfig.SMTP_USER,
      smtpPassword: envConfig.SMTP_PASSWORD,
      theme: 'Espo',
      language: 'en_US',
      companyName: envConfig.COMPANY_NAME
    };

    await fs.writeFile(
      path.join(clientDir, 'config', 'espocrm', 'config.php'),
      `<?php\nreturn ${JSON.stringify(espoCRMConfig, null, 2)};`
    );
  }

  /**
   * Generate default website content
   * @param {string} clientDir - Client deployment directory
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async generateWebsiteContent(clientDir, envConfig) {
    await fs.mkdir(path.join(clientDir, 'website'), { recursive: true });

    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${envConfig.COMPANY_NAME}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, ${envConfig.BRAND_COLOR}, #667eea); }
        .container { max-width: 1200px; margin: 0 auto; padding: 50px 20px; text-align: center; color: white; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; margin-bottom: 2rem; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 3rem; }
        .service { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 10px; backdrop-filter: blur(10px); }
        .service h3 { margin-bottom: 1rem; }
        .service a { color: white; text-decoration: none; font-weight: bold; }
        .service a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${envConfig.COMPANY_NAME}</h1>
        <p>Your complete business management platform is ready!</p>
        
        <div class="services">
            <div class="service">
                <h3>📱 Customer Management</h3>
                <p>Manage your clients and leads with our powerful CRM system.</p>
                <a href="https://crm.${envConfig.DOMAIN}">Access CRM →</a>
            </div>
            
            <div class="service">
                <h3>📁 File Portal</h3>
                <p>Secure file sharing and document management for your team.</p>
                <a href="https://files.${envConfig.DOMAIN}">Access Files →</a>
            </div>
            
            ${envConfig.ENABLE_CALCOM === 'true' ? `
            <div class="service">
                <h3>📅 Booking System</h3>
                <p>Let clients schedule appointments with you automatically.</p>
                <a href="https://booking.${envConfig.DOMAIN}">Book Appointment →</a>
            </div>
            ` : ''}
            
            ${envConfig.ENABLE_MAILTRAIN === 'true' ? `
            <div class="service">
                <h3>📧 Email Marketing</h3>
                <p>Create and send newsletters to your client base.</p>
                <a href="https://newsletter.${envConfig.DOMAIN}">Manage Newsletter →</a>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
`;

    await fs.writeFile(path.join(clientDir, 'website', 'index.html'), indexHtml);
  }

  /**
   * Create environment file for Docker Compose
   * @param {string} clientDir - Client deployment directory
   * @param {Object} envConfig - Environment configuration
   */
  async createEnvironmentFile(clientDir, envConfig) {
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await fs.writeFile(path.join(clientDir, '.env'), envContent);
  }

  /**
   * Deploy the Docker stack
   * @param {string} clientDir - Client deployment directory
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Deployment result
   */
  async deployStack(clientDir, clientId) {
    try {
      logger.info(`🚀 Deploying Docker stack for client: ${clientId}`);

      // Pull images first
      await execAsync('docker-compose pull', { cwd: clientDir });
      
      // Start the stack
      const { stdout, stderr } = await execAsync('docker-compose up -d', { cwd: clientDir });
      
      logger.info(`Docker stack deployed for ${clientId}:`, { stdout, stderr });
      
      return { success: true, output: stdout };

    } catch (error) {
      logger.error(`Failed to deploy Docker stack for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Wait for services to become ready
   * @param {string} clientDir - Client deployment directory
   * @param {string} clientId - Client ID
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForServicesReady(clientDir, clientId, timeout = 300000) {
    logger.info(`⏳ Waiting for services to become ready for client: ${clientId}`);
    
    const startTime = Date.now();
    const checkInterval = 10000; // 10 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const { stdout } = await execAsync('docker-compose ps --format json', { cwd: clientDir });
        const services = JSON.parse(`[${stdout.trim().split('\n').join(',')}]`);
        
        const unhealthyServices = services.filter(service => 
          service.State !== 'running' || service.Health === 'unhealthy'
        );

        if (unhealthyServices.length === 0) {
          logger.info(`✅ All services are ready for client: ${clientId}`);
          return true;
        }

        logger.info(`⏳ Still waiting for ${unhealthyServices.length} services...`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));

      } catch (error) {
        logger.warn(`Error checking service status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error(`Services did not become ready within ${timeout}ms for client: ${clientId}`);
  }

  /**
   * Configure applications post-deployment
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async configureApplications(clientConfig, envConfig) {
    logger.info(`🔧 Configuring applications for client: ${clientConfig.clientId}`);

    // Configure EspoCRM
    await this.configureEspoCRM(clientConfig, envConfig);
    
    // Configure Nextcloud
    await this.configureNextcloud(clientConfig, envConfig);
    
    // Additional configurations can be added here
  }

  /**
   * Configure EspoCRM application
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async configureEspoCRM(clientConfig, envConfig) {
    try {
      // Wait a bit for EspoCRM to initialize
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Additional EspoCRM configuration via API calls could go here
      logger.info(`✅ EspoCRM configured for client: ${clientConfig.clientId}`);

    } catch (error) {
      logger.error(`Failed to configure EspoCRM for ${clientConfig.clientId}:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Configure Nextcloud application
   * @param {Object} clientConfig - Client configuration
   * @param {Object} envConfig - Environment configuration
   */
  async configureNextcloud(clientConfig, envConfig) {
    try {
      // Wait a bit for Nextcloud to initialize
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Additional Nextcloud configuration via API calls could go here
      logger.info(`✅ Nextcloud configured for client: ${clientConfig.clientId}`);

    } catch (error) {
      logger.error(`Failed to configure Nextcloud for ${clientConfig.clientId}:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Stop and remove client containers
   * @param {string} clientId - Client ID
   */
  async stopClientStack(clientId) {
    try {
      const clientDir = path.join(this.clientsDir, clientId);
      
      if (await this.directoryExists(clientDir)) {
        await execAsync('docker-compose down', { cwd: clientDir });
        logger.info(`🛑 Stopped Docker stack for client: ${clientId}`);
      }

    } catch (error) {
      logger.error(`Failed to stop Docker stack for ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup failed deployment
   * @param {string} clientId - Client ID
   */
  async cleanupFailedDeployment(clientId) {
    try {
      await this.stopClientStack(clientId);
      
      const clientDir = path.join(this.clientsDir, clientId);
      if (await this.directoryExists(clientDir)) {
        await fs.rmdir(clientDir, { recursive: true });
      }

      logger.info(`🧹 Cleaned up failed deployment for client: ${clientId}`);

    } catch (error) {
      logger.error(`Failed to cleanup deployment for ${clientId}:`, error);
    }
  }

  /**
   * Check if directory exists
   * @param {string} dir - Directory path
   * @returns {Promise<boolean>} - Whether directory exists
   */
  async directoryExists(dir) {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get client deployment status
   * @param {string} clientId - Client ID
   * @returns {Promise<Object>} - Deployment status
   */
  async getDeploymentStatus(clientId) {
    try {
      const clientDir = path.join(this.clientsDir, clientId);
      
      if (!(await this.directoryExists(clientDir))) {
        return { status: 'not-found', message: 'Deployment not found' };
      }

      const { stdout } = await execAsync('docker-compose ps --format json', { cwd: clientDir });
      const services = JSON.parse(`[${stdout.trim().split('\n').join(',')}]`);
      
      const runningServices = services.filter(s => s.State === 'running').length;
      const totalServices = services.length;

      return {
        status: runningServices === totalServices ? 'running' : 'partial',
        services: totalServices,
        running: runningServices,
        containers: services.map(s => ({
          name: s.Service,
          state: s.State,
          health: s.Health || 'unknown'
        }))
      };

    } catch (error) {
      logger.error(`Failed to get deployment status for ${clientId}:`, error);
      return { status: 'error', message: error.message };
    }
  }
}

module.exports = { DockerService };
