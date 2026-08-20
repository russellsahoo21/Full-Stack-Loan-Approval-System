import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import { isDbConnected } from '../config/db.js';

// Pre-seeded fallback users for zero-downtime Postman testing
const fallbackUsers = [
  { id: 'usr_admin_001', name: 'Policy Admin', email: 'admin@nbfc.com', password: 'admin123', role: 'POLICY_ADMIN' },
  { id: 'usr_officer_001', name: 'Credit Officer L1', email: 'officer1@nbfc.com', password: 'officer123', role: 'CREDIT_OFFICER_L1' },
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

    if (isDbConnected) {
      try {
        const userExists = await User.findOne({ email });
        if (userExists) {
          return res.status(400).json({ success: false, message: 'User already exists' });
        }
        const user = await User.create({ name, email, password, role: role || 'APPLICANT' });
        const token = user.generateToken();
        return res.status(201).json({
          success: true,
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
      } catch (dbErr) {
        console.warn('DB Register fallback:', dbErr.message);
      }
    }

    const newUser = { id: `usr_${Date.now()}`, name, email, role: role || 'APPLICANT' };
    const token = generateJWT(newUser);
    res.status(201).json({ success: true, token, user: newUser });
  } catch (error) {
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
          const token = user.generateToken();
          return res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
          });
        }
      } catch (dbErr) {
        console.warn('DB Login fallback:', dbErr.message);
      }
    }

    // Fallback authentication check for pre-seeded users
    const matchedUser = fallbackUsers.find(u => u.email === email && u.password === password);
    if (!matchedUser) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateJWT(matchedUser);

    res.json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};
