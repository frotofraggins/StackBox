#!/usr/bin/env node

const AWS = require('aws-sdk');
const WebSocket = require('ws');
const fetch = require('node-fetch');

class MessagingSystemTester {
  constructor() {
    this.testClientId = 'test-client-messaging-' + Date.now();
    this.testUserId = 'test-user-' + Date.now();
    this.testResults = [];
    
    // AWS services
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.sns = new AWS.SNS();
    this.sqs = new AWS.SQS();
    
    // Base URLs
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
    this.wsBaseUrl = process.env.WS_BASE_URL || 'ws://localhost:8080';
    
    console.log('🧪 Initializing Messaging System Tests...');
    console.log(`📍 API Base URL: ${this.apiBaseUrl}`);
    console.log(`🔌 WebSocket URL: ${this.wsBaseUrl}`);
    console.log(`👤 Test Client ID: ${this.testClientId}`);
    console.log(`👤 Test User ID: ${this.testUserId}\n`);
  }

  async runAllTests() {
    console.log('🚀 Starting StackPro Messaging System Tests...\n');
    
    try {
      // Infrastructure Tests
      await this.testInfrastructure();
      
      // API Tests
      await this.testRestAPI();
      
      // WebSocket Tests
      await this.testWebSocketConnection();
      
      // Notification Tests
      await this.testNotificationSystem();
      
      // Integration Tests
      await this.testSystemIntegration();
      
      // Performance Tests
      await this.testPerformance();
      
      // Print results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testInfrastructure() {
    console.log('🏗️ Testing Infrastructure Components...');
    
    try {
      // Test DynamoDB tables
      const tables = [
        'StackPro-Connections',
        'StackPro-Messages', 
        'StackPro-Channels',
        'StackPro-Presence',
        'StackPro-Notifications'
      ];
      
      for (const tableName of tables) {
        try {
          const result = await this.dynamodb.scan({
            TableName: tableName,
            Limit: 1
          }).promise();
          
          this.addTestResult(`DynamoDB Table: ${tableName}`, true, {
            itemCount: result.Count || 0
          });
        } catch (error) {
          this.addTestResult(`DynamoDB Table: ${tableName}`, false, {
            error: error.message
          });
        }
      }
      
      // Test SNS topic
      try {
        const topics = await this.sns.listTopics().promise();
        const hasNotificationTopic = topics.Topics.some(t => 
          t.TopicArn.includes('stackpro-notifications')
        );
        
        this.addTestResult('SNS Notification Topics', hasNotificationTopic, {
          topicCount: topics.Topics.length
        });
      } catch (error) {
        this.addTestResult('SNS Notification Topics', false, {
          error: error.message
        });
      }
      
      // Test SQS queues
      try {
        const queues = await this.sqs.listQueues().promise();
        const hasMessagingQueue = queues.QueueUrls?.some(url => 
          url.includes('stackpro-messaging')
        ) || false;
        
        this.addTestResult('SQS Message Queues', hasMessagingQueue, {
          queueCount: queues.QueueUrls?.length || 0
        });
      } catch (error) {
        this.addTestResult('SQS Message Queues', false, {
          error: error.message
        });
      }
      
    } catch (error) {
      this.addTestResult('Infrastructure Test', false, {
        error: error.message
      });
    }
  }

  async testRestAPI() {
    console.log('🛠️ Testing REST API Endpoints...');
    
    const apiTests = [
      {
        name: 'Health Check',
        method: 'GET',
        path: '/messaging/health',
        expectedStatus: 200
      },
      {
        name: 'Get Channels',
        method: 'GET', 
        path: '/messaging/channels',
        expectedStatus: 200
      },
      {
        name: 'Create Channel',
        method: 'POST',
        path: '/messaging/channels',
        body: {
          name: 'Test Channel',
          description: 'Test channel for messaging system',
          type: 'public'
        },
        expectedStatus: 201
      },
      {
        name: 'Update Presence',
        method: 'PUT',
        path: '/messaging/presence',
        body: {
          status: 'online'
        },
        expectedStatus: 200
      },
      {
        name: 'Get Presence',
        method: 'GET',
        path: '/messaging/presence',
        expectedStatus: 200
      },
      {
        name: 'Get Notifications',
        method: 'GET',
        path: '/messaging/notifications',
        expectedStatus: 200
      },
      {
        name: 'Get Stats',
        method: 'GET',
        path: '/messaging/stats',
        expectedStatus: 200
      }
    ];
    
    let testChannelId = null;
    
    for (const test of apiTests) {
      try {
        const options = {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.testClientId,
            'x-user-id': this.testUserId
          }
        };
        
        if (test.body) {
          options.body = JSON.stringify(test.body);
        }
        
        const response = await fetch(`${this.apiBaseUrl}${test.path}`, options);
        const data = await response.json();
        
        const success = response.status === test.expectedStatus;
        
        this.addTestResult(`API: ${test.name}`, success, {
          status: response.status,
          expectedStatus: test.expectedStatus,
          hasData: !!data
        });
        
        // Store channel ID for message tests
        if (test.name === 'Create Channel' && success && data.channel) {
          testChannelId = data.channel.channelId;
        }
        
      } catch (error) {
        this.addTestResult(`API: ${test.name}`, false, {
          error: error.message
        });
      }
    }
    
    // Test message sending if we have a channel
    if (testChannelId) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/messaging/channels/${testChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.testClientId,
            'x-user-id': this.testUserId
          },
          body: JSON.stringify({
            content: 'Test message from automated test',
            type: 'text'
          })
        });
        
        const data = await response.json();
        
        this.addTestResult('API: Send Message', response.status === 201, {
          status: response.status,
          messageId: data.message?.messageId
        });
        
        // Test getting messages
        const getResponse = await fetch(`${this.apiBaseUrl}/messaging/channels/${testChannelId}/messages`, {
          headers: {
            'x-client-id': this.testClientId,
            'x-user-id': this.testUserId
          }
        });
        
        const getMessagesData = await getResponse.json();
        
        this.addTestResult('API: Get Messages', getResponse.status === 200, {
          status: getResponse.status,
          messageCount: getMessagesData.messages?.length || 0
        });
        
      } catch (error) {
        this.addTestResult('API: Message Operations', false, {
          error: error.message
        });
      }
    }
  }

  async testWebSocketConnection() {
    console.log('🔌 Testing WebSocket Connection...');
    
    return new Promise((resolve) => {
      try {
        const wsUrl = `${this.wsBaseUrl}?userId=${this.testUserId}&clientId=${this.testClientId}`;
        const ws = new WebSocket(wsUrl);
        
        let connected = false;
        let messageReceived = false;
        let heartbeatReceived = false;
        
        const timeout = setTimeout(() => {
          ws.close();
          this.addTestResult('WebSocket: Connection', connected, {
            connected,
            messageReceived,
            heartbeatReceived
          });
          resolve();
        }, 10000); // 10 second timeout
        
        ws.on('open', () => {
          console.log('  WebSocket connected');
          connected = true;
          
          // Send test message
          ws.send(JSON.stringify({
            action: 'heartbeat'
          }));
          
          // Send typing indicator
          setTimeout(() => {
            ws.send(JSON.stringify({
              action: 'typing',
              channelId: 'test-channel',
              isTyping: true
            }));
          }, 1000);
        });
        
        ws.on('message', (data) => {
          console.log('  WebSocket message received:', data.toString());
          messageReceived = true;
          
          try {
            const message = JSON.parse(data.toString());
            if (message.type === 'heartbeat' || message.success) {
              heartbeatReceived = true;
            }
          } catch (error) {
            console.log('  Could not parse WebSocket message');
          }
        });
        
        ws.on('error', (error) => {
          console.log('  WebSocket error:', error.message);
          clearTimeout(timeout);
          this.addTestResult('WebSocket: Connection', false, {
            error: error.message
          });
          resolve();
        });
        
        ws.on('close', (code, reason) => {
          console.log('  WebSocket closed:', code, reason.toString());
          clearTimeout(timeout);
          this.addTestResult('WebSocket: Connection', connected, {
            connected,
            messageReceived,
            heartbeatReceived,
            closeCode: code
          });
          resolve();
        });
        
      } catch (error) {
        this.addTestResult('WebSocket: Connection', false, {
          error: error.message
        });
        resolve();
      }
    });
  }

  async testNotificationSystem() {
    console.log('📮 Testing Notification System...');
    
    try {
      // Test creating a notification
      const response = await fetch(`${this.apiBaseUrl}/messaging/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.testClientId,
          'x-user-id': this.testUserId
        },
        body: JSON.stringify({
          userId: this.testUserId,
          type: 'test',
          title: 'Test Notification',
          body: 'This is a test notification from the messaging system test',
          data: {
            testData: 'automated test'
          }
        })
      });
      
      const data = await response.json();
      
      this.addTestResult('Notifications: Create', response.status === 201, {
        status: response.status,
        notificationId: data.notification?.notificationId
      });
      
      // Test getting notifications
      const getResponse = await fetch(`${this.apiBaseUrl}/messaging/notifications`, {
        headers: {
          'x-client-id': this.testClientId,
          'x-user-id': this.testUserId
        }
      });
      
      const getNotificationsData = await getResponse.json();
      
      this.addTestResult('Notifications: Retrieve', getResponse.status === 200, {
        status: getResponse.status,
        notificationCount: getNotificationsData.notifications?.length || 0
      });
      
    } catch (error) {
      this.addTestResult('Notifications: System Test', false, {
        error: error.message
      });
    }
  }

  async testSystemIntegration() {
    console.log('🔗 Testing System Integration...');
    
    try {
      // Test creating a document-specific channel
      const response = await fetch(`${this.apiBaseUrl}/messaging/documents/test-doc-123/channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.testClientId,
          'x-user-id': this.testUserId
        },
        body: JSON.stringify({
          documentName: 'Test Document for Integration'
        })
      });
      
      const data = await response.json();
      
      this.addTestResult('Integration: Document Channel', response.status === 201, {
        status: response.status,
        channelId: data.channel?.channelId,
        channelType: data.channel?.channelType
      });
      
      // Test system stats
      const statsResponse = await fetch(`${this.apiBaseUrl}/messaging/stats`, {
        headers: {
          'x-client-id': this.testClientId,
          'x-user-id': this.testUserId
        }
      });
      
      const statsData = await statsResponse.json();
      
      this.addTestResult('Integration: System Stats', statsResponse.status === 200, {
        status: statsResponse.status,
        hasChannels: (statsData.stats?.channels?.total || 0) > 0,
        hasUsers: (statsData.stats?.users?.total || 0) >= 0
      });
      
    } catch (error) {
      this.addTestResult('Integration: System Test', false, {
        error: error.message
      });
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    const performanceTests = [
      {
        name: 'API Response Time',
        test: async () => {
          const start = Date.now();
          await fetch(`${this.apiBaseUrl}/messaging/health`, {
            headers: {
              'x-client-id': this.testClientId,
              'x-user-id': this.testUserId
            }
          });
          return Date.now() - start;
        },
        threshold: 1000 // 1 second
      },
      {
        name: 'Channel List Performance',
        test: async () => {
          const start = Date.now();
          await fetch(`${this.apiBaseUrl}/messaging/channels`, {
            headers: {
              'x-client-id': this.testClientId,
              'x-user-id': this.testUserId
            }
          });
          return Date.now() - start;
        },
        threshold: 2000 // 2 seconds
      }
    ];
    
    for (const test of performanceTests) {
      try {
        const responseTime = await test.test();
        const success = responseTime < test.threshold;
        
        this.addTestResult(`Performance: ${test.name}`, success, {
          responseTime,
          threshold: test.threshold,
          passed: success
        });
        
      } catch (error) {
        this.addTestResult(`Performance: ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  addTestResult(testName, success, data = {}) {
    this.testResults.push({
      test: testName,
      success,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${success ? 'PASSED' : 'FAILED'}`);
    
    if (data.error) {
      console.log(`   Error: ${data.error}`);
    } else if (success && Object.keys(data).length > 0) {
      const details = Object.entries(data)
        .filter(([key]) => key !== 'success')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      if (details) {
        console.log(`   Details: ${details}`);
      }
    }
    console.log('');
  }

  printTestResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const passRate = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${passRate}%\n`);
    
    if (passRate === 100) {
      console.log('🎉 All tests passed! Your messaging system is ready for production.');
    } else if (passRate >= 80) {
      console.log('⚠️  Most tests passed, but some issues need attention.');
    } else {
      console.log('❌ Multiple test failures detected. Please review the errors.');
    }
    
    // Categorize results
    const categories = {
      'Infrastructure': [],
      'API': [],
      'WebSocket': [],
      'Notifications': [],
      'Integration': [],
      'Performance': []
    };
    
    this.testResults.forEach(result => {
      const category = result.test.split(':')[0];
      if (categories[category]) {
        categories[category].push(result);
      }
    });
    
    console.log('\n📋 Results by Category:');
    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        const passed = results.filter(r => r.success).length;
        const total = results.length;
        console.log(`${category}: ${passed}/${total} passed`);
      }
    });
    
    console.log('\n🧹 Cleanup:');
    console.log(`Test data was created with client ID: ${this.testClientId}`);
    console.log('You may want to clean up test data from DynamoDB tables.');
  }
}

// Main execution
async function main() {
  try {
    const tester = new MessagingSystemTester();
    await tester.runAllTests();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MessagingSystemTester;
