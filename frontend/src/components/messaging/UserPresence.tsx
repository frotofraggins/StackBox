import React from 'react';
import { motion } from 'framer-motion';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  glass: string;
}

interface UserPresenceProps {
  users: string[];
  onlineUsers: Record<string, boolean>;
  theme: Theme;
  showCount?: boolean;
  maxDisplay?: number;
  className?: string;
}

export const UserPresence: React.FC<UserPresenceProps> = ({
  users,
  onlineUsers,
  theme,
  showCount = true,
  maxDisplay = 5,
  className = ''
}) => {
  const onlineUserList = users.filter(userId => onlineUsers[userId]);
  const offlineUserList = users.filter(userId => !onlineUsers[userId]);
  
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  const getStatusColor = (userId: string) => {
    return onlineUsers[userId] ? 'bg-green-500' : 'bg-gray-400';
  };

  const getStatusText = (userId: string) => {
    return onlineUsers[userId] ? 'Online' : 'Offline';
  };

  return (
    <motion.div 
      className={`flex items-center space-x-3 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
    >
      {/* Enhanced User Avatars with Status */}
      <div className="flex -space-x-2">
        {displayUsers.map((userId, index) => (
          <motion.div
            key={userId}
            className="relative group cursor-pointer"
            title={`${userId} - ${getStatusText(userId)}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.1,
              zIndex: 10,
              transition: { duration: 0.2 }
            }}
          >
            <motion.div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/20 shadow-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                fontFamily: theme.font
              }}
              whileHover={{
                boxShadow: `0 8px 32px ${theme.primary}40`
              }}
            >
              {userId.charAt(0).toUpperCase()}
              
              {/* Glassmorphism overlay */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)`,
                  backdropFilter: 'blur(10px)'
                }}
              />
            </motion.div>
            
            {/* Enhanced Status Indicator */}
            <motion.div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-lg ${getStatusColor(userId)}`}
              animate={onlineUsers[userId] ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              } : {}}
              transition={onlineUsers[userId] ? {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              } : {}}
            />
            
            {/* Enhanced Glassmorphism Tooltip */}
            <motion.div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 text-xs text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 min-w-max"
              style={{
                background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(0, 0, 0, 0.8) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                fontFamily: theme.font
              }}
              initial={{ y: 10, opacity: 0 }}
              whileHover={{ y: 0, opacity: 1 }}
            >
              <div className="font-semibold">{userId}</div>
              <div className="text-xs opacity-80 flex items-center space-x-1 mt-1">
                <motion.div 
                  className={`w-2 h-2 rounded-full ${getStatusColor(userId)}`}
                  animate={onlineUsers[userId] ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>{getStatusText(userId)}</span>
              </div>
              
              {/* Tooltip arrow */}
              <div 
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${theme.primary}40`
                }}
              />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Enhanced Remaining Users Count */}
        {remainingCount > 0 && (
          <motion.div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/20 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${theme.glass} 0%, rgba(255, 255, 255, 0.1) 100%)`,
              backdropFilter: 'blur(10px)',
              fontFamily: theme.font
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: displayUsers.length * 0.1 + 0.2 }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 8px 32px ${theme.primary}30`
            }}
          >
            +{remainingCount}
          </motion.div>
        )}
      </div>

      {/* Enhanced Status Summary */}
      {showCount && (
        <motion.div 
          className="text-sm font-medium"
          style={{ fontFamily: theme.font }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-4">
            {onlineUserList.length > 0 && (
              <motion.div 
                className="flex items-center space-x-2 text-white/80"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-3 h-3 bg-green-400 rounded-full shadow-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span>{onlineUserList.length} online</span>
              </motion.div>
            )}
            {offlineUserList.length > 0 && (
              <motion.div 
                className="flex items-center space-x-2 text-white/60"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-3 h-3 bg-gray-400 rounded-full shadow-lg" />
                <span>{offlineUserList.length} offline</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UserPresence;
