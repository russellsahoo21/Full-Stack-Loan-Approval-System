import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { isDbConnected } from '../config/db.js';

// Pre-seeded fallback users for demo accounts
const fallbackUsers = [
  { id: 'usr_admin_001', name: 'Policy Admin', email: 'admin@nbfc.com', password: 'admin123', role: 'POLICY_ADMIN' },
  { id: 'usr_officer_001', name: 'Credit Officer L1', email: 'officer1@nbfc.com', password: 'officer123', role: 'CREDIT_OFFICER_L1' },
  { id: 'usr_officer_002', name: 'Credit Officer L2', email: 'officer2@nbfc.com', password: 'officer123', role: 'CREDIT_OFFICER_L2' },
  { id: 'usr_applicant_001', name: 'Rahul Sharma', email: 'rahul@gmail.com', password: 'rahul123', role: 'APPLICANT' }
];

const generateJWT = (user) => {
  return jwt.sign(
    { id: user.id || user._id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'smart_bre_credit_underwriting_secret_key_2026',
    { expiresIn: '7d' }
  );
};

export const isValidEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split('.');
  const tld = domainParts[domainParts.length - 1];
  return Boolean(tld && tld.length >= 2);
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !isValidEmailDomain(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address with a valid domain (e.g. name@gmail.com, name@outlook.com, name@nbfc.com).' 
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 4 characters long.' 
      });
    }

    const cleanEmail = email.toLowerCase();

    if (isDbConnected) {
      const userExists = await User.findOne({ email: cleanEmail });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already registered with this email address.' });
      }

      const user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: role || 'APPLICANT'
      });

      console.log(`👤 [Auth] Registered new user in DB: ${user.email} (${user.role})`);

      const token = user.generateToken ? user.generateToken() : generateJWT(user);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      // In-memory registration fallback if DB is disconnected
      const newUser = {
        id: `usr_${Date.now()}`,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: role || 'APPLICANT'
      };
      fallbackUsers.push(newUser);
      const token = generateJWT(newUser);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    }
  } catch (error) {
    console.error('❌ [registerUser Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmailDomain(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address with a valid domain (e.g. name@gmail.com, name@outlook.com, name@nbfc.com).' 
      });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Please enter your password.' });
    }

    const cleanEmail = email.toLowerCase();

    // 1. Try DB user authentication first
    if (isDbConnected) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          const isMatch = await user.matchPassword(password);
          if (isMatch) {
            console.log(`🔑 [Auth DB] Successful login for: ${user.email} (${user.role})`);
            const token = user.generateToken ? user.generateToken() : generateJWT(user);
            return res.json({
              success: true,
              token,
              user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              }
            });
          } else {
            return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
          }
        }
      } catch (dbErr) {
        console.warn('DB login lookup warning:', dbErr.message);
      }
    }

    // 2. Check pre-seeded fallback demo users
    const matchedUser = fallbackUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      if (matchedUser.password === password) {
        console.log(`🔑 [Auth Pre-seeded] Successful login for: ${matchedUser.email} (${matchedUser.role})`);
        const token = generateJWT(matchedUser);
        return res.json({
          success: true,
          token,
          user: {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email,
            role: matchedUser.role
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      }
    }

    // 3. User is NOT registered
    return res.status(401).json({ 
      success: false, 
      message: 'Account not found. This email is not registered in the system. Please create an account first.' 
    });
  } catch (error) {
    console.error('❌ [loginUser Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};
