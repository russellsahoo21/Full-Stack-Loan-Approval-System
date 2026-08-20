import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { isDbConnected } from '../config/db.js';

// Pre-seeded fallback users for zero-downtime Postman and frontend testing
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

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'APPLICANT'
    });

    console.log(`👤 [Auth] New user registered in MongoDB: ${user.email} (${user.role}) - ID: ${user._id}`);

    const token = user.generateToken ? user.generateToken() : generateJWT(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ [registerUser Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isDbConnected) {
      try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
          console.log(`🔑 [Auth] Successful login for: ${user.email} (${user.role})`);
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
        }
      } catch (dbErr) {
        console.warn('DB login query fallback:', dbErr.message);
      }
    }

    // Check pre-seeded fallback users
    const matchedUser = fallbackUsers.find(u => u.email === email && u.password === password);
    if (matchedUser) {
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
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
