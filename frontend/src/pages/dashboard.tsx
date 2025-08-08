import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  FileText, 
  Users, 
  Calendar, 
  Mail, 
  Settings, 
  Bell, 
  Search,
  Plus,
  TrendingUp,
  Filter,
  MoreHorizontal
} from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get user and client ID from localStorage or URL params
    const storedUser = localStorage.getItem('user')
    const urlParams = new URLSearchParams(window.location.search)
    const clientId = urlParams.get('client')

    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      
      // Fetch dashboard data
      fetchDashboardData(userData.clientId || clientId)
    } else if (clientId) {
      // If no stored user but we have clientId, redirect to login
      window.location.href = '/login'
    } else {
      // No user data and no client ID - redirect to home
      window.location.href = '/'
    }
  }, [])

  const fetchDashboardData = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3002/api/dashboard/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setDashboardData(result.data)
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else {
        setError('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      setError('Network error loading dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'crm', name: 'CRM', icon: Users },
    { id: 'files', name: 'Files', icon: FileText },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  return (
    <>
      <Head>
        <title>Dashboard - StackPro | Business Management Platform</title>
        <meta name="description" content="Manage your business with StackPro's integrated dashboard. Access CRM, files, calendar, and more in one place." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="header-glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary">
                  StackPro
                </Link>
                <span className="ml-2 px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full">
                  Dashboard
                </span>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Search clients, files, tasks..."
                  />
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <button className="p-2 text-text-muted hover:text-primary transition-colors">
                  <Bell className="h-6 w-6" />
                </button>
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">JD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-primary rounded-lg p-6 text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Welcome back, John! 👋</h1>
            <p className="text-text-light/80">
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-border mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-muted hover:text-text-light hover:border-border'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card animate-fade-in">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary">Total Clients</p>
                      <p className="text-2xl font-semibold text-text-light">1,247</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+12% from last month</span>
                    </div>
                  </div>
                </div>

                <div className="card animate-fade-in">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-success" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary">Files Shared</p>
                      <p className="text-2xl font-semibold text-text-light">3,842</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+8% from last month</span>
                    </div>
                  </div>
                </div>

                <div className="card animate-fade-in">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-8 w-8 text-accent" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary">Appointments</p>
                      <p className="text-2xl font-semibold text-text-light">156</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+24% from last month</span>
                    </div>
                  </div>
                </div>

                <div className="card animate-fade-in">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Mail className="h-8 w-8 text-warning" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary">Email Campaigns</p>
                      <p className="text-2xl font-semibold text-text-light">45</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-success">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+18% open rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card animate-fade-in">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-lg font-medium text-text-light">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center p-4 text-center bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                      <Plus className="h-8 w-8 text-primary mb-2" />
                      <span className="text-sm font-medium text-primary">Add Client</span>
                    </button>
                    <button className="flex flex-col items-center p-4 text-center bg-success/10 rounded-lg hover:bg-success/20 transition-colors">
                      <FileText className="h-8 w-8 text-success mb-2" />
                      <span className="text-sm font-medium text-success">Upload File</span>
                    </button>
                    <button className="flex flex-col items-center p-4 text-center bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors">
                      <Calendar className="h-8 w-8 text-accent mb-2" />
                      <span className="text-sm font-medium text-accent">Schedule Meeting</span>
                    </button>
                    <button className="flex flex-col items-center p-4 text-center bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors">
                      <Mail className="h-8 w-8 text-warning mb-2" />
                      <span className="text-sm font-medium text-warning">Send Email</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="card animate-fade-in">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-medium text-text-light">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        <li className="relative pb-8">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-8 ring-surface">
                                <Users className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-text-secondary">
                                  New client <span className="font-medium text-text-light">Sarah Johnson</span> added
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-text-muted">
                                <time>2h ago</time>
                              </div>
                            </div>
                          </div>
                        </li>

                        <li className="relative pb-8">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-success flex items-center justify-center ring-8 ring-surface">
                                <FileText className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-text-secondary">
                                  Contract file uploaded for <span className="font-medium text-text-light">Miller Case</span>
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-text-muted">
                                <time>4h ago</time>
                              </div>
                            </div>
                          </div>
                        </li>

                        <li className="relative">
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-accent flex items-center justify-center ring-8 ring-surface">
                                <Calendar className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-text-secondary">
                                  Meeting scheduled with <span className="font-medium text-text-light">ABC Corp</span>
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-text-muted">
                                <time>1d ago</time>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="card animate-fade-in">
                  <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-medium text-text-light">Upcoming Tasks</h3>
                    <button className="text-primary hover:text-primary-hover text-sm font-medium transition-colors">
                      View all
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center p-3 bg-error/10 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-error rounded-full"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-text-light">Contract deadline - Johnson case</p>
                          <p className="text-sm text-text-secondary">Due in 2 hours</p>
                        </div>
                        <button className="text-text-muted hover:text-text-light transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center p-3 bg-warning/10 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-warning rounded-full"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-text-light">Client call - ABC Corporation</p>
                          <p className="text-sm text-text-secondary">Tomorrow at 2:00 PM</p>
                        </div>
                        <button className="text-text-muted hover:text-text-light transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center p-3 bg-primary/10 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-text-light">Follow up with new leads</p>
                          <p className="text-sm text-text-secondary">Friday at 10:00 AM</p>
                        </div>
                        <button className="text-text-muted hover:text-text-light transition-colors">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CRM Tab Content */}
          {activeTab === 'crm' && (
            <div className="card animate-fade-in">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-medium text-text-light">Client Management</h3>
                <div className="flex space-x-2">
                  <button className="btn-secondary">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                  <button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-text-secondary text-center py-8">
                  CRM functionality coming soon. Manage all your client relationships in one place.
                </p>
              </div>
            </div>
          )}

          {/* Files Tab Content */}
          {activeTab === 'files' && (
            <div className="card animate-fade-in">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-medium text-text-light">File Management</h3>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload File
                </button>
              </div>
              <div className="p-6">
                <p className="text-text-secondary text-center py-8">
                  Secure file sharing portal coming soon. Share files safely with your clients.
                </p>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {['calendar', 'email', 'settings'].includes(activeTab) && (
            <div className="card animate-fade-in">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-medium text-text-light">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-secondary text-center py-8">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} functionality coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
