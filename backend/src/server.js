import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import syntheticRoutes from './routes/syntheticRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import bureauRoutes from './routes/bureauRoutes.js';
import exceptionRoutes from './routes/exceptionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import extractRoutes from './routes/extractRoutes.js';

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware for debugging & audit
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/synthetic', syntheticRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bureau', bureauRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/extract-statement', extractRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'Smart Credit Underwriting Platform & Configurable BRE Engine Backend',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 BRE Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
