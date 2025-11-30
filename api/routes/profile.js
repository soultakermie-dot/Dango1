const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get current user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await db.raw(
      `SELECT id, name, first_name, last_name, login, role, bio, avatar, 
              age, city, experience, education, specialization, 
              price_per_lesson, online_offline_format 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // If teacher, get subjects
    if (user.role === 'teacher') {
      const subjectsResult = await db.raw(
        `SELECT s.id, s.name 
         FROM teacher_subjects ts
         JOIN subjects s ON ts.subject_id = s.id
         WHERE ts.teacher_id = ?
         ORDER BY s.name`,
        [userId]
      );
      user.subjects = subjectsResult.rows;
    }

    // Get lesson history
    if (user.role === 'student') {
      const requestsResult = await db.raw(
        `SELECT lr.*, u.name as teacher_name, u.first_name as teacher_first_name, 
                u.last_name as teacher_last_name, u.avatar as teacher_avatar
         FROM lesson_requests lr
         JOIN users u ON lr.teacher_id = u.id
         WHERE lr.student_id = ?
         ORDER BY lr.created_at DESC`,
        [userId]
      );
      user.lesson_history = requestsResult.rows;
    } else if (user.role === 'teacher') {
      const requestsResult = await db.raw(
        `SELECT lr.*, u.name as student_name, u.first_name as student_first_name,
                u.last_name as student_last_name, u.avatar as student_avatar
         FROM lesson_requests lr
         JOIN users u ON lr.student_id = u.id
         WHERE lr.teacher_id = ?
         ORDER BY lr.created_at DESC`,
        [userId]
      );
      user.lesson_history = requestsResult.rows;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/', authMiddleware, upload, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      first_name, 
      last_name, 
      login, 
      password, 
      bio,
      age,
      city,
      experience,
      education,
      specialization,
      price_per_lesson,
      online_offline_format
    } = req.body;
    
    // Handle subjects array from FormData
    let subjects = [];
    if (req.body.subjects) {
      if (Array.isArray(req.body.subjects)) {
        subjects = req.body.subjects;
      } else if (typeof req.body.subjects === 'string') {
        subjects = req.body.subjects.split(',').map(s => s.trim());
      } else if (req.body['subjects[]']) {
        subjects = Array.isArray(req.body['subjects[]']) 
          ? req.body['subjects[]'] 
          : [req.body['subjects[]']];
      }
    }

    // Get current user
    const currentUserResult = await db.raw(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = currentUserResult.rows[0];
    const updates = [];
    const params = [];

    // Update first_name and last_name
    if (first_name !== undefined) {
      updates.push(`first_name = ?`);
      params.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push(`last_name = ?`);
      params.push(last_name);
    }

    // Update name from first_name and last_name
    if (first_name !== undefined || last_name !== undefined) {
      const newFirstName = first_name !== undefined ? first_name : currentUser.first_name;
      const newLastName = last_name !== undefined ? last_name : currentUser.last_name;
      updates.push(`name = ?`);
      params.push(`${newFirstName} ${newLastName}`);
    }

    // Update login (check if not taken by another user)
    if (login !== undefined && login !== currentUser.login) {
      const loginCheck = await db.raw(
        'SELECT id FROM users WHERE login = ? AND id != ?',
        [login, userId]
      );

      if (loginCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Login already taken' });
      }

      updates.push(`login = ?`);
      params.push(login);
    }

    // Update password
    if (password !== undefined && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = ?`);
      params.push(hashedPassword);
    }

    // Update bio
    if (bio !== undefined) {
      updates.push(`bio = ?`);
      params.push(bio);
    }

    // Update role-specific fields
    if (currentUser.role === 'student') {
      if (age !== undefined) {
        updates.push(`age = ?`);
        params.push(parseInt(age));
      }
      if (city !== undefined) {
        updates.push(`city = ?`);
        params.push(city);
      }
    } else if (currentUser.role === 'teacher') {
      if (city !== undefined) {
        updates.push(`city = ?`);
        params.push(city);
      }
      if (experience !== undefined) {
        updates.push(`experience = ?`);
        params.push(experience);
      }
      if (education !== undefined) {
        updates.push(`education = ?`);
        params.push(education);
      }
      if (specialization !== undefined) {
        updates.push(`specialization = ?`);
        params.push(specialization);
      }
      if (price_per_lesson !== undefined) {
        updates.push(`price_per_lesson = ?`);
        params.push(parseFloat(price_per_lesson));
      }
      if (online_offline_format !== undefined) {
        updates.push(`online_offline_format = ?`);
        params.push(online_offline_format);
      }
    }

    // Update avatar if new file uploaded
    if (req.file) {
      updates.push(`avatar = ?`);
      params.push(req.file.filename);
    }

    // Update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 0) {
      params.push(userId);
      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ? 
                          RETURNING id, name, first_name, last_name, login, role, bio, avatar, 
                                    age, city, experience, education, specialization, 
                                    price_per_lesson, online_offline_format`;
      await db.raw(updateQuery, params);
    }

    // If teacher, update subjects
    if (currentUser.role === 'teacher' && subjects !== undefined) {
      // Delete existing subjects
      await db.raw(
        'DELETE FROM teacher_subjects WHERE teacher_id = ?',
        [userId]
      );

      // Insert new subjects
      if (Array.isArray(subjects) && subjects.length > 0) {
        for (const subjectId of subjects) {
          await db.raw(
            'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
            [userId, parseInt(subjectId)]
          );
        }
      }
    }

    // Get updated user
    const updatedUserResult = await db.raw(
      `SELECT id, name, first_name, last_name, login, role, bio, avatar, 
              age, city, experience, education, specialization, 
              price_per_lesson, online_offline_format 
       FROM users WHERE id = ?`,
      [userId]
    );

    const updatedUser = updatedUserResult.rows[0];

    // Get subjects if teacher
    if (updatedUser.role === 'teacher') {
      const subjectsResult = await db.raw(
        `SELECT s.id, s.name 
         FROM teacher_subjects ts
         JOIN subjects s ON ts.subject_id = s.id
         WHERE ts.teacher_id = ?
         ORDER BY s.name`,
        [userId]
      );
      updatedUser.subjects = subjectsResult.rows;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;

