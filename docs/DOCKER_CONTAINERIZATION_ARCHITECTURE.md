# StackBox Docker Containerization Architecture

## Overview

StackBox uses Docker containers to deploy and manage client business applications. Each client gets an isolated containerized environment with their complete tech stack deployed on AWS infrastructure.

## Container Architecture

### Core Services

| Service | Container Image | Purpose | Always Deployed |
|---------|----------------|---------|-----------------|
| **Traefik** | `traefik:v3.0` | Reverse proxy, SSL termination, load balancing | ✅ |
| **EspoCRM** | `espocrm/espocrm:latest` | Customer Relationship Management | ✅ |
| **Nextcloud** | `nextcloud:stable` | File portal & document management | ✅ |
| **Website** | `nginx:alpine` | Business website hosting | ✅ |
| **MySQL** | `mysql:8.0` | Primary database | ✅ |
| **Redis** | `redis:alpine` | Caching and sessions | ✅ |

### Optional Services (Plan-Dependent)

| Service | Container Image | Purpose | Required Plan |
|---------|----------------|---------|---------------|
| **Cal.com** | `calcom/cal.com:latest` | Appointment booking system | Professional+ |
| **Mailtrain** | `mailtrain/mailtrain:latest` | Email marketing platform | Enterprise |
| **Plausible** | `plausible/analytics:latest` | Website analytics | Professional+ |
| **PostgreSQL** | `postgres:13` | Analytics database | Professional+ |

## Deployment Pipeline

### Phase 1: Infrastructure Setup
```javascript
// AWS infrastructure provisioned first
1. SSL Certificate (ACM)
2. RDS Database (Managed)
3. Secrets Manager
4. Application Load Balancer  
5. CloudFront CDN
6. Route53 DNS
7. Target Registration
```

### Phase 2: Container Deployment
```javascript
// Docker services deployed second
8. Container Stack Deployment
   - Generate docker-compose.yml from template
   - Configure environment variables
   - Create supporting configs (Traefik, nginx, etc.)
   - Deploy containers via Docker Compose
   - Wait for service health checks
   - Configure applications
```

## Container Configuration

### Environment Generation
```javascript
const envConfig = {
  CLIENT_ID: "smithrealestate-e11f059b",
  DOMAIN: "smithrealestate.stackbox.io",
  
  // Security
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "generateSecurePassword(16)",
  DB_PASSWORD: "generateSecurePassword(24)",
  
  // Features
  ENABLE_CALCOM: "true",
  ENABLE_MAILTRAIN: "false",
  
  // Branding
  COMPANY_NAME: "Smith Real Estate",
  BRAND_COLOR: "#003366"
}
```

### Service Discovery
- **Docker Networks**: Isolated `stackbox_network` per client
- **Service Names**: Containers communicate via service names
- **Health Checks**: Built-in container health monitoring
- **DNS**: Traefik handles subdomain routing

## SSL & Security

### Automatic HTTPS
- **Traefik**: Handles SSL termination
- **Let's Encrypt**: Automatic certificate provisioning
- **HTTP → HTTPS**: Automatic redirects
- **Wildcard Certificates**: `*.domain.com` support

### Security Features
- **Container Isolation**: Each client in separate namespace
- **Network Segmentation**: Isolated Docker networks
- **Secrets Management**: Environment variables only
- **Database Access**: Internal network only
- **File Permissions**: Proper volume permissions

## Service URLs

Each client gets subdomains for their services:

```
Main Website:     https://smithrealestate.stackbox.io
CRM System:       https://crm.smithrealestate.stackbox.io  
File Portal:      https://files.smithrealestate.stackbox.io
Booking System:   https://booking.smithrealestate.stackbox.io
Newsletter:       https://newsletter.smithrealestate.stackbox.io
Analytics:        https://analytics.smithrealestate.stackbox.io
```

## File Structure

