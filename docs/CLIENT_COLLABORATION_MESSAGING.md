# StackPro Client Collaboration & Messaging Architecture
## Secure Real-Time Communication System

### 🎯 **Executive Summary**
This document outlines the architecture for implementing secure, scoped real-time communication between business owners and their clients within each StackPro portal, including file collaboration and messaging systems.

---

## 🏗️ **Architecture Overview**

### **Core Components:**
1. **WebSocket Gateway** - Real-time messaging infrastructure
2. **Message Broker (Redis/SQS)** - Event distribution and queuing
3. **Notification System** - Multi-channel alerts (email, push, in-app)
4. **File Collaboration** - Shared documents and commenting
5. **Presence System** - Online status and typing indicators
6. **Security Layer** - Client isolation and permission management

---

## 💬 **Real-Time Messaging Architecture**

### **1. WebSocket + API Gateway Pattern**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   API Gateway    │    │   Lambda        │
│   (WebSocket)   ├────┤   WebSocket API  ├────┤   Connection    │
└─────────────────┘    │                  │    │   Handler       │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   DynamoDB       │    │   Redis Cluster │
                       │   Connections    ├────┤   Message       │
                       │   & Messages     │    │   Broker        │
                       └──────────────────┘    └─────────────────┘
```

### **2. Connection Management**
```javascript
// WebSocket connection handler
const handleConnect = async (event) => {
  const { connectionId } = event.requestContext;
  const { clientId, userId } = parseToken(event.queryStringParameters.token);
  
  // Store connection metadata
  await dynamodb.put({
    TableName: 'StackPro-Connections',
    Item: {
      connectionId,
      clientId,
      userId,
      connectedAt: Date.now(),
      ttl: Math.floor(Date.now() / 1000) + 86400 // 24 hours
    }
  }).promise();
  
  // Join client-specific channel
  await redis.sadd(`client:${clientId}:connections`, connectionId);
  
  return { statusCode: 200 };
};

// Message routing
const routeMessage = async (event) => {
  const { connectionId, routeKey } = event.requestContext;
  const message = JSON.parse(event.body);
  
  // Validate sender permissions
  const connection = await getConnection(connectionId);
  await validateMessagePermissions(connection, message);
  
  // Route to appropriate handler
  switch (message.type) {
    case 'CHAT_MESSAGE':
      return await handleChatMessage(connection, message);
    case 'FILE_COMMENT':
      return await handleFileComment(connection, message);
    case 'TYPING_INDICATOR':
      return await handleTypingIndicator(connection, message);
    default:
      return { statusCode: 400, body: 'Unknown message type' };
  }
};
```

---

## 🔐 **Security & Client Isolation**

### **1. Message Scoping Strategy**
```javascript
const validateMessagePermissions = async (connection, message) => {
  const { clientId, userId } = connection;
  const { targetChannel, targetUser } = message;
  
  // Ensure all communication stays within client boundary
  if (targetChannel && !targetChannel.startsWith(`client:${clientId}:`)) {
    throw new Error('Cross-client communication not allowed');
  }
  
  // Verify user has access to target conversation
  const hasAccess = await checkConversationAccess(
    userId, 
    clientId, 
    message.conversationId
  );
  
  if (!hasAccess) {
    throw new Error('Access denied to conversation');
  }
  
  return true;
};

// Client-scoped channel naming
const getChannelName = (clientId, type, id) => {
  return `client:${clientId}:${type}:${id}`;
};

// Examples:
// client:123:general - General chat for client 123
// client:123:project:456 - Project-specific chat
// client:123:file:789 - File comments thread
```

### **2. Multi-Level Permissions**
```javascript
const permissionLevels = {
  OWNER: {
    canCreateChannels: true,
    canInviteUsers: true,
    canDeleteMessages: true,
    canAccessAllFiles: true
  },
  ADMIN: {
    canCreateChannels: true,
    canInviteUsers: true,
    canDeleteMessages: false,
    canAccessAllFiles: true
  },
  USER: {
    canCreateChannels: false,
    canInviteUsers: false,
    canDeleteMessages: false,
    canAccessAllFiles: false
  }
};

