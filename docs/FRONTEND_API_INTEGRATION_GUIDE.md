# 🎨 StackBox Frontend API Integration Guide

## 📋 **OVERVIEW: API-FIRST ARCHITECTURE**

Many premium clients want to:
- ✅ **Keep their existing website design** (often custom-built, expensive)
- ✅ **Integrate StackBox business tools** seamlessly into their site
- ✅ **Maintain their brand consistency** across all touchpoints
- ✅ **Control the user experience** completely

**Solution:** StackBox provides **headless/API-first services** that integrate with their existing frontend.

---

## 🏗️ **INTEGRATION APPROACHES**

### **1. 🔌 JavaScript SDK Integration (Most Seamless)**
```javascript
// Client adds to their existing website
<script src="https://api.stackbox.io/sdk/stackbox.js"></script>
<script>
  const stackbox = new StackBox({
    clientId: 'lawfirm-abc',
    apiKey: 'sb_live_abc123...',
    theme: {
      primaryColor: '#1e40af',
      fontFamily: 'Inter, sans-serif'
    }
  });

  // Add CRM functionality to their existing contact form
  document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    await stackbox.crm.createContact({
      name: e.target.name.value,
      email: e.target.email.value,
      phone: e.target.phone.value,
      source: 'website_contact_form'
    });
    
    // Their custom success handling
    showSuccessMessage('Contact saved to CRM!');
  });
</script>
```

### **2. 📦 Embeddable Widgets (Drop-in Components)**
```html
<!-- Client adds these to their existing pages -->

<!-- File Upload Widget -->
<div id="file-upload-widget"></div>
<script>
  stackbox.widgets.fileUpload('#file-upload-widget', {
    clientId: 'lawfirm-abc',
    folder: 'client-documents',
    allowedTypes: ['pdf', 'docx', 'xlsx'],
    maxSize: '10MB',
    onUpload: (file) => {
      // Custom callback - update their UI
      updateClientDashboard(file);
    }
  });
</script>

<!-- Booking Calendar Widget -->
<div id="booking-calendar"></div>
<script>
  stackbox.widgets.bookingCalendar('#booking-calendar', {
    serviceTypes: ['consultation', 'follow-up', 'document-review'],
    theme: 'minimal',
    customCSS: '/assets/booking-styles.css'
  });
</script>

<!-- CRM Contact Search -->
<div id="client-search"></div>
<script>
  stackbox.widgets.contactSearch('#client-search', {
    searchFields: ['name', 'email', 'case-number'],
    onSelect: (contact) => {
      // Their custom logic
      loadClientDetails(contact.id);
    }
  });
</script>
```

### **3. 🖼️ Iframe Embedding (Full Applications)**
```html
<!-- For full-featured tools within their site -->

<!-- Embedded CRM Dashboard -->
<iframe 
  src="https://crm.stackbox.io/embed/lawfirm-abc?token=secure_token_here"
  width="100%" 
  height="600px"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>

<!-- Embedded File Manager -->
<iframe 
  src="https://files.stackbox.io/embed/lawfirm-abc?folder=client-docs&theme=light"
  width="100%" 
  height="500px"
  frameborder="0">
</iframe>
```

### **4. 🔗 REST API Integration (Full Control)**
```javascript
// Client's custom frontend calls StackBox APIs directly

// Create contact in CRM
const response = await fetch('https://api.stackbox.io/v1/crm/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sb_live_abc123...',
    'Content-Type': 'application/json',
    'X-Client-ID': 'lawfirm-abc'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@email.com',
    customFields: {
      caseType: 'Personal Injury',
      referralSource: 'Google Ads'
    }
  })
});

// Upload file to client portal
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('clientId', 'contact_123');
formData.append('folder', 'legal-documents');

const uploadResponse = await fetch('https://api.stackbox.io/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sb_live_abc123...',
    'X-Client-ID': 'lawfirm-abc'
  },
  body: formData
});
```

---

## 🎨 **WHITE-LABEL API ENDPOINTS**

