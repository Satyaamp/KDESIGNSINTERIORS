const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_k_designs_key_123!');
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Admin account not found.'
      });
    }

    // Verify unique session concurrency
    if (decoded.sessionId && admin.currentSessionId && decoded.sessionId !== admin.currentSessionId) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALIDATED',
        message: 'Session invalidated. You have been logged in from another device.'
      });
    }

    req.admin = admin;
    req.userSessionId = decoded.sessionId; // Pass down for logout cleanup
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid or expired token.'
    });
  }
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // SuperAdmin bypasses all permission checks
    if (req.admin.role === 'SuperAdmin') {
      return next();
    }
    
    // Check if the permission is in the admin's list
    if (req.admin.permissions && req.admin.permissions.includes(requiredPermission)) {
      return next();
    }

    // Support legacy full-module permission fallback
    if (requiredPermission && requiredPermission.includes('_')) {
      const baseModule = requiredPermission.split('_')[0];
      if (req.admin.permissions && req.admin.permissions.includes(baseModule)) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions for this action.'
    });
  };
};

module.exports = { protect, checkPermission };
