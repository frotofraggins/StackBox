/**
 * StackPro Database Service
 * Handles user data persistence - can use Supabase, SQLite, or PostgreSQL
 */

const { logger } = require('../utils/logger');

class DatabaseService {
  constructor() {
    // For now, we'll use in-memory storage for quick setup
    // In production, you'd connect to Supabase, PostgreSQL, or DynamoDB
    this.users = new Map();
    this.clients = new Map();
    
    logger.info('🗄️ Database service initialized (in-memory mode)');
    
    // Add demo user for testing
    this.initializeDemoData();
  }

  /**
   * Initialize with demo data for testing
   */
  initializeDemoData() {
    const demoUser = {
      id: 'demo-user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'demo@stackpro.io',
      company: 'Demo Company',
      password: '$2b$10$rQZ9j4kTu5Zv0sOGJ2xBXe7FH.1EY2yX3Nz8mW6dB9tP5qL7vA8sK', // password: 'demo123'
      plan: 'business',
      clientId: 'demo-company-12345',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.users.set(demoUser.email, demoUser);
    this.users.set(demoUser.id, demoUser);
    this.clients.set(demoUser.clientId, demoUser);

    logger.info('✅ Demo data initialized:', { 
      email: 'demo@stackpro.io', 
      password: 'demo123',
      clientId: 'demo-company-12345'
    });
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      // Store by email and by ID for different lookup needs
      this.users.set(userData.email, userData);
      this.users.set(userData.id, userData);
      this.clients.set(userData.clientId, userData);
      
      logger.info('✅ User created:', { 
        id: userData.id, 
        email: userData.email,
        clientId: userData.clientId
      });

      return userData;
    } catch (error) {
      logger.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserByEmail(email) {
    try {
      const user = this.users.get(email);
      
      if (user) {
        logger.info('👤 User found by email:', { email, clientId: user.clientId });
      } else {
        logger.info('👤 User not found by email:', { email });
      }

      return user || null;
    } catch (error) {
      logger.error('❌ Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserById(userId) {
    try {
      const user = this.users.get(userId);
      
      if (user) {
        logger.info('👤 User found by ID:', { userId, email: user.email });
      } else {
        logger.info('👤 User not found by ID:', { userId });
      }

      return user || null;
    } catch (error) {
      logger.error('❌ Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by client ID
   * @param {string} clientId - Client ID
   * @returns {Promise<Object|null>} User data or null
   */
  async getUserByClientId(clientId) {
    try {
      const user = this.clients.get(clientId);
      
      if (user) {
        logger.info('👤 User found by client ID:', { clientId, email: user.email });
      } else {
        logger.info('👤 User not found by client ID:', { clientId });
      }

      return user || null;
    } catch (error) {
      logger.error('❌ Error getting user by client ID:', error);
      throw error;
    }
  }

  /**
   * Update user data
   * @param {string} userId - User ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updates) {
    try {
      const existingUser = this.users.get(userId);
      
      if (!existingUser) {
        throw new Error(`User not found: ${userId}`);
      }

      const updatedUser = {
        ...existingUser,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update all references
      this.users.set(updatedUser.email, updatedUser);
      this.users.set(updatedUser.id, updatedUser);
      this.clients.set(updatedUser.clientId, updatedUser);

      logger.info('✅ User updated:', { 
        userId, 
        updates: Object.keys(updates),
        email: updatedUser.email
      });

      return updatedUser;
    } catch (error) {
      logger.error('❌ Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      const existingUser = this.users.get(userId);
      
      if (!existingUser) {
        throw new Error(`User not found: ${userId}`);
      }

      // Remove all references
      this.users.delete(existingUser.email);
      this.users.delete(existingUser.id);
      this.clients.delete(existingUser.clientId);

      logger.info('✅ User deleted:', { userId, email: existingUser.email });

      return true;
    } catch (error) {
      logger.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get all users (for admin purposes)
   * @returns {Promise<Array>} List of all users
   */
  async getAllUsers() {
    try {
      const userList = [];
      
      // Get unique users (since we store by email and ID)
      for (const [key, user] of this.users.entries()) {
        if (key === user.id) { // Only get users stored by ID to avoid duplicates
          userList.push({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            clientId: user.clientId,
            plan: user.plan,
            status: user.status,
            createdAt: user.createdAt
          });
        }
      }

      logger.info('📊 Retrieved all users:', { count: userList.length });

      return userList;
    } catch (error) {
      logger.error('❌ Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStats() {
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        trialUsers: users.filter(u => u.status === 'trial').length,
        planDistribution: {
          starter: users.filter(u => u.plan === 'starter').length,
          business: users.filter(u => u.plan === 'business').length,
          enterprise: users.filter(u => u.plan === 'enterprise').length
        }
      };

      logger.info('📊 Database stats:', stats);

      return stats;
    } catch (error) {
      logger.error('❌ Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Initialize production database connection
   * This method would be called to set up real database connections
   */
  async initializeProductionDB() {
    // This is where you'd initialize Supabase, PostgreSQL, or DynamoDB
    
    // Example Supabase initialization:
    /*
    const { createClient } = require('@supabase/supabase-js');
    
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    logger.info('✅ Supabase connection initialized');
    */

    // Example PostgreSQL initialization:
    /*
    const { Pool } = require('pg');
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    logger.info('✅ PostgreSQL connection initialized');
    */

    logger.info('🔄 Production DB initialization not implemented yet (using in-memory storage)');
  }

  /**
   * Health check for database connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        type: 'in-memory',
        users: stats.totalUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('❌ Database health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { DatabaseService };
