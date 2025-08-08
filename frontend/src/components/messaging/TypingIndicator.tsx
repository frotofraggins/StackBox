import React from 'react';
import { motion } from 'framer-motion';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  glass: string;
}

interface TypingIndicatorProps {
  users: string[];
  theme: Theme;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users,
  theme,
  className = ''
}) => {
  if (users.length === 0) {
    return null;
  }

  const formatTypingUsers = (users: string[]) => {
    if (users.length === 1) {
      return `${users[0]} is typing`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center space-x-3 px-4 py-2 rounded-xl text-sm ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.05) 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
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
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <motion.span 
        className="text-white/80 italic font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {formatTypingUsers(users)}...
      </motion.span>
    </motion.div>
  );
};

export default TypingIndicator;
