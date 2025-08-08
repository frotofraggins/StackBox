# StackBox Deployment Pipeline

🚀 **Automated deployment pipeline for business stacks on AWS**

Deploy complete business infrastructure (CRM, file portal, website, email) for small businesses with a single JSON configuration file.

## 🎯 Overview

StackBox automatically provisions and deploys:
- **Professional Website** (Static or CMS)
- **Customer Relationship Management** (EspoCRM)
- **File Sharing Portal** (Nextcloud)  
- **Booking System** (Cal.com - optional)
- **Email Marketing** (Mailtrain - optional)
- **Custom Domain & SSL** (allbusinesstools.com subdomains)
- **Business Email Setup** (AWS SES)

**Target Market**: Non-tech-savvy small business owners (real estate agents, law firms, coaches, therapists)

## 🏗️ Architecture

```
Stripe Payment → Webhook → Deployment Pipeline → AWS Resources → Client Stack
```

**AWS Services Used:**
- **EC2** - Host containerized services
- **S3** - File storage and static website hosting
- **Route53** - DNS management and subdomains
- **SES** - Email sending and onboarding
- **IAM** - Security and access management

**Domain Strategy:** `clientname.allbusinesstools.com`

## 📁 Project Structure

```
StackBox/
├── src/
│   ├── config/
│   │   └── validation.js          # JSON schema validation
│   ├── services/
│   │   └── aws-provisioner.js     # EC2, S3, Route53, SES provisioning
│   ├── utils/
│   │   └── logger.js              # Winston logging
│   └── deploy.js                  # Main orchestration engine
├── config/
│   └── aws-config.json            # AWS and domain configuration
├── examples/
│   └── client-john-realty.json    # Sample client configuration
├── templates/                     # Docker and service templates
├── package.json                   # Node.js dependencies
└── docker-compose.yml            # Development environment
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured with `Stackbox` profile
- Docker installed

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd StackBox
npm install
```

2. **Configure AWS credentials:**
```bash
aws configure --profile Stackbox
```

3. **Test with example client:**
```bash
node src/deploy.js examples/client-john-realty.json
```

## 📋 Client Configuration

Create a JSON file with client specifications:

```json
{
  "clientId": "johnrealty",
  "email": "john@johnrealty.com", 
  "subdomain": "johnrealty",
  "features": {
    "espocrm": true,
    "nextcloud": true,
    "calcom": true,
    "mailtrain": false,
    "staticSite": true
  },
  "resources": {
    "instanceType": "t3.small",
    "storageGB": 20
  },
  "branding": {
    "logoUrl": "https://example.com/logo.png",
    "themeColor": "#1e40af",
    "companyName": "John's Real Estate"
  }
}
```

## 🔧 Configuration Options

### Required Fields
- `clientId` - Unique identifier (3-30 characters, alphanumeric)
- `email` - Client email for notifications and admin access
- `subdomain` - Subdomain for allbusinesstools.com

### Features
- `espocrm` - Customer relationship management
- `nextcloud` - File sharing and collaboration
- `calcom` - Online booking system
- `mailtrain` - Email marketing
- `staticSite` - Static website
- `cmsSite` - Content management system

### Resources
- `instanceType` - EC2 instance size (t3.small, t3.medium, t3.large)
- `storageGB` - Storage allocation (10-100 GB)

## 🌐 Domain Management

**Registered Domain:** `allbusinesstools.com` ($15/year)

**Client URLs:**
- Main site: `https://clientname.allbusinesstools.com`
- CRM: `https://clientname.allbusinesstools.com/crm`
- Files: `https://clientname.allbusinesstools.com/files`

## 📧 Email Setup

**Automated SES Configuration:**
- Sender: `noreply@allbusinesstools.com`
- Support: `support@allbusinesstools.com`
- Domain verification and DKIM setup
- Onboarding email with credentials

## 🛡️ Security Features

- **Container Isolation** - Each client in separate Docker network
- **S3 Bucket Policies** - Client-specific access controls
- **SSL Certificates** - Automatic Let's Encrypt integration
- **IAM Roles** - Least privilege AWS access
- **Encrypted Secrets** - Secure credential management

## 📊 Monitoring & Logging

- **Winston Logging** - Structured deployment logs
- **CloudWatch Integration** - AWS resource monitoring
- **Health Checks** - Service availability monitoring
- **Error Tracking** - Automated rollback on failure

## 🔄 Deployment Flow

1. **Configuration Validation** - JSON schema verification
2. **AWS Provisioning** - EC2, S3, Route53, SES setup
3. **Docker Deployment** - Container orchestration
4. **SSL Configuration** - Certificate generation and setup
5. **DNS Activation** - Subdomain creation
6. **Email Notification** - Send credentials to client

## 📈 Usage Examples

**Deploy a real estate agent:**
```bash
node src/deploy.js examples/client-john-realty.json
```

**Check deployment status:**
```javascript
const { StackBoxDeployer } = require('./src/deploy');
const deployer = new StackBoxDeployer();
await deployer.getDeploymentStatus('johnrealty');
```

## 🎛️ Advanced Configuration

**AWS Config (`config/aws-config.json`):**
```json
{
  "domain": {
    "primary": "allbusinesstools.com",
    "subdomainPattern": "{clientId}.allbusinesstools.com"
  },
  "aws": {
    "region": "us-west-2", 
    "profile": "Stackbox"
  },
  "resources": {
    "defaultInstanceType": "t3.small",
    "amiId": "ami-0c02fb55956c7d316"
  }
}
```

## 🚨 Error Handling

- **Validation Errors** - Clear configuration issue messages
- **AWS Errors** - Resource creation failure handling
- **Rollback Logic** - Automatic cleanup on deployment failure
- **Retry Mechanisms** - Transient error recovery

## 🧪 Testing

**Validate configuration:**
```bash
npm run validate-config examples/client-john-realty.json
```

**Run tests:**
```bash
npm test
```

## 📞 Support

- **Documentation**: [allbusinesstools.com/docs](https://allbusinesstools.com/docs)
- **Support Email**: support@allbusinesstools.com
- **Issues**: GitHub Issues

## 📝 License

ISC - Internal Service Platform

---

**Built for small businesses that want professional online presence without the technical complexity.**
