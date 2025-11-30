const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get availability for a teacher
router.get('/teacher/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT id, date, start_time, end_time, is_available
      FROM teacher_availability
      WHERE teacher_id = ?
    `;
    const params = [teacherId];

    if (start_date) {
      query += ' AND date >= ?::date';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?::date';
      params.push(end_date);
    }

    query += ' ORDER BY date, start_time';

    const result = await db.raw(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update availability (teacher only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update availability' });
    }

    const { date, start_time, end_time, is_available } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Date, start_time, and end_time are required' });
    }

    const result = await db.raw(
      `INSERT INTO teacher_availability (teacher_id, date, start_time, end_time, is_available)
       VALUES (?, ?::date, ?::time, ?::time, ?)
       ON CONFLICT (teacher_id, date, start_time) 
       DO UPDATE SET end_time = EXCLUDED.end_time, is_available = EXCLUDED.is_available, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, date, start_time, end_time, is_available !== false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Delete availability slot
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete availability' });
    }

    const result = await db.raw(
      'DELETE FROM teacher_availability WHERE id = ? AND teacher_id = ? RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    res.json({ message: 'Availability slot deleted' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

// Get my availability (teacher)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view their availability' });
    }

    const { start_date, end_date } = req.query;

    let query = `
      SELECT id, date, start_time, end_time, is_available
      FROM teacher_availability
      WHERE teacher_id = ?
    `;
    const params = [userId];

    if (start_date) {
      query += ' AND date >= ?::date';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?::date';
      params.push(end_date);
    }

    query += ' ORDER BY date, start_time';

    const result = await db.raw(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get my availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get weekly available days for a teacher
router.get('/teacher/:teacherId/days', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await db.raw(
      `SELECT id, day_of_week, start_time, end_time
       FROM teacher_available_days
       WHERE teacher_id = ?
       ORDER BY day_of_week, start_time`,
      [teacherId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get available days error:', error);
    res.status(500).json({ error: 'Failed to fetch available days' });
  }
});

// Get my weekly available days (teacher)
router.get('/me/days', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can view their available days' });
    }

    const result = await db.raw(
      `SELECT id, day_of_week, start_time, end_time
       FROM teacher_available_days
       WHERE teacher_id = ?
       ORDER BY day_of_week, start_time`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my available days error:', error);
    res.status(500).json({ error: 'Failed to fetch available days' });
  }
});

// Update weekly available days (teacher only)
router.post('/days', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update available days' });
    }

    const { day_of_week, start_time, end_time } = req.body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'day_of_week, start_time, and end_time are required' });
    }

    if (day_of_week < 0 || day_of_week > 6) {
      return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    const result = await db.raw(
      `INSERT INTO teacher_available_days (teacher_id, day_of_week, start_time, end_time)
       VALUES (?, ?, ?::time, ?::time)
       ON CONFLICT (teacher_id, day_of_week) 
       DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, day_of_week, start_time, end_time]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update available days error:', error);
    res.status(500).json({ error: 'Failed to update available days' });
  }
});

// Delete weekly available day
router.delete('/days/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete available days' });
    }

    const result = await db.raw(
      'DELETE FROM teacher_available_days WHERE id = ? AND teacher_id = ? RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Available day not found' });
    }

    res.json({ message: 'Available day deleted' });
  } catch (error) {
    console.error('Delete available day error:', error);
    res.status(500).json({ error: 'Failed to delete available day' });
  }
});

module.exports = router;

