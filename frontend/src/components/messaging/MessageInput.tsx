import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  glass: string;
}

interface MessageInputProps {
  onSendMessage: (content: string, type?: string, attachments?: any[]) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  allowFiles?: boolean;
  placeholder?: string;
  theme: Theme;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  allowFiles = true,
  placeholder = 'Type a message...',
  theme
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        onTyping(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, onTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || disabled) {
      return;
    }

    // Process attachments
    const processedAttachments = attachments.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file) // Temporary URL for preview
    }));

    const messageType = attachments.length > 0 ? 
      (attachments[0].type.startsWith('image/') ? 'image' : 'file') : 
      'text';

    onSendMessage(message.trim(), messageType, processedAttachments);

    // Clear input
    setMessage('');
    setAttachments([]);
    setIsTyping(false);
    onTyping(false);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Basic file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      return file.size <= maxSize;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    
    // Clear input
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 space-y-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-surface-2 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <div className="text-secondary">
                  {file.type.startsWith('image/') ? '🖼️' : '📎'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeAttachment(index)}
                className="text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* File Upload Button */}
        {allowFiles && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 text-gray-400 hover:text-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Text Input */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-surface-2 disabled:cursor-not-allowed
              placeholder-gray-400
            `}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className={`
            p-2 rounded-lg transition-colors duration-200
            ${disabled || (!message.trim() && attachments.length === 0)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-secondary text-white hover:bg-secondary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
          title="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>

      {/* Message Formatting Help */}
      <div className="mt-2 text-xs text-gray-400">
        Press Enter to send, Shift+Enter for new line
        {allowFiles && ' • Click 📎 to attach files'}
      </div>
    </div>
  );
};

export default MessageInput;
