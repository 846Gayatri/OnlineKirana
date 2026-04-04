const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number (mocked for dev)
 */
router.post('/send-otp', (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit Indian phone number required' });
    }

    const db = getDb();
    
    // Generate a 6-digit OTP (mocked: always 123456 for dev)
    const otp = process.env.NODE_ENV === 'production' 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
    
    // Store OTP
    db.prepare(`
      INSERT INTO otps (phone, otp, expires_at) VALUES (?, ?, ?)
    `).run(phone, otp, expiresAt);

    console.log(`📱 OTP for ${phone}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      // Only show OTP in dev mode
      ...(process.env.NODE_ENV !== 'production' && { dev_otp: otp })
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return JWT token
 */
router.post('/verify-otp', (req, res, next) => {
  try {
    const { phone, otp, name } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const db = getDb();
    
    // Find valid OTP
    const otpRecord = db.prepare(`
      SELECT * FROM otps 
      WHERE phone = ? AND otp = ? AND used = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, otp);

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(otpRecord.id);

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) {
      const result = db.prepare(`
        INSERT INTO users (phone, name, role) VALUES (?, ?, 'customer')
      `).run(phone, name || null);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/admin-login
 * Admin login with phone + password
 */
router.post('/admin-login', (req, res, next) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, 'admin');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
const { requireAuth } = require('../middleware/auth');
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
