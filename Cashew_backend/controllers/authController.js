const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Registers a new customer into the customers table.
 * Fields: name, mobile, email, password (hashed with bcrypt).
 */
const register = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Check if email already exists in customers table
    const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO customers (name, mobile, email, password) VALUES (?, ?, ?, ?)',
      [name, mobile || null, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { id: result.insertId, name, email, role: 'customer' },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/login
 *
 * Security improvement: client no longer sends 'role'.
 * The backend queries both tables to find the user and
 * determines the role from the database — not from user input.
 *
 * Accepts: { identifier, password }
 *   identifier = email (customers) or username (admins)
 *
 * Flow:
 *   1. Try admins table   by username
 *   2. Try customers table by email
 *   3. Verify password with bcrypt
 *   4. Sign JWT with role embedded
 *   5. Return token + user (including role)
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required.',
      });
    }

    let user = null;
    let role = null;

    // ── Step 1: Check admins table first (username match) ──────────
    const [adminRows] = await pool.query(
      'SELECT id, username AS name, username, password FROM admins WHERE username = ?',
      [identifier.trim()]
    );

    if (adminRows.length > 0) {
      user = adminRows[0];
      role = 'admin';
    } else {
      // ── Step 2: Fall back to customers table (email match) ───────
      const [customerRows] = await pool.query(
        'SELECT id, name, email, password FROM customers WHERE email = ?',
        [identifier.trim()]
      );

      if (customerRows.length > 0) {
        user = customerRows[0];
        role = 'customer';
      }
    }

    // ── Step 3: User not found in either table ────────────────────
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // ── Step 4: Verify password with bcrypt ───────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // ── Step 5: Sign JWT — role comes from DB, not from client ─────
    const token = jwt.sign(
      {
        id:         user.id,
        identifier: role === 'admin' ? user.username : user.email,
        role,               // role is DB-sourced, tamper-proof
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // ── Step 6: Return token + user object (including role) ────────
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:   user.id,
        name: user.name,
        role,   // frontend uses this for redirection
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { register, login };
