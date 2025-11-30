const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get user's favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await db.raw(
      `SELECT 
        u.id,
        u.name,
        u.bio,
        u.avatar,
        u.role,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'name', s.name
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as subjects
      FROM favorites f
      JOIN users u ON f.teacher_id = u.id
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE f.student_id = ?
      GROUP BY u.id, u.name, u.bio, u.avatar, u.role
      ORDER BY u.name`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add to favorites
router.post('/:teacherId', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { teacherId } = req.params;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can add favorites' });
    }

    // Check if teacher exists
    const teacherCheck = await db.raw(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [teacherId, 'teacher']
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Check if already favorited
    const existing = await db.raw(
      'SELECT id FROM favorites WHERE student_id = ? AND teacher_id = ?',
      [studentId, teacherId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Teacher already in favorites' });
    }

    await db.raw(
      'INSERT INTO favorites (student_id, teacher_id) VALUES (?, ?)',
      [studentId, teacherId]
    );

    res.json({ message: 'Teacher added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove from favorites
router.delete('/:teacherId', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { teacherId } = req.params;

    const result = await db.raw(
      'DELETE FROM favorites WHERE student_id = ? AND teacher_id = ? RETURNING id',
      [studentId, teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Teacher removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Check if teacher is favorited
router.get('/check/:teacherId', authMiddleware, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { teacherId } = req.params;

    const result = await db.raw(
      'SELECT id FROM favorites WHERE student_id = ? AND teacher_id = ?',
      [studentId, teacherId]
    );

    res.json({ isFavorite: result.rows.length > 0 });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
});

module.exports = router;