### **Custom Domain API Access:**
```javascript
// Instead of api.stackbox.io, use their domain
const apiBase = 'https://api.lawfirm.com'; // CNAME to api.stackbox.io

// Or subdomain approach
const apiBase = 'https://services.lawfirm.com'; // Their branding
```

### **Branded Response Headers:**
```javascript
// API responses include their branding
{
  "data": { /* contact data */ },
  "branding": {
    "logoUrl": "https://lawfirm.com/logo.png",
    "primaryColor": "#1e40af",
    "companyName": "Smith & Associates Law"
  },
  "powered_by": "hidden" // StackBox branding removed in premium tiers
}
```

---

## 🔧 **ENHANCED BACKEND SERVICES**

### **API-First CRM Service:**
```javascript
// src/services/api-first-crm.js
class APIFirstCRMService {
  async createContact(clientId, contactData) {
    // Store in client's dedicated database
    const contact = await this.databases[clientId].contacts.create({
      ...contactData,
      createdAt: new Date(),
      source: 'api_integration'
    });

    // Trigger webhooks to their systems
    await this.sendWebhook(clientId, 'contact.created', contact);

    return {
      id: contact.id,
      ...contact,
      apiEndpoints: {
        update: `/v1/crm/contacts/${contact.id}`,
        delete: `/v1/crm/contacts/${contact.id}`,
        notes: `/v1/crm/contacts/${contact.id}/notes`,
        files: `/v1/crm/contacts/${contact.id}/files`
      }
    };
  }

  async sendWebhook(clientId, event, data) {
    const client = await this.getClientConfig(clientId);
    if (client.webhookUrl) {
      await fetch(client.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-StackBox-Event': event,
          'X-StackBox-Signature': this.generateSignature(data, client.webhookSecret)
        },
        body: JSON.stringify({
          event,
          data,
          timestamp: Date.now(),
          clientId
        })
      });
    }
  }
}
```

### **File Management API:**
```javascript
// src/services/api-file-manager.js
class APIFileManager {
  async uploadFile(clientId, fileData, metadata) {
    const s3Key = `clients/${clientId}/files/${metadata.folder}/${metadata.filename}`;
    
    // Upload to client's dedicated S3 bucket
    await this.s3.upload({
      Bucket: `stackbox-${clientId}-files`,
      Key: s3Key,
      Body: fileData,
      Metadata: {
        uploadedBy: metadata.userId,
        category: metadata.category,
        relatedContactId: metadata.contactId
      }
    });

    // Create database record
    const fileRecord = await this.databases[clientId].files.create({
      filename: metadata.filename,
      s3Key,
      size: fileData.length,
      mimeType: metadata.mimeType,
      uploadedAt: new Date(),
      contactId: metadata.contactId
    });

    // Return secure access URL
    return {
      id: fileRecord.id,
      filename: metadata.filename,
      downloadUrl: `https://api.${clientId}.stackbox.io/v1/files/${fileRecord.id}/download`,
      viewUrl: `https://api.${clientId}.stackbox.io/v1/files/${fileRecord.id}/view`,
      thumbnailUrl: metadata.mimeType.startsWith('image') ? 
        `https://api.${clientId}.stackbox.io/v1/files/${fileRecord.id}/thumbnail` : null
    };
  }
}
```

---

## 🎯 **CLIENT IMPLEMENTATION EXAMPLES**

### **Example 1: Law Firm Integration**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Smith & Associates - Client Portal</title>
    <link rel="stylesheet" href="/assets/custom-styles.css">
</head>
<body>
    <!-- Their existing header/navigation -->
    <header class="firm-header">
        <nav><!-- Their navigation --></nav>
    </header>

    <!-- Their custom dashboard with StackBox integration -->
    <main class="client-dashboard">
        <div class="dashboard-grid">
            <!-- Case Status (their design + StackBox data) -->
            <div class="card case-status">
                <h3>Your Cases</h3>
                <div id="case-list"></div>
            </div>

            <!-- Document Upload (StackBox widget) -->
            <div class="card document-upload">
                <h3>Upload Documents</h3>
                <div id="stackbox-file-upload"></div>
            </div>

            <!-- Appointment Booking (StackBox widget) -->
            <div class="card appointments">
                <h3>Schedule Consultation</h3>
                <div id="stackbox-booking"></div>
            </div>
        </div>
    </main>

    <!-- Their existing footer -->
    <footer><!-- Their footer --></footer>

    <!-- StackBox Integration -->
    <script src="https://api.smithlaw.com/sdk/stackbox.js"></script>
    <script>
        const stackbox = new StackBox({
            clientId: 'smith-associates',
            apiKey: 'sb_live_smith123...',
            theme: {
                primaryColor: '#8B4513', // Their brown theme
                fontFamily: 'Georgia, serif', // Their font
                borderRadius: '4px' // Their style
            }
        });

        // Initialize widgets with their styling
        stackbox.widgets.fileUpload('#stackbox-file-upload', {
            allowedTypes: ['pdf', 'docx', 'jpg', 'png'],
            customCSS: '/assets/stackbox-overrides.css',
            onUpload: (file) => {
                // Their custom success handling
                showNotification('Document uploaded successfully!');
                refreshCaseDocuments();
            }
        });

        stackbox.widgets.bookingCalendar('#stackbox-booking', {
            serviceTypes: ['Initial Consultation', 'Follow-up Meeting', 'Document Review'],
            timeSlots: ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'],
            customCSS: '/assets/booking-styles.css'
        });

        // Load case data via API
        async function loadCases() {
            const cases = await stackbox.api.get('/crm/cases');
            document.getElementById('case-list').innerHTML = cases.map(case => `
                <div class="case-item ${case.status.toLowerCase()}">
                    <h4>${case.title}</h4>
                    <p>Status: ${case.status}</p>
                    <p>Next Date: ${case.nextDate}</p>
                </div>
            `).join('');
        }

        loadCases();
    </script>
</body>
</html>
```

