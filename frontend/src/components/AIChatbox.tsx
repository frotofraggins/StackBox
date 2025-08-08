import React, { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, Send, Bot, User, Minimize2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface AIChatboxProps {
  isOpen: boolean
  onToggle: () => void
}

export default function AIChatbox({ isOpen, onToggle }: AIChatboxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm StackPro AI. I can help you learn about our business platform, pricing, or answer any questions. What would you like to know?",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [showContactForm, setShowContactForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Simulate AI response for now - replace with actual Bedrock API call
      const aiResponse = await getAIResponse(content)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try contacting our support team at support@stackpro.io or use the contact form.",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const lowerMessage = userMessage.toLowerCase()

    // Simple response logic - replace with actual Bedrock integration
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return "StackPro offers three pricing tiers:\n\n📈 **Starter Plan: $299/month**\n- Complete CRM system\n- File sharing portal\n- Professional website\n- Basic email marketing\n\n🚀 **Business Plan: $599/month** (Most Popular)\n- Everything in Starter\n- Advanced automation\n- Online booking system\n- Priority support\n\n🏢 **Enterprise Plan: $1,299/month**\n- Everything in Business\n- AI business assistant\n- Custom integrations\n- Dedicated account manager\n\nAll plans include a 7-day free trial. Would you like me to help you choose the right plan for your business?"
    }

    if (lowerMessage.includes('law firm') || lowerMessage.includes('legal') || lowerMessage.includes('lawyer')) {
      return "StackPro is perfect for law firms! We specialize in legal practice management with features like:\n\n⚖️ **Legal-Specific Features:**\n- Secure client file portals (HIPAA compliant)\n- Case management and tracking\n- Legal document templates\n- Client communication logs\n- Billing and time tracking\n- Court deadline reminders\n\n🔒 **Security & Compliance:**\n- Bank-level encryption\n- Audit trails for compliance\n- Role-based access controls\n- Automatic backups\n\nMany law firms save 10-15 hours per week using StackPro. Would you like to schedule a demo tailored for legal practices?"
    }

    if (lowerMessage.includes('feature') || lowerMessage.includes('what does') || lowerMessage.includes('capabilities')) {
      return "StackPro is an all-in-one business platform that includes:\n\n🎯 **Core Features:**\n- **CRM System** - Manage clients and deals\n- **File Portal** - Secure file sharing with clients\n- **Professional Website** - Mobile-responsive business site\n- **Email Marketing** - Automated campaigns and sequences\n- **Online Booking** - Appointment scheduling\n- **AI Assistant** - Business automation and insights\n\n✨ **Key Benefits:**\n- Everything integrated in one platform\n- No need for multiple subscriptions\n- 20-minute setup process\n- 24/7 support included\n\nWhich specific feature interests you most? I can provide more details!"
    }

    if (lowerMessage.includes('demo') || lowerMessage.includes('trial') || lowerMessage.includes('try')) {
      setShowContactForm(true)
      return "I'd be happy to help you get started! You have two great options:\n\n🆓 **Free Trial (7 Days)**\n- Full access to all features\n- No credit card required\n- Setup assistance included\n\n📞 **Personal Demo (30 Minutes)**\n- Tailored to your business needs\n- Q&A with our team\n- Custom setup recommendations\n\nTo get started, I'll need a few quick details. What's your name and email address?"
    }

    if (lowerMessage.includes('support') || lowerMessage.includes('help') || lowerMessage.includes('contact')) {
      return "We're here to help! Here are your support options:\n\n📧 **Email Support:**\n- support@stackpro.io\n- Response within 2 hours (business hours)\n\n💬 **Live Chat:**\n- Available 9 AM - 6 PM EST\n- Immediate assistance\n\n📞 **Phone Support:**\n- Available for Business+ plans\n- Dedicated account managers\n\n📚 **Resources:**\n- Knowledge base with tutorials\n- Video training library\n- Setup assistance included\n\nWhat specific question can I help you with?"
    }

    if (lowerMessage.includes('setup') || lowerMessage.includes('onboarding') || lowerMessage.includes('getting started')) {
      return "Getting started with StackPro is incredibly simple!\n\n⚡ **Quick Setup Process (20 minutes):**\n\n1. **Account Creation** (2 mins)\n   - Sign up with email\n   - Choose your plan\n\n2. **Business Info** (5 mins)\n   - Add company details\n   - Upload logo and branding\n\n3. **Feature Configuration** (10 mins)\n   - Import existing contacts\n   - Set up email templates\n   - Configure booking calendar\n\n4. **Go Live** (3 mins)\n   - Domain setup\n   - Test everything\n   - Start using immediately!\n\n🎯 **We provide:**\n- Step-by-step setup guide\n- Live chat assistance\n- Video tutorials\n- Data import help\n\nReady to start your free trial?"
    }

    // Default response
    return "Thanks for your question! I can help you with:\n\n• Pricing and plans\n• Features and capabilities\n• Setup and onboarding\n• Law firm specific questions\n• Scheduling a demo\n• Technical support\n\nWhat specific aspect of StackPro would you like to learn about? Or feel free to ask me anything!"
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !userEmail) return

    // Here you would typically send the lead info to your CRM/database
    const leadMessage: Message = {
      id: Date.now().toString(),
      content: `Perfect! I've noted your details:\n\n👤 **Name:** ${userName}\n📧 **Email:** ${userEmail}\n\nI'll have our team reach out within 2 hours to schedule your personalized demo. In the meantime, feel free to ask me any questions about StackPro!\n\nYou can also start your free trial immediately at stackpro.io/signup`,
      sender: 'ai',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, leadMessage])
    setShowContactForm(false)
    setUserName('')
    setUserEmail('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputMessage)
    }
  }

  const quickActions = [
    { label: "View Pricing", message: "What are your pricing plans?" },
    { label: "Schedule Demo", message: "I'd like to schedule a demo" },
    { label: "Law Firm Features", message: "What features do you have for law firms?" },
    { label: "Start Free Trial", message: "How do I start a free trial?" }
  ]

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-110 z-50 group"
        title="Chat with StackPro AI"
      >
        <MessageCircle size={24} />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          1
        </span>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Have questions? Chat with AI ✨
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border flex flex-col z-50 animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bot size={16} />
          </div>
          <div>
            <div className="font-semibold">StackPro AI</div>
            <div className="text-xs text-blue-100">Usually replies instantly</div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggle}
            className="text-white hover:text-blue-200 p-1"
            title="Minimize chat"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onToggle}
            className="text-white hover:text-blue-200 p-1"
            title="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}>
                {message.sender === 'user' ? <User size={16} /> : <Bot size={16} className="text-gray-600" />}
              </div>
              <div className={`rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot size={16} className="text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 rounded-lg">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-4 text-center">Get Your Personal Demo</h3>
            <form onSubmit={handleContactSubmit}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 mb-2">Quick questions:</div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.message)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask anything about StackPro..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          Powered by AWS Bedrock AI ✨
        </div>
      </div>
    </div>
  )
}
