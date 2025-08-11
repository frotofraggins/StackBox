# 🚀 StackPro Developer Guide: Frontend-Backend Architecture

**Date**: August 9, 2025  
**For**: Developers joining the StackPro project  
**Focus**: Page architecture, API connections, and development patterns

---

## 📋 **Table of Contents**

1. [Architecture Overview](#architecture-overview)
2. [Existing Pages & Routes](#existing-pages--routes)
3. [Frontend-Backend Connections](#frontend-backend-connections)
4. [Design System Integration](#design-system-integration)
5. [Adding New Pages](#adding-new-pages)
6. [API Integration Patterns](#api-integration-patterns)
7. [Component Patterns](#component-patterns)
8. [Deployment & Testing](#deployment--testing)

---

## 🏗️ **Architecture Overview**

### **Tech Stack**
```
Frontend:  Next.js 14 + TypeScript + Tailwind CSS
Backend:   Node.js + Express + AWS Services
Database:  RDS MySQL + DynamoDB
Hosting:   AWS Amplify + CloudFront + S3
```

### **Project Structure**
```
StackBox/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── pages/           # Route pages (file-based routing)
│   │   ├── components/      # Reusable UI components
│   │   ├── styles/          # Global styles & design tokens
│   │   ├── lib/             # Utilities & API clients
│   │   └── hooks/           # Custom React hooks
│   ├── public/              # Static assets
│   └── amplify/             # AWS Amplify configuration
└── src/                     # Backend API
    ├── api/                 # Express routes & middleware  
    ├── services/            # Business logic services
    └── utils/               # Helper functions
```

---

## 📄 **Existing Pages & Routes**

### **Public Pages** (No Authentication Required)

| Route | File | Purpose | Backend APIs Used |
|-------|------|---------|-------------------|
| `/` | `pages/index.tsx` | Homepage with features & pricing preview | None (static) |
| `/pricing` | `pages/pricing.tsx` | Pricing plans with Stripe integration | Stripe API, trial signup |
| `/features` | `pages/features.tsx` | Detailed feature showcase | None (static) |
| `/about` | `pages/about.tsx` | Company information | None (static) |
| `/contact` | `pages/contact.tsx` | Contact form | Email service API |
| `/law-firms` | `pages/law-firms.tsx` | Industry-specific landing page | None (static) |

### **Legal Pages**
| Route | File | Purpose | Backend APIs |
|-------|------|---------|-------------|
| `/terms` | `pages/terms.tsx` | Terms of Service | None (static) |
| `/privacy` | `pages/privacy.tsx` | Privacy Policy | None (static) |
| `/cookie-policy` | `pages/cookie-policy.tsx` | Cookie Policy | None (static) |

### **Authentication Pages**
| Route | File | Purpose | Backend APIs Used |
|-------|------|---------|-------------------|
| `/login` | `pages/login.tsx` | User authentication | AWS Cognito, JWT tokens |
| `/signup` | `pages/signup.tsx` | User registration | AWS Cognito, trial setup |

### **Protected Pages** (Authentication Required)
| Route | File | Purpose | Backend APIs Used |
|-------|------|---------|-------------------|
| `/dashboard` | `pages/dashboard.tsx` | Main user portal | User data, analytics API |
| `/dashboard/website/builder` | `pages/dashboard/website/builder.tsx` | Website builder interface | Site builder API, GrapesJS |

### **Demo & Testing Pages**
| Route | File | Purpose | Backend APIs Used |
|-------|------|---------|-------------------|
| `/demo-messaging` | `pages/demo-messaging.tsx` | Messaging system demo | WebSocket API, messaging service |
| `/premium-messaging` | `pages/premium-messaging.tsx` | Premium messaging features | WebSocket API, premium features |
| `/support` | `pages/support.tsx` | Customer support portal | Support ticket API |
| `/health` | `pages/health.tsx` | System health monitoring | Health check API |
| `/test/messaging` | `pages/test/messaging.tsx` | Messaging system testing | WebSocket API, test endpoints |

---

## 🔗 **Frontend-Backend Connections**

### **API Client Configuration**
```typescript
// frontend/src/lib/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://ws-sandbox.stackpro.io'

// Environment-aware API client
export const apiClient = {
  get: (endpoint: string) => fetch(`${API_BASE_URL}${endpoint}`),
  post: (endpoint: string, data: any) => fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}
```

### **Backend API Routes**
```javascript
// src/api/routes/ structure
├── ai.js                    # AI assistant endpoints
├── messaging.js             # Real-time messaging API  
└── site-builder.js          # Website builder API

// Example API endpoints:
GET    /api/health           # System health check
POST   /api/auth/login       # User authentication
POST   /api/auth/signup      # User registration  
GET    /api/user/profile     # User profile data
POST   /api/messaging/send   # Send message
GET    /api/sites/{id}       # Get website data
POST   /api/sites/save       # Save website changes
```

### **Real-time Connections**
```typescript
// WebSocket integration example
import { useWebSocket } from '../hooks/useWebSocket'

const MessagingComponent = () => {
  const { socket, isConnected } = useWebSocket(WS_URL)
  
  useEffect(() => {
    if (socket) {
      socket.on('message', handleNewMessage)
      socket.on('typing', handleTypingIndicator)
    }
  }, [socket])
}
```

---

## 🎨 **Design System Integration**

### **Token-Based Styling** (Enterprise-Grade)
Every new page should use the tokenized design system:

```tsx
// Example page structure with design tokens
import ThemeToggle from '../components/theme/ThemeToggle'

export default function NewPage() {
  return (
    <>
      {/* Header with tokenized logo */}
      <header className="bg-[color:var(--surface)]/95 backdrop-blur-md shadow-[var(--shadow-1)] fixed w-full top-0 z-50 border-b border-[color:var(--border)]">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            <Link href="/" style={{ color: 'var(--logo-color)' }}>
              StackPro
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content with tokenized styling */}
      <main className="pt-16">
        <section className="py-16" style={{ background: 'var(--grad-primary)' }}>
          <div className="container-custom">
            <h1 className="text-h1 text-white mb-4">Page Title</h1>
            <p className="text-xl text-white/80">Description</p>
          </div>
        </section>

        {/* Card system */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid-enhanced md:grid-cols-2 lg:grid-cols-3">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-[color:var(--fg)] mb-3">Card Title</h3>
                <p className="text-[color:var(--muted)]">Card description</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
```

### **Required Design Tokens**
```css
/* Always use these tokens in new pages */
--logo-color        /* Header logo (adapts to theme) */
--grad-primary      /* Hero section backgrounds */
--surface           /* Card backgrounds */
--border            /* Card borders */
--fg                /* Main text color */
--muted             /* Secondary text color */
--price-color       /* Pricing displays */
--card-number       /* Statistics/numbers */
--ai-chat-color     /* AI components */
```

---

## ➕ **Adding New Pages**

### **Step 1: Create the Page File**
```bash
# Create new page
touch frontend/src/pages/new-feature.tsx
```

### **Step 2: Basic Page Template**
```tsx
// frontend/src/pages/new-feature.tsx
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import ThemeToggle from '../components/theme/ThemeToggle'
import { apiClient } from '../lib/api'

export default function NewFeature() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // API integration example
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/new-feature/data')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return (
    <>
      <Head>
        <title>New Feature - StackPro</title>
        <meta name="description" content="Description of new feature" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Use tokenized header */}
      <header className="bg-[color:var(--surface)]/95 backdrop-blur-md shadow-[var(--shadow-1)] fixed w-full top-0 z-50 border-b border-[color:var(--border)]">
        <div className="container-custom">
          <div className="flex justify-between items-center h-16">
            <Link href="/" style={{ color: 'var(--logo-color)' }}>
              StackPro
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors">
                Home
              </Link>
              <Link href="/new-feature" className="text-[color:var(--primary)] font-semibold">
                New Feature
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero section */}
        <section className="py-16 text-white" style={{ background: 'var(--grad-primary)' }}>
          <div className="container-custom">
            <h1 className="text-h1 text-white mb-4">New Feature</h1>
            <p className="text-xl text-white/80">Feature description</p>
          </div>
        </section>

        {/* Content section */}
        <section className="py-16">
          <div className="container-custom">
            {loading ? (
              <div className="text-center text-[color:var(--muted)]">Loading...</div>
            ) : (
              <div className="grid-enhanced md:grid-cols-2">
                <div className="card p-6">
                  <h3 className="text-xl font-semibold text-[color:var(--fg)] mb-3">
                    Content Title
                  </h3>
                  <p className="text-[color:var(--muted)]">
                    Content description using data: {data?.someField}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
```

### **Step 3: Add Navigation Links**
Update existing pages to include links to your new page:

```tsx
// Add to main navigation in header components
<Link href="/new-feature" className="text-[color:var(--muted)] hover:text-[color:var(--fg)] transition-colors">
  New Feature
</Link>

// Add to footer if needed
<Link href="/new-feature" className="text-white/70 hover:text-white transition-colors">
  New Feature
</Link>
```

### **Step 4: Add Backend API Route** (if needed)
```javascript
// src/api/routes/new-feature.js
const express = require('express')
const router = express.Router()

// GET /api/new-feature/data
router.get('/data', async (req, res) => {
  try {
    // Business logic here
    const data = { someField: 'example data' }
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
```

```javascript
// Add to src/api/server.js
const newFeatureRoutes = require('./routes/new-feature')
app.use('/api/new-feature', newFeatureRoutes)
```

---

## 🔌 **API Integration Patterns**

### **1. Simple Data Fetching**
```tsx
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/endpoint')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  fetchData()
}, [])
```

### **2. Form Submission**
```tsx
const handleSubmit = async (formData) => {
  try {
    setLoading(true)
    const response = await apiClient.post('/api/submit', formData)
    if (!response.ok) throw new Error('Submission failed')
    
    // Success handling
    setSuccess(true)
    // Redirect or update UI
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}
```

### **3. Real-time Updates**
```tsx
import { useWebSocket } from '../hooks/useWebSocket'

const RealTimeComponent = () => {
  const { socket, isConnected } = useWebSocket(WS_URL)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (socket) {
      socket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message])
      })
      
      return () => socket.off('newMessage')
    }
  }, [socket])

  const sendMessage = (content) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', { content, timestamp: new Date() })
    }
  }
}
```

### **4. Authentication Integration**
```tsx
import { useAuth } from '../hooks/useAuth'

const ProtectedComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <div>Please log in to access this feature</div>
  }

  // Authenticated content
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

---

## 🧩 **Component Patterns**

### **1. Page Layout Components**
```tsx
// components/Layout.tsx
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  )
}

// Usage in pages
export default function MyPage() {
  return (
    <Layout>
      <section className="py-16">
        {/* Page content */}
      </section>
    </Layout>
  )
}
```

### **2. Card Components**
```tsx
// components/Card.tsx
export function Card({ children, featured = false, ...props }) {
  return (
    <div 
      className={`card p-6 ${featured ? 'card--featured' : ''}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Usage
<Card featured>
  <h3 className="text-xl font-semibold text-[color:var(--fg)]">Title</h3>
  <p className="text-[color:var(--muted)]">Description</p>
</Card>
```

### **3. Button Components**
```tsx
// components/Button.tsx
export function Button({ 
  children, 
  variant = 'primary', 
  onClick, 
  loading = false,
  ...props 
}) {
  const baseClasses = "w-full px-6 py-3 rounded-[var(--radius)] font-semibold transition-all duration-[var(--dur)] ease-[var(--ease)] hover-scale text-white hover:opacity-90 shadow-[var(--shadow-1)]"
  
  const variantStyles = {
    primary: 'var(--grad-primary)',
    secondary: 'var(--secondary)', 
    accent: 'var(--accent)'
  }

  return (
    <button
      className={baseClasses}
      style={{ background: variantStyles[variant] }}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}

// Usage
<Button variant="primary" onClick={handleClick}>
  Call to Action
</Button>
```

### **4. Form Components**
```tsx
// components/FormField.tsx
export function FormField({ label, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-[color:var(--fg)] mb-2">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-[color:var(--danger)]">{error}</p>
      )}
    </div>
  )
}

// Usage
<FormField label="Email" error={emailError}>
  <input
    type="email"
    className="input-enhanced w-full"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>
```

---

## 🚀 **Deployment & Testing**

### **Local Development**
```bash
# Start frontend dev server
cd frontend && npm run dev

# Start backend API server
npm run dev

# Run both simultaneously  
npm run dev:all
```

### **Environment Variables**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENV=development

# .env (backend)
NODE_ENV=development
DATABASE_URL=mysql://localhost:3306/stackpro
AWS_REGION=us-west-2
```

### **Testing New Pages**
```bash
# Test page accessibility
npm run test:a11y

# Test responsive design
npm run test:responsive

# Test API endpoints
npm run test:api

# Visual regression testing
npm run test:visual
```

### **Deployment Process**
```bash
# Deploy to Amplify
npm run deploy:amplify

# Health check
npm run health:check

# Production verification
npm run verify:production
```

---

## 🔧 **Development Best Practices**

### **1. File Naming Conventions**
```
PascalCase:     Components (Button.tsx, UserProfile.tsx)
kebab-case:     Pages (user-profile.tsx, contact-us.tsx)  
camelCase:      Functions, variables (handleSubmit, userData)
UPPER_CASE:     Constants (API_BASE_URL, MAX_RETRIES)
```

### **2. Import Organization**
```tsx
// 1. React & Next.js imports
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// 2. Third-party libraries
import axios from 'axios'

// 3. Local components & utilities
import Button from '../components/Button'
import { apiClient } from '../lib/api'

// 4. Types (if using TypeScript)
import type { User, ApiResponse } from '../types'
```

### **3. Error Handling**
```tsx
// Always handle loading, success, and error states
const [state, setState] = useState({
  data: null,
  loading: false,
  error: null
})

const handleApiCall = async () => {
  setState(prev => ({ ...prev, loading: true, error: null }))
  
  try {
    const response = await apiClient.get('/endpoint')
    const data = await response.json()
    setState({ data, loading: false, error: null })
  } catch (error) {
    setState(prev => ({ 
      ...prev, 
      loading: false, 
      error: error.message 
    }))
  }
}
```

### **4. Accessibility Requirements**
```tsx
// Always include proper ARIA labels and semantic HTML
<button
  className="btn btn-primary"
  aria-label="Start free trial for Business plan"
  onClick={handleClick}
>
  Start Free Trial
</button>

// Use proper heading hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>

// Include focus management
const buttonRef = useRef(null)
useEffect(() => {
  if (showModal) {
    buttonRef.current?.focus()
  }
}, [showModal])
```

---

## 🔍 **Troubleshooting Common Issues**

### **1. Page Not Loading**
```bash
# Check if page file exists
ls frontend/src/pages/your-page.tsx

# Check for syntax errors
npm run build

# Check console for errors
# Open browser dev tools → Console tab
```

### **2. API Connection Issues**
```typescript
// Debug API calls
console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('Making request to:', `${API_BASE_URL}/endpoint`)

// Check network tab in browser dev tools
// Verify CORS settings in backend
```

### **3. Styling Issues**
```bash
# Rebuild CSS
npm run build:css

# Check if design tokens are loaded
# Browser dev tools → Elements → Computed styles
# Look for CSS custom properties like --primary, --surface, etc.
```

### **4. WebSocket Connection Issues**
```typescript
// Debug WebSocket connection
const socket = io(WS_URL, {
  transports: ['websocket', 'polling'],
  timeout: 10000
})

socket.on('connect', () => console.log('Connected to WebSocket'))
socket.on('disconnect', () => console.log('Disconnected'))
socket.on('error', (error) => console.error('WebSocket error:', error))
```

---

## 📚 **Quick Reference**

### **Essential Commands**
```bash
# Development
npm run dev              # Start development servers
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode testing
npm run type-check       # TypeScript type checking

# Deployment
npm run deploy           # Deploy to Amplify
npm run health:check     # Verify deployment
```

### **Important URLs**
```
Local Development:   http://localhost:3000
API Endpoint:        http://localhost:3001/api
WebSocket:           ws://localhost:3001
Production:          https://stackpro.io
Staging:             https://staging.stackpro.io
Health Check:        /health
```

### **Key Directories**
```
frontend/src/pages/      # Add new pages here
frontend/src/components/ # Reusable UI components
frontend/src/styles/     # CSS and design tokens
src/api/routes/          # Backend API endpoints
src/services/            # Business logic
docs/                    # All documentation
```

---

**🎯 This guide should get you up and running with StackPro development! For questions or improvements to this documentation, update this file and commit your changes.**

---

*Last Updated: August 9, 2025*  
*Next Review: Monthly or when major features are added*
