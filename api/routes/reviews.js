const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Create a review (student only, after confirmed lesson)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teacher_id, lesson_request_id, rating, comment } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can create reviews' });
    }

    if (!teacher_id || !rating) {
      return res.status(400).json({ error: 'Teacher ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify lesson request exists and is confirmed
    if (lesson_request_id) {
      const requestResult = await db.raw(
        'SELECT * FROM lesson_requests WHERE id = ? AND student_id = ? AND status = ?',
        [lesson_request_id, userId, 'confirmed']
      );

      if (requestResult.rows.length === 0) {
        return res.status(400).json({ error: 'Lesson request not found or not confirmed' });
      }
    }

    // Check if review already exists
    const existingReview = await db.raw(
      'SELECT id FROM reviews WHERE teacher_id = ? AND student_id = ? AND lesson_request_id = ?',
      [teacher_id, userId, lesson_request_id || null]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this lesson' });
    }

    // Create review
    const result = await db.raw(
      `INSERT INTO reviews (teacher_id, student_id, lesson_request_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [teacher_id, userId, lesson_request_id || null, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Get reviews for a teacher
router.get('/teacher/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await db.raw(
      `SELECT 
        r.*,
        u.id as student_id,
        u.name as student_name,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.avatar as student_avatar
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.teacher_id = ?
       ORDER BY r.created_at DESC`,
      [teacherId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Update review (student only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can update reviews' });
    }

    // Get review
    const reviewResult = await db.raw(
      'SELECT * FROM reviews WHERE id = ? AND student_id = ?',
      [id, userId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updates = [];
    const params = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updates.push('rating = ?');
      params.push(rating);
    }

    if (comment !== undefined) {
      updates.push('comment = ?');
      params.push(comment);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const result = await db.raw(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = ? RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

module.exports = router;