### **Example 2: Real Estate Agent Integration**
```javascript
// Their existing React/Vue/Angular app
import { StackBoxClient } from '@stackbox/client-sdk';

const stackbox = new StackBoxClient({
  clientId: 'premium-realty',
  apiKey: process.env.STACKBOX_API_KEY,
  baseURL: 'https://services.premiumrealty.com' // Their branded API
});

// In their existing property listing component
const PropertyDetail = ({ propertyId }) => {
  const [leads, setLeads] = useState([]);

  // Integrate lead management with their existing flow
  const handleInquiry = async (inquiryData) => {
    // Save to StackBox CRM
    const lead = await stackbox.crm.createLead({
      ...inquiryData,
      propertyId,
      source: 'property_inquiry',
      customFields: {
        propertyAddress: propertyData.address,
        listingPrice: propertyData.price,
        agentId: currentAgent.id
      }
    });

    // Their existing success flow
    setLeads([...leads, lead]);
    showSuccessMessage('Inquiry sent! We\'ll contact you within 24 hours.');
    
    // Trigger their existing email automation
    triggerWelcomeSequence(lead.email);
  };

  return (
    <div className="property-detail">
      {/* Their existing property display */}
      <PropertyImages />
      <PropertyInfo />
      
      {/* StackBox-powered inquiry form with their styling */}
      <InquiryForm 
        onSubmit={handleInquiry}
        className="custom-inquiry-form"
      />
      
      {/* StackBox-powered document sharing */}
      <DocumentPortal
        propertyId={propertyId}
        theme="realtor-blue"
        allowedRoles={['buyer', 'agent', 'lender']}
      />
    </div>
  );
};
```

---

## 💰 **PRICING FOR API/INTEGRATION SERVICES**

### **🔌 API Integration Tier: $299/month**
- RESTful API access
- JavaScript SDK
- Basic embeddable widgets
- 10,000 API calls/month
- Email support

### **🎨 Frontend Integration Tier: $499/month**
- Everything in API Integration
- Advanced embeddable widgets
- Custom CSS/theming
- White-label API endpoints
- 50,000 API calls/month
- Priority support
- Custom domain (api.yourclient.com)

### **🏢 Enterprise Integration Tier: $799/month**
- Everything in Frontend Integration
- Unlimited API calls
- Custom widget development
- Webhook system
- SSO integration
- Dedicated support manager
- Complete white-labeling
- Custom branding removal

