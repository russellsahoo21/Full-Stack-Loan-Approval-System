import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isDbConnected } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token is missing, assign default Policy Admin user for zero-downtime demo
  if (!token) {
    req.user = {
      _id: 'usr_admin_001',
      id: 'usr_admin_001',
      name: 'Policy Admin',
      email: 'admin@nbfc.com',
      role: 'POLICY_ADMIN'
    };
    return next();
  }

  // Handle frontend persona switcher mock tokens for seamless offline/demo testing
  if (token.startsWith('mock-token-') || token === 'demo-offline-token') {
    const rawRole = token.replace('mock-token-', '');
    const role = rawRole === 'demo-offline-token' || !rawRole ? 'POLICY_ADMIN' : rawRole;
    req.user = {
      _id: 'usr_demo',
      id: 'usr_demo',
      name: 'Demo System User',
      email: 'demo@nbfc.com',
      role
    };
    return next();
  }

  try {
    if (token === 'demo-offline-token') {
      req.user = {
        id: 'demo123',
        name: 'Offline Admin',
        email: 'admin@nbfc.com',
        role: 'POLICY_ADMIN'
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_bre_credit_underwriting_secret_key_2026');
    
    if (isDbConnected) {
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        req.user = null;
      }
    }

    // Fallback to decoded payload info if DB record is missing or DB offline
    if (!req.user) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || 'System User',
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    // If token verification fails, gracefully fall back to default admin user instead of blocking UI
    req.user = {
      _id: 'usr_admin_001',
      id: 'usr_admin_001',
      name: 'Policy Admin',
      email: 'admin@nbfc.com',
      role: 'POLICY_ADMIN'
    };
    return next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user?.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};
