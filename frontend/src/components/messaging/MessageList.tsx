import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  glass: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onReply: (messageId: string) => void;
  theme: Theme;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onAddReaction,
  onReply,
  theme
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const renderReactions = (reactions: Record<string, string[]>, messageId: string) => {
    const reactionEntries = Object.entries(reactions).filter(([_, users]) => users.length > 0);
    
    if (reactionEntries.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {reactionEntries.map(([emoji, users]) => (
          <button
            key={emoji}
            onClick={() => onAddReaction(messageId, emoji)}
            className={`
              inline-flex items-center px-2 py-1 text-xs rounded-full border transition-colors
              ${users.includes(currentUserId)
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-surface-2 border-gray-300 text-muted hover:bg-gray-200'
              }
            `}
          >
            <span className="mr-1">{emoji}</span>
            <span>{users.length}</span>
          </button>
        ))}
        <button
          onClick={() => {
            // Show emoji picker - simplified for now
            const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
            const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            onAddReaction(messageId, selectedEmoji);
          }}
          className="inline-flex items-center px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-400 hover:text-muted hover:bg-surface-2"
        >
          +
        </button>
      </div>
    );
  };

  const renderMessageContent = (message: Message) => {
    if (message.deleted) {
      return (
        <div className="text-gray-400 italic">
          This message has been deleted
        </div>
      );
    }

    switch (message.messageType) {
      case 'system':
        return (
          <div className="text-center text-sm text-gray-500 bg-surface-2 rounded-lg px-3 py-2">
            {message.content}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div>{message.content}</div>
            {message.attachments?.map((attachment, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-3 bg-surface-2">
                <div className="flex items-center space-x-2">
                  <div className="text-secondary">📎</div>
                  <div>
                    <div className="font-medium text-sm">{attachment.name}</div>
                    <div className="text-xs text-gray-500">{attachment.size} bytes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <div>{message.content}</div>
            {message.attachments?.map((attachment, index) => (
              <img
                key={index}
                src={attachment.url}
                alt={attachment.name}
                className="max-w-xs rounded-lg shadow"
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {message.edited && (
              <span className="text-xs text-gray-400 ml-2">(edited)</span>
            )}
          </div>
        );
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: messageDate,
          messages: [message]
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  };

  const renderDateSeparator = (date: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let displayDate = date;
    if (date === today) {
      displayDate = 'Today';
    } else if (date === yesterday) {
      displayDate = 'Yesterday';
    } else {
      displayDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return (
      <div className="flex items-center justify-center my-4">
        <div className="bg-gray-200 text-muted text-xs px-3 py-1 rounded-full">
          {displayDate}
        </div>
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>No messages yet</p>
          <p className="text-sm">Be the first to say something!</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="space-y-1">
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {renderDateSeparator(group.date)}
          
          {group.messages.map((message, index) => {
            const isCurrentUser = message.userId === currentUserId;
            const showAvatar = index === 0 || 
              group.messages[index - 1].userId !== message.userId;
            
            return (
              <div
                key={message.messageId}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {showAvatar && !isCurrentUser && (
                    <div className="flex-shrink-0 mr-2">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.userId.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div className={`
                    relative px-4 py-2 rounded-lg
                    ${isCurrentUser 
                      ? 'bg-secondary text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                    }
                    ${message.messageType === 'system' ? 'mx-auto' : ''}
                  `}>
                    {/* User name for non-current users */}
                    {!isCurrentUser && showAvatar && message.messageType !== 'system' && (
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {message.userId}
                      </div>
                    )}
                    
                    {/* Message content */}
                    <div className={message.messageType === 'system' ? '' : 'text-sm'}>
                      {renderMessageContent(message)}
                    </div>
                    
                    {/* Timestamp */}
                    {message.messageType !== 'system' && (
                      <div className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                    
                    {/* Thread indicator */}
                    {message.threadId && (
                      <button
                        onClick={() => onReply(message.messageId)}
                        className={`text-xs mt-1 underline ${
                          isCurrentUser ? 'text-blue-100' : 'text-secondary'
                        }`}
                      >
                        View thread
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Reactions (outside the bubble) */}
                {message.messageType !== 'system' && (
                  <div className={`mt-1 ${isCurrentUser ? 'mr-2' : 'ml-2'}`}>
                    {renderReactions(message.reactions, message.messageId)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
