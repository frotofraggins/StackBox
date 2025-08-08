import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  messageId: string;
  userId: string;
  content: string;
  timestamp: string;
  reactions: Record<string, string[]>;
}

const mockMessages: Message[] = [
  {
    messageId: 'msg1',
    userId: 'john.doe',
    content: 'Welcome to the new StackPro messaging system! 🎉',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: { '👍': ['jane.smith'], '🎉': ['mike.wilson', 'sarah.jones'] }
  },
  {
    messageId: 'msg2',
    userId: 'jane.smith', 
    content: 'This glassmorphism design looks absolutely stunning! The animations are so smooth.',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    reactions: { '❤️': ['john.doe', 'mike.wilson'] }
  },
  {
    messageId: 'msg3',
    userId: 'mike.wilson',
    content: 'I love how each industry gets its own themed colors. The law firm gold theme is particularly elegant.',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    reactions: { '✨': ['john.doe'] }
  }
];

const industryThemes = {
  law: {
    primary: '#D4AF37',
    secondary: '#1A1A2E', 
    accent: '#16213E',
    font: 'Georgia, serif',
    glass: 'rgba(212, 175, 55, 0.1)'
  },
  realestate: {
    primary: '#2E8B57',
    secondary: '#1E3A8A',
    accent: '#059669', 
    font: 'Inter, sans-serif',
    glass: 'rgba(46, 139, 87, 0.1)'
  },
  healthcare: {
    primary: '#0EA5E9',
    secondary: '#1E293B',
    accent: '#0284C7',
    font: 'Inter, sans-serif', 
    glass: 'rgba(14, 165, 233, 0.1)'
  },
  tech: {
    primary: '#8B5CF6',
    secondary: '#0F172A',
    accent: '#7C3AED',
    font: 'JetBrains Mono, monospace',
    glass: 'rgba(139, 92, 246, 0.1)'
  },
  finance: {
    primary: '#059669',
    secondary: '#1F2937',
    accent: '#047857',
    font: 'Inter, sans-serif',
    glass: 'rgba(5, 150, 105, 0.1)'
  }
};

const industries = [
  { id: 'law', name: 'Law Firm', description: 'Elegant gold theme with serif typography' },
  { id: 'realestate', name: 'Real Estate', description: 'Professional green with clean sans-serif' },
  { id: 'healthcare', name: 'Healthcare', description: 'Trustworthy blue with modern fonts' },
  { id: 'tech', name: 'Tech Startup', description: 'Innovative purple with monospace accents' },
  { id: 'finance', name: 'Financial Services', description: 'Sophisticated emerald with corporate styling' }
];

