const jwt = require('jsonwebtoken');

// HARDCODED SECRET (same one used for creating tokens)
const JWT_SECRET = 'flowstock_super_secret_key_change_in_production_12345';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔐 Auth Check - Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🎫 Verifying token...');

    // Use hardcoded secret
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified for user:', decoded.username);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      error: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;