const checkUserPermission = async (userId, clientId, action) => {
  const userRole = await getUserRole(userId, clientId);
  const permissions = permissionLevels[userRole];
  
  return permissions[action] || false;
};
```

---

## 💬 **Chat System Implementation**

### **1. Message Schema**
```javascript
// DynamoDB message schema
{
  "PK": "CLIENT#123",
  "SK": "CONVERSATION#456#MESSAGE#789",
  "conversationId": "456",
  "messageId": "789",
  "senderId": "user-123",
  "senderName": "John Smith",
  "content": {
    "text": "Here are the updated contracts",
    "type": "text", // text, file, image, system
    "attachments": [
      {
        "id": "file-123",
        "name": "contract.pdf",
        "url": "https://s3.../client-123/files/contract.pdf",
        "size": 1024576,
        "mimeType": "application/pdf"
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "edited": false,
  "reactions": {
    "👍": ["user-456"],
    "❤️": ["user-789"]
  },
  "threadCount": 3,
  "lastActivity": "2025-01-15T11:00:00Z"
}
```

### **2. Real-Time Message Broadcasting**
```javascript
const broadcastMessage = async (clientId, conversationId, message) => {
  // Get all connections for this client
  const connections = await redis.smembers(`client:${clientId}:connections`);
  
  // Filter connections that have access to this conversation
  const authorizedConnections = await Promise.all(
    connections.map(async (connectionId) => {
      const connection = await getConnection(connectionId);
      const hasAccess = await checkConversationAccess(
        connection.userId, 
        clientId, 
        conversationId
      );
      return hasAccess ? connectionId : null;
    })
  ).then(results => results.filter(Boolean));
  
  // Send to all authorized connections
  const apiGateway = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_API_ENDPOINT
  });
  
  await Promise.all(
    authorizedConnections.map(async (connectionId) => {
      try {
        await apiGateway.postToConnection({
          ConnectionId: connectionId,
          Data: JSON.stringify({
            type: 'NEW_MESSAGE',
            data: message
          })
        }).promise();
      } catch (error) {
        if (error.statusCode === 410) {
          // Connection is stale, remove it
          await cleanupStaleConnection(connectionId);
        }
      }
    })
  );
};
```

---

## 📁 **File Collaboration System**

### **1. File Comments & Annotations**
```javascript
// Frontend component for file commenting
const FileCommentSystem = ({ fileId, clientId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const addComment = async () => {
    const comment = {
      type: 'FILE_COMMENT',
      fileId,
      content: newComment,
      position: selectedPosition, // For PDF annotations
      timestamp: new Date().toISOString()
    };
    
    // Send via WebSocket
    websocket.send(JSON.stringify(comment));
    
    // Optimistically update UI
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };
  
  return (
    <div className="file-comments">
      <div className="comments-list">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
      <div className="add-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={addComment}>Send</button>
      </div>
    </div>
  );
};
```

### **2. File Sharing & Permissions**
```javascript
const shareFile = async (fileId, clientId, shareWith, permissions) => {
  // Update file permissions
  await dynamodb.put({
    TableName: 'StackPro-FilePermissions',
    Item: {
      PK: `FILE#${fileId}`,
      SK: `USER#${shareWith}`,
      clientId,
      permissions: {
        read: permissions.read || false,
        comment: permissions.comment || false,
        edit: permissions.edit || false,
        download: permissions.download || false
      },
      sharedAt: new Date().toISOString(),
      sharedBy: getCurrentUser()
    }
  }).promise();
  
  // Notify via WebSocket if user is online
  await notifyUser(shareWith, {
    type: 'FILE_SHARED',
    fileId,
    fileName: await getFileName(fileId),
    sharedBy: getCurrentUser(),
    permissions
  });
  
  // Send email notification if offline
  await sendEmailNotification(shareWith, 'file_shared', {
    fileName: await getFileName(fileId),
    sharedBy: getCurrentUser(),
    clientPortalUrl: `https://${clientId}.stackpro.io/files/${fileId}`
  });
};
```

---

## 🔔 **Notification System**

### **1. Multi-Channel Notification Strategy**
```javascript
const notificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email', 
  PUSH: 'push',
  SMS: 'sms'
};

const sendNotification = async (userId, notification, channels) => {
  const user = await getUser(userId);
  const preferences = await getUserNotificationPreferences(userId);
  
  // Send to requested channels based on user preferences
  const tasks = channels.map(async (channel) => {
    if (!preferences[channel]) return;
    
    switch (channel) {
      case notificationChannels.IN_APP:
        return await sendInAppNotification(userId, notification);
      case notificationChannels.EMAIL:
        return await sendEmailNotification(user.email, notification);
      case notificationChannels.PUSH:
        return await sendPushNotification(user.deviceTokens, notification);
      case notificationChannels.SMS:
        return await sendSMSNotification(user.phone, notification);
    }
  });
  
  await Promise.all(tasks);
};

// Notification templates
const notificationTemplates = {
  NEW_MESSAGE: {
    inApp: 'New message from {senderName}',
    email: {
      subject: 'New message in {clientName} portal',
      template: 'new_message_email'
    },
    push: {
      title: '{senderName}',
      body: '{messagePreview}',
      icon: '/icons/message.png'
    }
  },
  FILE_SHARED: {
    inApp: '{sharerName} shared {fileName} with you',
    email: {
      subject: 'File shared: {fileName}',
      template: 'file_shared_email'
    }
  }
};
```

### **2. Smart Notification Batching**
```javascript
const batchNotifications = async () => {
  // Get pending notifications
  const pendingNotifications = await redis.smembers('pending_notifications');
  
  // Group by user and time window
  const grouped = groupNotificationsByUserAndTime(pendingNotifications, 300); // 5 min window
  
  // Send batched notifications
  for (const [userId, notifications] of Object.entries(grouped)) {
    if (notifications.length > 1) {
      await sendBatchedNotification(userId, notifications);
    } else {
      await sendSingleNotification(userId, notifications[0]);
    }
  }
  
  // Clear processed notifications
  await redis.del('pending_notifications');
};

// Run batch processing every 5 minutes
setInterval(batchNotifications, 300000);
```

---

## 🗄️ **Data Storage Strategy**

### **1. DynamoDB Table Design**
```javascript
// Single table design for all messaging data
{
  "TableName": "StackPro-Messaging",
  "KeySchema": [
    { "AttributeName": "PK", "KeyType": "HASH" },
    { "AttributeName": "SK", "KeyType": "RANGE" }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "GSI1",
      "KeySchema": [
        { "AttributeName": "GSI1PK", "KeyType": "HASH" },
        { "AttributeName": "GSI1SK", "KeyType": "RANGE" }
      ]
    },
    {
      "IndexName": "UserIndex", 
      "KeySchema": [
        { "AttributeName": "userId", "KeyType": "HASH" },
        { "AttributeName": "timestamp", "KeyType": "RANGE" }
      ]
    }
  ]
}

