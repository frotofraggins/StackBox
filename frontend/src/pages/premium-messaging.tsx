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
    userId: 'sarah.chen',
    content: 'Welcome to the new StackPro unified messaging system! 🚀',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: { '🚀': ['mike.wilson', 'alex.jones'], '💙': ['david.smith'] }
  },
  {
    messageId: 'msg2',
    userId: 'mike.wilson', 
    content: 'The Electric Indigo and Aqua Sky design is absolutely stunning! This looks so professional and modern.',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    reactions: { '⚡': ['sarah.chen', 'alex.jones'], '🎨': ['david.smith'] }
  },
  {
    messageId: 'msg3',
    userId: 'alex.jones',
    content: 'I love the unified premium aesthetic. This positions us perfectly against the competition.',
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    reactions: { '💎': ['sarah.chen'], '🔥': ['mike.wilson'] }
  },
  {
    messageId: 'msg4',
    userId: 'david.smith',
    content: 'The glassmorphism effects with these colors create such depth and visual appeal!',
    timestamp: new Date(Date.now() - 2500000).toISOString(),
    reactions: { '✨': ['sarah.chen', 'mike.wilson', 'alex.jones'] }
  }
];

export default function PremiumMessaging() {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      messageId: 'demo-' + Date.now(),
      userId: 'demo-user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      reactions: {}
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate AI response
    setTimeout(() => {
      setTypingUsers(['StackPro AI']);
      setTimeout(() => {
        setTypingUsers([]);
        const responses = [
          "Excellent message! The premium interface is working beautifully! ⚡",
          "I love how the Electric Indigo creates such a modern, trustworthy feel! 💙", 
          "This messaging system perfectly balances innovation with professionalism! 🚀",
          "The glassmorphism effects with our color palette are absolutely perfect! ✨"
        ];
        const response: Message = {
          messageId: 'ai-' + Date.now(),
          userId: 'StackPro AI',
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-6xl font-bold text-text-light mb-4"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            StackPro Premium Messaging
          </motion.h1>
          <motion.p 
            className="text-text-light/80 text-xl mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Experience the future of business communication with our unified premium design
          </motion.p>
          
          {/* Premium Badge */}
          <motion.div
            className="inline-flex items-center px-8 py-4 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse mr-3"></div>
            <span className="text-text-light font-semibold">Electric Indigo × Aqua Sky Design System</span>
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse ml-3"></div>
          </motion.div>
        </div>

        {/* Demo Chat Interface */}
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="bg-surface rounded-3xl p-8 mb-8 shadow-2xl border border-border"
            style={{
              backdropFilter: 'blur(20px)'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Chat Header */}
            <motion.div 
              className="flex items-center justify-between p-6 mb-6 rounded-2xl bg-primary/10 border border-primary/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-4 h-4 bg-primary rounded-full shadow-lg"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0.7)', '0 0 0 10px rgba(99, 102, 241, 0)', '0 0 0 0 rgba(99, 102, 241, 0)']
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity 
                  }}
                />
                <h3 className="font-bold text-2xl text-text-light">Team Collaboration</h3>
                <div className="px-3 py-1 bg-success/20 text-success text-sm rounded-full font-medium border border-success/30">
                  Online
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {['sarah.chen', 'mike.wilson', 'alex.jones', 'david.smith'].map((user, index) => (
                  <motion.div
                    key={user}
                    className="relative group cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-primary/30 shadow-lg relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, #6366F1 ${index * 25}%, #22D3EE ${100 - index * 25}%)`
                      }}
                    >
                      {user.split('.')[0].charAt(0).toUpperCase()}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </div>
                    
                    {/* Status indicator */}
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-surface"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                    />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-surface-dark text-text-light text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border">
                      {user.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')}
                    </div>
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
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <div className={`max-w-lg ${message.userId === 'demo-user' ? 'ml-auto' : 'mr-auto'}`}>
                      {message.userId !== 'demo-user' && (
                        <div className="text-xs text-text-light/60 mb-2 font-medium ml-4">
                          {message.userId === 'StackPro AI' ? (
                            <span className="inline-flex items-center">
                              <div className="w-2 h-2 bg-accent rounded-full mr-2 animate-pulse"></div>
                              {message.userId}
                            </span>
                          ) : (
                            message.userId.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
                          )}
                        </div>
                      )}
                      
                      <motion.div
                        className={`px-6 py-4 rounded-2xl shadow-lg text-text-light relative overflow-hidden ${
                          message.userId === 'demo-user' 
                            ? 'bg-primary text-white' 
                            : message.userId === 'StackPro AI'
                            ? 'bg-accent/20 border border-accent/30'
                            : 'bg-surface-light border border-border'
                        }`}
                        style={{
                          backdropFilter: 'blur(10px)'
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Glassmorphism overlay for user messages */}
                        {message.userId === 'demo-user' && (
                          <div 
                            className="absolute inset-0 rounded-2xl"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            }}
                          />
                        )}
                        
                        <div className="relative z-10">
                          <div className="text-sm leading-relaxed">{message.content}</div>
                          <div className={`text-xs mt-3 ${
                            message.userId === 'demo-user' ? 'text-white/70' : 'text-text-light/50'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </motion.div>

                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 ml-4">
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <motion.button
                              key={emoji}
                              onClick={() => addReaction(message.messageId, emoji)}
                              className="px-3 py-1 text-xs rounded-full bg-surface border border-border text-text-light hover:bg-primary/20 hover:border-primary/40 transition-all duration-200"
                              style={{ backdropFilter: 'blur(10px)' }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {emoji} {users.length}
                            </motion.button>
                          ))}
                          <motion.button
                            onClick={() => addReaction(message.messageId, '👍')}
                            className="px-3 py-1 text-xs rounded-full bg-surface/50 border border-border text-text-light/60 hover:text-text-light hover:border-accent/40 transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
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
                      className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-accent/10 border border-accent/30"
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-accent rounded-full"
                            animate={{
                              scale: [1, 1.4, 1],
                              opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-text-light/80 italic text-sm font-medium">
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
                <motion.input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-6 py-4 rounded-2xl bg-surface-light border border-border text-text-light placeholder-text-light/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  style={{ backdropFilter: 'blur(10px)' }}
                  whileFocus={{ scale: 1.02 }}
                />
              </div>
              <motion.button
                type="submit"
                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                disabled={!newMessage.trim()}
              >
                Send
              </motion.button>
            </form>
          </motion.div>

          {/* Premium Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🚀', title: 'Modern Innovation', desc: 'Electric Indigo represents cutting-edge technology and forward-thinking solutions', color: 'primary' },
              { icon: '💎', title: 'Premium Quality', desc: 'Glassmorphism effects create depth and sophistication that commands respect', color: 'accent' },
              { icon: '🔒', title: 'Enterprise Trust', desc: 'Professional color palette builds confidence and reliability with business clients', color: 'success' },
              { icon: '⚡', title: 'Performance Focus', desc: 'Optimized animations and interactions that feel instant and responsive', color: 'warning' },
              { icon: '🎨', title: 'Visual Excellence', desc: 'Every detail crafted to create a cohesive, premium user experience', color: 'info' },
              { icon: '🌟', title: 'Competitive Edge', desc: 'Stand out from generic solutions with distinctive, memorable branding', color: 'primary' }
            ].map((feature, index) => (
              <motion.div 
                key={feature.title}
                className="bg-surface rounded-2xl p-6 text-text-light border border-border hover:border-primary/40 transition-all duration-300"
                style={{ backdropFilter: 'blur(10px)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-xl mb-3 text-text-light">
                  {feature.title}
                </h3>
                <p className="text-text-light/80 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
