/**
 * StackBox Config Validation
 * Validates client JSON configuration files against schema
 */

const Joi = require('joi');

// Define the schema for client configuration validation
const clientConfigSchema = Joi.object({
  clientId: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .description('Unique identifier for the client'),

  email: Joi.string()
    .email()
    .required()
    .description('Client email address for notifications and admin access'),

  domain: Joi.string()
    .domain()
    .description('Custom domain if client is using their own domain'),

  subdomain: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .when('domain', {
      is: Joi.exist().not(null, ''),
      then: Joi.optional(),
      otherwise: Joi.required()
    })
    .description('Subdomain when using stackbox.io as primary domain'),

  features: Joi.object({
    espocrm: Joi.boolean().default(true),
    nextcloud: Joi.boolean().default(true),
    calcom: Joi.boolean().default(false),
    mailtrain: Joi.boolean().default(false),
    staticSite: Joi.boolean().default(true),
    cmsSite: Joi.boolean().default(false)
  }).required(),

  resources: Joi.object({
    instanceType: Joi.string().default('t2.micro'),
    storageGB: Joi.number().integer().min(8).max(100).default(8),
    subdomains: Joi.array().items(Joi.string()).default([])
  }).default(),

  branding: Joi.object({
    logoUrl: Joi.string().uri(),
    themeColor: Joi.string().regex(/^#[0-9A-Fa-f]{6}$/),
    companyName: Joi.string().max(50)
  }).default()
});

/**
 * Validates a client configuration object against the schema
 * @param {Object} config - Client configuration object
 * @returns {Object} - Validation result with value and error properties
 */
function validateClientConfig(config) {
  return clientConfigSchema.validate(config, { abortEarly: false });
}

/**
 * Validates a client configuration file
 * @param {string} configPath - Path to the client configuration JSON file
 * @returns {Promise<Object>} - Promise resolving to validation result
 */
async function validateClientConfigFile(configPath) {
  try {
    const config = require(configPath);
    return validateClientConfig(config);
  } catch (error) {
    return { error: new Error(`Failed to read or parse config file: ${error.message}`) };
  }
}

module.exports = {
  validateClientConfig,
  validateClientConfigFile,
  clientConfigSchema
};