// Data patterns:
// CLIENT#123                    | METADATA               -> Client info
// CLIENT#123                    | CONVERSATION#456       -> Conversation metadata
// CLIENT#123                    | CONVERSATION#456#MSG#1 -> Individual message
// CLIENT#123                    | USER#789               -> User membership
// CLIENT#123                    | FILE#456#COMMENT#789   -> File comment
```

### **2. Redis Caching Strategy**
```javascript
const cacheStrategies = {
  // Active connections per client
  connections: {
    key: (clientId) => `client:${clientId}:connections`,
    ttl: 86400, // 24 hours
    type: 'set'
  },
  
  // Recent messages for fast loading
  recentMessages: {
    key: (conversationId) => `conversation:${conversationId}:recent`,
    ttl: 3600, // 1 hour
    type: 'list',
    maxLength: 50
  },
  
  // User presence information
  presence: {
    key: (userId) => `user:${userId}:presence`,
    ttl: 300, // 5 minutes
    type: 'hash'
  },
  
  // Typing indicators
  typing: {
    key: (conversationId) => `conversation:${conversationId}:typing`,
    ttl: 10, // 10 seconds
    type: 'set'
  }
};
```

---

## 🎯 **Frontend Integration**

### **1. React Chat Component**
```typescript
// Main chat interface
import React, { useState, useEffect } from 'react';
import { WebSocketProvider } from './WebSocketContext';