### **🚀 Platform Partner Tier: $1,299/month**
- Everything in Enterprise Integration
- Multi-tenant API access
- Revenue sharing options
- Co-branded solutions
- Technical partnership
- Joint go-to-market support
- Custom feature development

---

## 📊 **IMPLEMENTATION ROADMAP**

### **Phase 1: Core API Infrastructure (Week 1-2)**
```javascript
// Create RESTful API endpoints
app.get('/v1/crm/contacts', authenticateClient, getContacts);
app.post('/v1/crm/contacts', authenticateClient, createContact);
app.get('/v1/files/:id/download', authenticateClient, downloadFile);
app.post('/v1/files/upload', authenticateClient, uploadFile);
```

### **Phase 2: JavaScript SDK (Week 3-4)**
```javascript
// Build client-side SDK
class StackBoxClient {
  constructor(config) {
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.stackbox.io';
  }

  async get(endpoint) {
    return fetch(`${this.baseURL}${endpoint}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    }).then(r => r.json());
  }

  // CRM methods
  crm = {
    createContact: (data) => this.post('/v1/crm/contacts', data),
    getContacts: (filters) => this.get(`/v1/crm/contacts?${new URLSearchParams(filters)}`)
  };

  // File methods
  files = {
    upload: (file, metadata) => this.uploadFile('/v1/files/upload', file, metadata)
  };
}
```

### **Phase 3: Embeddable Widgets (Week 5-6)**
```javascript
// Create widget system
StackBox.widgets = {
  fileUpload: (selector, config) => {
    const element = document.querySelector(selector);
    ReactDOM.render(<FileUploadWidget {...config} />, element);
  },
  
  bookingCalendar: (selector, config) => {
    const element = document.querySelector(selector);
    ReactDOM.render(<BookingWidget {...config} />, element);
  }
};
```

### **Phase 4: White-Label Endpoints (Week 7-8)**
```javascript
// Custom domain routing
app.use((req, res, next) => {
  const hostname = req.get('host');
  if (hostname !== 'api.stackbox.io') {
    // Extract client from custom domain
    req.clientId = await this.getClientFromDomain(hostname);
  }
  next();
});
```

---

## 🎯 **BUSINESS ADVANTAGES**

### **For StackBox:**
- 🚀 **Premium pricing** ($299-1299 vs $149-349)
- 🚀 **Sticky integration** - hard to switch once integrated
- 🚀 **Higher technical barriers** - fewer competitors
- 🚀 **Enterprise credibility** - API-first architecture
- 🚀 **Scalable revenue** - usage-based pricing potential

### **For Clients:**
- ✅ **Keep their website investment** - no redesign needed
- ✅ **Maintain brand consistency** - full control over UX
- ✅ **Technical flexibility** - integrate how they want
- ✅ **Future-proof** - API evolves with their needs
- ✅ **Professional appearance** - seamless integration

## 🔧 **TECHNICAL REQUIREMENTS**

### **Backend Updates Needed:**
- RESTful API layer for all services
- Authentication/API key system
- Rate limiting and monitoring
- Webhook system for real-time updates
- Custom domain routing
- White-label response formatting

### **Frontend SDK Creation:**
- JavaScript client library
- React/Vue/Angular components
- Embeddable widgets
- CSS theming system
- Documentation and examples

**This transforms StackBox into a true B2B platform that integrates with any existing website!** 🎨

---

## 📞 **CLIENT ONBOARDING FOR FRONTEND INTEGRATION**

### **Discovery Questions:**
1. "What technology stack is your website built with?"
2. "Do you have in-house developers or work with an agency?"
3. "What business processes do you want to digitize first?"
4. "How important is maintaining your existing brand/design?"
5. "Do you need real-time data synchronization with other systems?"

### **Technical Assessment:**
- Review their existing website architecture
- Assess their development capabilities
- Identify integration points and requirements
- Scope custom widget/API needs
- Determine white-labeling requirements

**Result: Premium clients who pay $500-1300/month for seamless business tool integration!** 🏢
