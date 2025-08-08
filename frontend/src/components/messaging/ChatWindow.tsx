import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { UserPresence } from './UserPresence';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../hooks/useNotification';

interface ChatWindowProps {
  channelId: string;
  userId: string;
  clientId: string;
  industry?: 'law' | 'realestate' | 'healthcare' | 'tech' | 'finance';
  onClose?: () => void;
  className?: string;
}

interface Message {
  messageId: string;
  channelId: string;
  userId: string;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  timestamp: string;
  reactions: Record<string, string[]>;
  threadId?: string;
  attachments?: any[];
  edited: boolean;
  deleted: boolean;
}

interface Channel {
  channelId: string;
  name: string;
  description: string;
  channelType: 'public' | 'private' | 'dm' | 'document';
  members: string[];
  settings: {
    allowFiles: boolean;
    allowReactions: boolean;
    allowThreads: boolean;
  };
}

const industryThemes = {
  law: {
    primary: '#D4AF37', // Gold
    secondary: '#1A1A2E',
    accent: '#16213E',
    font: 'Georgia, serif',
    glass: 'rgba(212, 175, 55, 0.1)'
  },
  realestate: {
    primary: '#2E8B57', // Sea Green
    secondary: '#1E3A8A',
    accent: '#059669',
    font: 'Inter, sans-serif',
    glass: 'rgba(46, 139, 87, 0.1)'
  },
  healthcare: {
    primary: '#0EA5E9', // Sky Blue
    secondary: '#1E293B',
    accent: '#0284C7',
    font: 'Inter, sans-serif',
    glass: 'rgba(14, 165, 233, 0.1)'
  },
  tech: {
    primary: '#8B5CF6', // Purple
    secondary: '#0F172A',
    accent: '#7C3AED',
    font: 'JetBrains Mono, monospace',
    glass: 'rgba(139, 92, 246, 0.1)'
  },
  finance: {
    primary: '#059669', // Emerald
    secondary: '#1F2937',
    accent: '#047857',
    font: 'Inter, sans-serif',
    glass: 'rgba(5, 150, 105, 0.1)'
  }
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  channelId,
  userId,
  clientId,
  industry = 'tech',
  onClose,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  const messageListRef = useRef<HTMLDivElement>(null);
  const { showNotification } = useNotification();
  const theme = industryThemes[industry];

  // WebSocket connection
  const {
    connected,
    sendMessage: sendWebSocketMessage,
    lastMessage
  } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL}?userId=${userId}&clientId=${clientId}`,
    onOpen: () => {
      console.log('WebSocket connected');
      sendWebSocketMessage({
        action: 'joinChannel',
        channelId
      });
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('Connection failed. Please try again.');
    }
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const message = JSON.parse(lastMessage.data);
    
    switch (message.type) {
      case 'message':
        setMessages(prev => [...prev, message.message]);
        scrollToBottom();
        
        if (message.message.userId !== userId) {
          showNotification({
            title: `New message in ${channel?.name || 'Channel'}`,
            body: message.message.content,
            type: 'info'
          });
        }
        break;
        
      case 'channelJoined':
        setChannel(message.channel);
        setMessages(message.messages || []);
        setLoading(false);
        scrollToBottom();
        break;
        
      case 'typing':
        if (message.userId !== userId) {
          if (message.isTyping) {
            setTypingUsers(prev => {
              if (!prev.includes(message.userId)) {
                return [...prev, message.userId];
              }
              return prev;
            });
          } else {
            setTypingUsers(prev => prev.filter(u => u !== message.userId));
          }
        }
        break;
        
      case 'presenceUpdate':
        setOnlineUsers(prev => ({
          ...prev,
          [message.userId]: message.status === 'online'
        }));
        break;
        
      case 'error':
        setError(message.error);
        break;
    }
  }, [lastMessage, userId, channel?.name, showNotification]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [channelId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messaging/channels/${channelId}/messages?limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-id': clientId,
          'x-user-id': userId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        throw new Error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, type: string = 'text', attachments: any[] = []) => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      sendWebSocketMessage({
        action: 'sendMessage',
        channelId,
        content,
        messageType: type,
        attachments
      });

      const response = await fetch(`/api/messaging/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-id': clientId,
          'x-user-id': userId
        },
        body: JSON.stringify({
          content,
          type,
          attachments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification({
        title: 'Error',
        body: 'Failed to send message. Please try again.',
        type: 'error'
      });
    }
  };

  const handleTyping = (isTyping: boolean) => {
    sendWebSocketMessage({
      action: 'typing',
      channelId,
      isTyping
    });
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-client-id': clientId,
          'x-user-id': userId
        },
        body: JSON.stringify({
          channelId,
          emoji
        })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => {
          if (msg.messageId === messageId) {
            const reactions = { ...msg.reactions };
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            if (!reactions[emoji].includes(userId)) {
              reactions[emoji].push(userId);
            }
            return { ...msg, reactions };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center justify-center h-96 rounded-2xl shadow-2xl ${className}`}
        style={{
          background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.1)`,
          fontFamily: theme.font
        }}
      >
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${theme.primary} transparent transparent transparent` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-white/80 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Loading conversation...
          </motion.p>
          <motion.div
            className="mt-2 flex space-x-1 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.primary }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center h-96 rounded-2xl shadow-2xl ${className}`}
        style={{
          background: `linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(239, 68, 68, 0.2)`,
          fontFamily: theme.font
        }}
      >
        <div className="text-center">
          <motion.div 
            className="text-red-400 text-4xl mb-4"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚠️
          </motion.div>
          <p className="text-red-300 mb-6 text-lg font-medium">{error}</p>
          <motion.button
            onClick={() => {
              setError(null);
              loadMessages();
            }}
            className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
              boxShadow: `0 8px 32px ${theme.primary}40`
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 12px 40px ${theme.primary}60`
            }}
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col h-full rounded-2xl shadow-2xl overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        fontFamily: theme.font
      }}
    >
      {/* Enhanced Chat Header */}
      <motion.div 
        className="flex items-center justify-between p-6 border-b border-white/10"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}20 0%, rgba(255, 255, 255, 0.05) 100%)`
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="font-bold text-xl text-white">
              {channel?.name || 'Loading...'}
            </h3>
            <motion.div 
              className={`w-3 h-3 rounded-full shadow-lg ${connected ? 'bg-green-400' : 'bg-red-400'}`}
              animate={{ 
                scale: connected ? [1, 1.2, 1] : 1,
                opacity: connected ? [1, 0.7, 1] : 0.7
              }}
              transition={{ 
                duration: 2, 
                repeat: connected ? Infinity : 0 
              }}
            />
          </motion.div>
          {channel?.description && (
            <motion.p 
              className="text-white/70 text-sm max-w-xs truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {channel.description}
            </motion.p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <UserPresence 
            users={channel?.members || []} 
            onlineUsers={onlineUsers}
            theme={theme}
          />
          {onClose && (
            <motion.button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl font-bold p-2 rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.1)'
              }}
              whileHover={{ 
                scale: 1.1,
                background: 'rgba(255, 255, 255, 0.2)'
              }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Enhanced Messages Area */}
      <motion.div
        ref={messageListRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ 
          maxHeight: 'calc(100vh - 200px)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <MessageList
          messages={messages}
          currentUserId={userId}
          onAddReaction={addReaction}
          onReply={(messageId) => {
            console.log('Reply to message:', messageId);
          }}
          theme={theme}
        />
      </motion.div>

      {/* Enhanced Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            className="px-6 pb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TypingIndicator users={typingUsers} theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Message Input */}
      <motion.div 
        className="border-t border-white/10"
        style={{
          background: `linear-gradient(135deg, ${theme.primary}10 0%, rgba(255, 255, 255, 0.03) 100%)`
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <MessageInput
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          disabled={!connected}
          allowFiles={channel?.settings.allowFiles}
          placeholder={connected ? 'Type your message...' : 'Connecting...'}
          theme={theme}
        />
      </motion.div>
    </motion.div>
  );
};

export default ChatWindow;
