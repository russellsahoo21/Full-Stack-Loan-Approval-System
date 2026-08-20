import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isDbConnected } from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart_bre_credit_underwriting_secret_key_2026');
    
    if (isDbConnected) {
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        req.user = null;
      }
    }

    // Fallback to decoded payload info if DB connection is offline/whitelist pending
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
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
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