export default function DemoMessaging() {
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof industryThemes>('tech');
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const theme = industryThemes[selectedIndustry];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      messageId: 'demo-' + Date.now(),
      userId: 'demo-user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate typing response
    setTimeout(() => {
      setTypingUsers(['AI Assistant']);
      setTimeout(() => {
        setTypingUsers([]);
        const responses = [
          "Great message! The glassmorphism interface is working beautifully! ✨",
          "I love the smooth animations and industry-specific theming! 🎨", 
          "This messaging system feels so professional and modern! 💼",
          "The frosted glass effects create such an elegant experience! 🔮"
        ];
        const response = {
          messageId: 'ai-' + Date.now(),
          userId: 'AI Assistant',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          reactions: {}
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }, 500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.messageId === messageId) {
        const reactions = { ...msg.reactions };
        if (!reactions[emoji]) reactions[emoji] = [];
        if (!reactions[emoji].includes('demo-user')) {
          reactions[emoji].push('demo-user');
        }
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            StackPro Messaging System
          </motion.h1>
          <motion.p 
            className="text-white/80 text-xl mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Experience the glassmorphism interface with industry-specific theming
          </motion.p>
          
          {/* Industry Theme Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {industries.map((industry, index) => (
              <motion.button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id as keyof typeof industryThemes)}
                className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                  selectedIndustry === industry.id
                    ? 'bg-white/20 text-white border-2 border-white/40 scale-105'
                    : 'bg-white/10 text-white/70 border-2 border-white/20 hover:bg-white/15'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-sm font-bold">{industry.name}</div>
                <div className="text-xs opacity-80">{industry.description}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Demo Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="rounded-3xl p-8 mb-8 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {/* Chat Header */}
            <motion.div 
              className="flex items-center justify-between p-4 mb-6 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}20 0%, rgba(255, 255, 255, 0.05) 100%)`,
                fontFamily: theme.font
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center space-x-4">
                <h3 className="font-bold text-xl text-white">Project Discussion</h3>
                <motion.div 
                  className="w-3 h-3 bg-green-400 rounded-full shadow-lg"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity 
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                {['john.doe', 'jane.smith', 'mike.wilson'].map((user, index) => (
                  <motion.div
                    key={user}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/20 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    {user.charAt(0).toUpperCase()}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto space-y-4 mb-6 px-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.messageId}
                    className={`flex ${message.userId === 'demo-user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className={`max-w-sm lg:max-w-md ${message.userId === 'demo-user' ? 'ml-auto' : 'mr-auto'}`}>
                      {message.userId !== 'demo-user' && (
                        <div className="text-xs text-white/60 mb-1 font-medium" style={{ fontFamily: theme.font }}>
                          {message.userId}
                        </div>
                      )}
                      
                      <motion.div
                        className={`px-4 py-3 rounded-2xl shadow-lg ${
                          message.userId === 'demo-user' 
                            ? 'text-white' 
                            : 'text-white'
                        }`}
                        style={{
                          background: message.userId === 'demo-user' 
                            ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`
                            : `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.1) 100%)`,
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontFamily: theme.font
                        }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-2 ${
                          message.userId === 'demo-user' ? 'text-white/70' : 'text-white/50'
                        }`}>
                          {formatTime(message.timestamp)}
                        </div>
                      </motion.div>

                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="flex space-x-1 mt-2">
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <motion.button
                              key={emoji}
                              onClick={() => addReaction(message.messageId, emoji)}
                              className="px-2 py-1 text-xs rounded-full transition-all duration-200"
                              style={{
                                background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.1) 100%)`,
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {emoji} {users.length}
                            </motion.button>
                          ))}
                          <motion.button
                            onClick={() => addReaction(message.messageId, '👍')}
                            className="px-2 py-1 text-xs rounded-full text-white/60 hover:text-white transition-all duration-200"
                            style={{
                              background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            +
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <motion.div 
                      className="flex items-center space-x-3 px-4 py-2 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontFamily: theme.font
                      }}
                    >
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.15
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-white/80 italic text-sm">
                        {typingUsers[0]} is typing...
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/60 border-none outline-none"
                  style={{
                    background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontFamily: theme.font
                  }}
                />
              </div>
              <motion.button
                type="submit"
                className="p-3 rounded-xl text-white font-semibold transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                  boxShadow: `0 8px 32px ${theme.primary}40`
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: `0 12px 40px ${theme.primary}60`
                }}
                whileTap={{ scale: 0.95 }}
                disabled={!newMessage.trim()}
              >
                Send
              </motion.button>
            </form>
          </motion.div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔮', title: 'Glassmorphism Design', desc: 'Premium frosted glass effects with layered transparency' },
              { icon: '🎭', title: 'Industry Theming', desc: 'Custom color schemes and typography for different verticals' },
              { icon: '⚡', title: 'Framer Motion', desc: 'Smooth animations and micro-interactions throughout' },
              { icon: '🔒', title: 'Enterprise Security', desc: 'Complete client isolation with AWS infrastructure' },
              { icon: '🚀', title: 'Real-time Updates', desc: 'WebSocket-powered live messaging with typing indicators' },
              { icon: '📱', title: 'Multi-platform', desc: 'Responsive design with mobile-first approach' }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="text-white p-6 rounded-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: theme.font }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-white/80">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
