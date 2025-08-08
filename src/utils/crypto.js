/**
 * StackBox Cryptographic Utilities
 * Secure password and key generation functions
 */

const crypto = require('crypto');

/**
 * Generate a secure random password
 * @param {number} length - Password length
 * @param {Object} options - Password options
 * @returns {string} - Generated password
 */
function generateSecurePassword(length = 16, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options;

  let charset = '';
  
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (excludeSimilar) {
    charset = charset.replace(/[0O1lI]/g, '');
  }

  if (!charset) {
    throw new Error('At least one character type must be enabled');
  }

  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Generate a secure random key (hexadecimal)
 * @param {number} bytes - Number of bytes
 * @returns {string} - Generated key in hex format
 */
function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure random token (base64url)
 * @param {number} bytes - Number of bytes
 * @returns {string} - Generated token in base64url format
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Generate a UUID v4
 * @returns {string} - Generated UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Hash a password using bcrypt-compatible method
 * @param {string} password - Password to hash
 * @param {number} rounds - Salt rounds (default: 12)
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password, rounds = 12) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, rounds);
}

/**
 * Verify a password against its hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether password matches
 */
async function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a secure API key with prefix
 * @param {string} prefix - Key prefix (e.g., 'sk_', 'pk_')
 * @param {number} bytes - Number of random bytes
 * @returns {string} - Generated API key
 */
function generateApiKey(prefix = 'sk_', bytes = 32) {
  const randomPart = crypto.randomBytes(bytes).toString('hex');
  return `${prefix}${randomPart}`;
}

/**
 * Generate a secure database name
 * @param {string} clientId - Client identifier
 * @param {string} service - Service name
 * @returns {string} - Generated database name
 */
function generateDatabaseName(clientId, service = 'main') {
  const sanitized = clientId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${sanitized}_${service}_${generateSecureKey(4)}`;
}

/**
 * Generate environment-safe secret
 * @param {number} length - Secret length
 * @returns {string} - Environment-safe secret
 */
function generateEnvSecret(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    secret += charset[randomBytes[i] % charset.length];
  }

  return secret;
}

/**
 * Create a cryptographically secure random client subdomain
 * @param {string} baseName - Base name for the subdomain
 * @param {number} suffixLength - Length of random suffix
 * @returns {string} - Generated subdomain
 */
function generateClientSubdomain(baseName, suffixLength = 8) {
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  const suffix = crypto.randomBytes(suffixLength).toString('hex').substring(0, suffixLength);
  return `${sanitized}-${suffix}`;
}

module.exports = {
  generateSecurePassword,
  generateSecureKey,
  generateSecureToken,
  generateUUID,
  hashPassword,
  verifyPassword,
  generateApiKey,
  generateDatabaseName,
  generateEnvSecret,
  generateClientSubdomain
};
