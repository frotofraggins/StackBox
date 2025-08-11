const winston = require('winston');
const { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');

// Create CloudWatch Logs client
const cloudWatchLogs = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-west-2'
});

// Custom CloudWatch transport
class CloudWatchTransport extends winston.Transport {
  constructor(options) {
    super(options);
    this.logGroupName = options.logGroupName;
    this.logStreamName = options.logStreamName || `stream-${Date.now()}`;
    this.sequenceToken = null;
  }

  async log(info, callback) {
    try {
      // Ensure log stream exists
      if (!this.sequenceToken) {
        await this.createLogStreamIfNotExists();
      }

      const logEvent = {
        message: JSON.stringify({
          timestamp: new Date().toISOString(),
          level: info.level,
          message: info.message,
          ...info.meta
        }),
        timestamp: Date.now()
      };

      const params = {
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent]
      };

      if (this.sequenceToken) {
        params.sequenceToken = this.sequenceToken;
      }

      const command = new PutLogEventsCommand(params);
      const result = await cloudWatchLogs.send(command);
      this.sequenceToken = result.nextSequenceToken;

      callback();
    } catch (error) {
      console.error('CloudWatch logging failed:', error);
      callback();
    }
  }

  async createLogStreamIfNotExists() {
    try {
      const createCommand = new CreateLogStreamCommand({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      });
      await cloudWatchLogs.send(createCommand);
    } catch (error) {
      if (error.name !== 'ResourceAlreadyExistsException') {
        console.error('Failed to create log stream:', error);
      }
    }

    // Get existing sequence token if stream exists
    try {
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: this.logGroupName,
        logStreamNamePrefix: this.logStreamName
      });
      const streams = await cloudWatchLogs.send(describeCommand);

      const stream = streams.logStreams.find(s => s.logStreamName === this.logStreamName);
      if (stream && stream.uploadSequenceToken) {
        this.sequenceToken = stream.uploadSequenceToken;
      }
    } catch (error) {
      console.error('Failed to get sequence token:', error);
    }
  }
}

// Create logger configuration
const createLogger = (service = 'stackpro', clientId = null) => {
  const transports = [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? 
            `\n${JSON.stringify(meta, null, 2)}` : '';
          return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
        })
      )
    })
  ];

  // Add CloudWatch transport in production
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CLOUDWATCH_LOGS === 'true') {
    const logGroupName = clientId ? 
      `/stackpro/ai/${clientId}` : 
      `/stackpro/${service}`;

    transports.push(
      new CloudWatchTransport({
        logGroupName,
        logStreamName: `${service}-${Date.now()}`,
        level: 'info'
      })
    );
  }

  // Add file transport for persistent logging
  if (process.env.NODE_ENV !== 'test') {
    transports.push(
      new winston.transports.File({
        filename: `logs/${service}-error.log`,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }),
      new winston.transports.File({
        filename: `logs/${service}-combined.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service,
      clientId: clientId || 'system',
      environment: process.env.NODE_ENV || 'development'
    },
    transports,
    // Handle uncaught exceptions
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });
};

// Create default logger
const logger = createLogger();

// Helper function to create client-specific logger
const createClientLogger = (clientId, service = 'client-ai') => {
  return createLogger(service, clientId);
};

// Middleware for request logging
const requestLoggerMiddleware = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      clientId: req.user?.clientId,
      userId: req.user?.id
    });

    // Log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);
      
      const responseTime = Date.now() - startTime;
      
      logger.info('HTTP Response', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime,
        contentLength: res.get('Content-Length'),
        clientId: req.user?.clientId,
        userId: req.user?.id
      });
    };

    next();
  };
};

// Performance monitoring
const performanceLogger = (operation) => {
  return {
    start: (metadata = {}) => {
      const startTime = process.hrtime();
      const memoryBefore = process.memoryUsage();
      
      return {
        end: (result = 'success', additionalData = {}) => {
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
          const memoryAfter = process.memoryUsage();
          
          logger.info('Performance Metric', {
            operation,
            result,
            duration: Math.round(duration),
            memoryUsed: {
              rss: memoryAfter.rss - memoryBefore.rss,
              heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
              external: memoryAfter.external - memoryBefore.external
            },
            ...metadata,
            ...additionalData
          });
          
          return duration;
        }
      };
    }
  };
};

// Error logging helper
const logError = (error, context = {}) => {
  logger.error('Application Error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context
  });
};

// Success logging helper
const logSuccess = (message, data = {}) => {
  logger.info('Success', {
    message,
    ...data
  });
};

// AI-specific logging helpers
const logAIOperation = (operation, clientId, data = {}) => {
  logger.info(`AI Operation: ${operation}`, {
    clientId,
    operation,
    ...data
  });
};

const logAIError = (operation, clientId, error, data = {}) => {
  logger.error(`AI Error: ${operation}`, {
    clientId,
    operation,
    error: {
      message: error.message,
      stack: error.stack
    },
    ...data
  });
};

// Usage tracking logger
const logUsage = (clientId, service, usage = {}) => {
  logger.info('Usage Tracking', {
    clientId,
    service,
    timestamp: new Date().toISOString(),
    ...usage
  });
};

module.exports = {
  logger,
  createLogger,
  createClientLogger,
  requestLoggerMiddleware,
  performanceLogger,
  logError,
  logSuccess,
  logAIOperation,
  logAIError,
  logUsage
};