### Container Deployment Directory
```
deployments/clients/smithrealestate-e11f059b/
├── docker-compose.yml              # Generated from template
├── .env                            # Environment variables
├── config/
│   ├── traefik/
│   │   └── traefik.yml            # Reverse proxy config
│   ├── nginx/
│   │   └── website.conf           # Website server config
│   ├── mysql/
│   │   └── init.sql               # Database initialization
│   └── espocrm/
│       └── config.php             # CRM configuration
├── ssl/
│   └── acme.json                  # SSL certificates
└── website/
    └── index.html                 # Business website
```

## Docker Service Management

### Key Methods

```javascript
// Deploy complete stack
const result = await dockerService.deployClientStack(clientConfig);

// Check deployment status  
const status = await dockerService.getDeploymentStatus(clientId);

// Stop client containers
await dockerService.stopClientStack(clientId);

// Cleanup failed deployment
await dockerService.cleanupFailedDeployment(clientId);
```

### Service Configuration

```javascript
const containerResult = {
  success: true,
  clientId: "smithrealestate-e11f059b",
  services: {
    espocrm: "https://crm.smithrealestate.stackbox.io",
    nextcloud: "https://files.smithrealestate.stackbox.io", 
    website: "https://smithrealestate.stackbox.io",
    booking: "https://booking.smithrealestate.stackbox.io"
  },
  credentials: {
    adminUsername: "admin",
    adminPassword: "secure_generated_password"
  }
}
```

## Integration with AWS

### Database Connection
- **RDS Integration**: Containers connect to managed RDS instance
- **Connection Pooling**: Optimized database connections  
- **Credentials**: Pulled from AWS Secrets Manager
- **Backup Strategy**: RDS automated backups + container data volumes

### Load Balancer Integration
- **ALB Targets**: Containers register as ALB targets
- **Health Checks**: ALB monitors container health
- **Auto Scaling**: Containers can scale based on demand
- **SSL Offloading**: ALB handles SSL termination

### Storage Integration
- **S3 Integration**: File uploads stored in S3
- **EFS Integration**: Shared file storage across containers
- **Volume Mounts**: Persistent data storage
- **Backup Integration**: Automated S3 backups

## Deployment Features

### Enterprise-Grade Features
- **Zero-Downtime Deployments**: Rolling updates
- **Health Monitoring**: Container and application health checks
- **Automatic Recovery**: Container restart policies
- **Resource Limits**: CPU/memory constraints per container
- **Logging**: Centralized log collection
- **Metrics**: Performance monitoring

### Development Features
- **Local Development**: docker-compose for local testing
- **Environment Parity**: Identical dev/staging/prod environments
- **Fast Deployments**: Container image caching
- **Easy Rollbacks**: Version-tagged container images

## Monitoring & Maintenance

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Resource Monitoring
- **Container Stats**: CPU, memory, network usage
- **Application Metrics**: Response times, error rates
- **Database Performance**: Query performance, connections
- **Storage Usage**: Disk space, file counts

### Maintenance Tasks
- **Container Updates**: Automated security patches
- **Database Maintenance**: Automated optimization
- **Log Rotation**: Automated log cleanup
- **Backup Verification**: Regular backup testing

## Client Experience

### Onboarding Flow
1. **Account Creation** → User signs up with business details
2. **Payment Processing** → Stripe handles subscription
3. **Infrastructure Provisioning** → AWS resources deployed
4. **Container Deployment** → Business applications deployed  
5. **Welcome Email** → Credentials and access links sent
6. **Ready to Use** → Complete business platform available

### Access Experience
- **Single Sign-On**: Unified authentication across services
- **Professional Branding**: Custom logos, colors, domains
- **Mobile Responsive**: Works on all devices
- **Fast Performance**: Global CDN + optimized containers
- **Secure by Default**: HTTPS everywhere, isolated environments

This containerization architecture provides a scalable, secure, and feature-rich platform for deploying complete business infrastructures with minimal client technical requirements.
