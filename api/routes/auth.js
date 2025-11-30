const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const upload = require('../middleware/upload');

// Register
router.post('/register', upload, async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      login, 
      password, 
      role, 
      bio,
      age,
      city,
      experience,
      education,
      specialization,
      price_per_lesson,
      online_offline_format
    } = req.body;

    console.log('req.body', req.body);
    // Handle subjects array from FormData
    let subjects = [];
    if (req.body.subjects) {
      if (Array.isArray(req.body.subjects)) {
        subjects = req.body.subjects;
      } else if (typeof req.body.subjects === 'string') {
        // Handle single subject or comma-separated
        subjects = req.body.subjects.split(',').map(s => s.trim());
      } else if (req.body['subjects[]']) {
        // Handle FormData array format
        subjects = Array.isArray(req.body['subjects[]']) 
          ? req.body['subjects[]'] 
          : [req.body['subjects[]']];
      }
    }
    
    if (!first_name || !last_name || !login || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (role === 'teacher' && (!subjects || subjects.length === 0)) {
      return res.status(400).json({ error: 'Teachers must have at least one subject' });
    }

    if (role === 'student' && !age) {
      return res.status(400).json({ error: 'Age is required for students' });
    }

    // Check if user exists
    const existingUser = await db.raw(
      'SELECT id FROM users WHERE login = ?',
      [login]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this login already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get avatar filename if uploaded
    const avatar = req.file ? req.file.filename : null;

    // Build name from first_name and last_name for backward compatibility
    const name = `${first_name} ${last_name}`;

    // Insert user with new fields
    const userResult = await db.raw(
      `INSERT INTO users (
        name, first_name, last_name, login, password, role, bio, avatar,
        age, city, experience, education, specialization, price_per_lesson, online_offline_format
      ) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING id, name, first_name, last_name, login, role, bio, avatar, age, city, 
                 experience, education, specialization, price_per_lesson, online_offline_format`,
      [
        name, first_name, last_name, login, hashedPassword, role, bio || null, avatar,
        role === 'student' ? parseInt(age) : null,
        city || null,
        role === 'teacher' ? (experience || null) : null,
        role === 'teacher' ? (education || null) : null,
        role === 'teacher' ? (specialization || null) : null,
        role === 'teacher' ? (price_per_lesson ? parseFloat(price_per_lesson) : null) : null,
        role === 'teacher' ? (online_offline_format || 'both') : null
      ]
    );

    const userId = userResult.rows[0].id;

    // If teacher, insert subjects
    if (role === 'teacher' && subjects && subjects.length > 0) {
      for (const subjectId of subjects) {
        await db.raw(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
          [userId, parseInt(subjectId)]
        );
      }
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    if (!process.env.JWT_SECRET) {
      console.warn('Warning: JWT_SECRET not set, using default development secret. Set JWT_SECRET in .env for production!');
    }
    const token = jwt.sign(
      { id: userId, login, role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required' });
    }

    const result = await db.raw(
      `SELECT id, name, first_name, last_name, login, password, role, bio, avatar, 
              age, city, experience, education, specialization, price_per_lesson, online_offline_format 
       FROM users WHERE login = ?`,
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    const token = jwt.sign(
      { id: user.id, login: user.login, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    delete user.password;
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;