interface ChatInterfaceProps {
  clientId: string;
  userId: string;
  conversationId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  clientId, 
  userId, 
  conversationId 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

  useEffect(() => {
    // Load message history
    loadMessageHistory(conversationId).then(setMessages);
  }, [conversationId]);

  useEffect(() => {
    // Handle incoming messages
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      
      switch (message.type) {
        case 'NEW_MESSAGE':
          setMessages(prev => [...prev, message.data]);
          break;
        case 'TYPING_START':
          setIsTyping(prev => [...prev, message.userId]);
          break;
        case 'TYPING_STOP':
          setIsTyping(prev => prev.filter(id => id !== message.userId));
          break;
      }
    }
  }, [lastMessage]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      type: 'CHAT_MESSAGE',
      conversationId,
      content: {
        text: newMessage,
        type: 'text'
      }
    };

    sendMessage(JSON.stringify(message));
    setNewMessage('');
  };

  const handleTyping = (isTyping: boolean) => {
    const message = {
      type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
      conversationId
    };
    
    sendMessage(JSON.stringify(message));
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="connection-status">
          {connectionStatus === 'Open' ? (
            <span className="status-online">● Connected</span>
          ) : (
            <span className="status-offline">● Connecting...</span>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        
        {isTyping.length > 0 && (
          <TypingIndicator users={isTyping} />
        )}
      </div>

      <div className="message-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage} disabled={!newMessage.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
```

### **2. WebSocket Context Provider**
```typescript
const WebSocketContext = createContext<{
  sendMessage: (message: string) => void;
  lastMessage: MessageEvent | null;
  connectionStatus: string;
}>({} as any);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('Closed');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => setConnectionStatus('Open');
    ws.onclose = () => setConnectionStatus('Closed');
    ws.onmessage = (event) => setLastMessage(event);
    ws.onerror = (error) => console.error('WebSocket error:', error);

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, connectionStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

---

## 📊 **Analytics & Monitoring**

### **1. Message Analytics**
```javascript
const trackMessageMetrics = async (clientId, messageData) => {
  const metrics = [
    {
      MetricName: 'MessagesPerDay',
      Dimensions: [
        { Name: 'ClientId', Value: clientId }
      ],
      Value: 1,
      Timestamp: new Date()
    },
    {
      MetricName: 'ActiveUsers',
      Dimensions: [
        { Name: 'ClientId', Value: clientId }
      ],
      Value: await getActiveUserCount(clientId),
      Timestamp: new Date()
    }
  ];

  await cloudWatch.putMetricData({
    Namespace: 'StackPro/Messaging',
    MetricData: metrics
  }).promise();
};
```

### **2. Performance Monitoring**
```javascript
const monitorWebSocketPerformance = () => {
  return {
    connectionCount: redis.scard('all_connections'),
    messagesPerSecond: redis.get('messages_per_second'),
    averageResponseTime: cloudWatch.getMetric('ResponseTime'),
    errorRate: cloudWatch.getMetric('ErrorRate')
  };
};
```

---

## 🚀 **Implementation Timeline**

### **Week 1-2: Foundation**
1. Set up WebSocket API Gateway
2. Implement connection management
3. Basic message sending/receiving
4. DynamoDB schema setup

### **Week 3-4: Core Features**
1. File sharing integration
2. Comment system implementation
3. Notification system
4. Permission management

### **Week 5-6: Advanced Features**
1. Real-time presence indicators
2. Message search and history
3. File collaboration tools
4. Mobile optimizations

### **Week 7-8: Polish & Scale**
1. Performance optimization
2. Advanced security hardening
3. Analytics implementation
4. Load testing and scaling

This messaging architecture provides enterprise-grade communication features while maintaining strict client isolation and optimal performance.
