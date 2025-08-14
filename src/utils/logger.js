/**
 * StackPro Logger Utility
 * Centralized logging for the StackPro platform
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format timestamp for logging
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message with color and level
   */
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const colorMap = {
      INFO: colors.green,
      WARN: colors.yellow,
      ERROR: colors.red,
      DEBUG: colors.cyan
    };

    const color = colorMap[level] || colors.white;
    const formattedMessage = `${color}[${timestamp}] ${level}:${colors.reset} ${message}`;
    
    if (data && this.isDevelopment) {
      return `${formattedMessage}\n${colors.bright}Data:${colors.reset} ${JSON.stringify(data, null, 2)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    console.log(this.formatMessage('INFO', message, data));
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  /**
   * Log error message
   */
  error(message, error = null) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
      name: error.name
    } : error;

    console.error(this.formatMessage('ERROR', message, errorData));
  }

  /**
   * Log debug message (only in development)
   */
  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  /**
   * Log HTTP request
   */
  request(method, path, ip, statusCode = null, duration = null) {
    const statusColor = statusCode >= 400 ? colors.red : 
                       statusCode >= 300 ? colors.yellow : colors.green;
    
    let message = `${method} ${path} - ${ip}`;
    if (statusCode) {
      message += ` ${statusColor}[${statusCode}]${colors.reset}`;
    }
    if (duration) {
      message += ` (${duration}ms)`;
    }

    this.info(message);
  }

  /**
   * Log database operation
   */
  database(operation, table, duration = null) {
    let message = `DB ${operation.toUpperCase()} ${table}`;
    if (duration) {
      message += ` (${duration}ms)`;
    }
    this.debug(message);
  }

  /**
   * Log deployment operation
   */
  deployment(stage, message, data = null) {
    const stageEmoji = {
      start: '🚀',
      progress: '⏳',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    const emoji = stageEmoji[stage] || '📝';
    this.info(`${emoji} ${message}`, data);
  }

  /**
   * Log CRM operation
   */
  crm(operation, message, data = null) {
    const operationEmoji = {
      create: '➕',
      read: '📋',
      update: '✏️',
      delete: '🗑️',
      search: '🔍',
      stats: '📊'
    };

    const emoji = operationEmoji[operation] || '📝';
    this.info(`${emoji} CRM ${operation.toUpperCase()}: ${message}`, data);
  }

  /**
   * Log API operation
   */
  api(method, endpoint, status, duration = null, data = null) {
    const statusEmoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    const message = `${statusEmoji} API ${method} ${endpoint} [${status}]`;
    
    const logData = { ...(data || {}), duration_ms: duration };
    
    if (status >= 400) {
      this.error(message, logData);
    } else if (status >= 300) {
      this.warn(message, logData);
    } else {
      this.info(message, duration ? logData : data);
    }
  }

  /**
   * Log system startup
   */
  startup(service, port = null, version = null) {
    const message = `🚀 ${service} started${port ? ` on port ${port}` : ''}${version ? ` (v${version})` : ''}`;
    this.info(message);
  }

  /**
   * Log feature flag usage
   */
  feature(flag, enabled, context = null) {
    const emoji = enabled ? '🟢' : '🔴';
    this.info(`${emoji} Feature ${flag}: ${enabled ? 'ENABLED' : 'DISABLED'}`, context);
  }

  /**
   * Log user action
   */
  user(action, userId, details = null) {
    this.info(`👤 User ${action}: ${userId}`, details);
  }

  /**
   * Log security event
   */
  security(event, level = 'info', details = null) {
    const emoji = level === 'error' ? '🛡️❌' : level === 'warn' ? '🛡️⚠️' : '🛡️✅';
    const message = `${emoji} Security ${event}`;
    
    if (level === 'error') {
      this.error(message, details);
    } else if (level === 'warn') {
      this.warn(message, details);
    } else {
      this.info(message, details);
    }
  }

  /**
   * Create performance timer
   */
  timer(label) {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        this.debug(`⏱️ ${label}: ${duration}ms`);
        return duration;
      }
    };
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = { logger, Logger };
