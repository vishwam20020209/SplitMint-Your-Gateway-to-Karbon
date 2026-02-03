const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - checks if user is authenticated
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Access denied! 🚫' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production');
    
    // Find user by ID from token
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found! ❌' });
    }

    // Attach user to request object so routes can access it
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token! ❌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired! Please login again. ⏰' });
    }
    res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};

module.exports = authMiddleware;
