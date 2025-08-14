const jwt = require('jsonwebtoken');

/**
 * Tenant middleware - Extracts owner_id from JWT token
 * Ensures all API requests are scoped to the authenticated tenant
 */
const tenantMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract owner_id from token payload
    req.owner_id = decoded.owner_id || decoded.sub;
    
    if (!req.owner_id) {
      return res.status(401).json({ error: 'Invalid token: missing owner_id' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = tenantMiddleware;
