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
 * Accepts: identifier, password, role
 *   - role === 'admin'    → queries `admins` table using `username` column
 *   - role === 'customer' → queries `customers` table using `email` column
 * Verifies password with bcrypt.compare.
 * Returns status 200 with user role and success message on success.
 */
const login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Identifier, password, and role are required.',
      });
    }

    let rows;

    if (role === 'admin') {
      // Admin login: query admins table using username column
      [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [identifier]);
    } else {
      // Customer login: query customers table using email column
      [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [identifier]);
    }

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const user = rows[0];

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate JWT with role embedded
    const token = jwt.sign(
      {
        id: user.id,
        identifier: role === 'admin' ? user.username : user.email,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      role,
      token,
      user: {
        id: user.id,
        name: user.name,
        role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { register, login };
