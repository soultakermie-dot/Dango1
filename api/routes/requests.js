const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Create a lesson request (student)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teacher_id, requested_date, requested_time, message } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can create lesson requests' });
    }

    if (!teacher_id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    // Check if teacher exists
    const teacherResult = await db.raw(
      'SELECT id, name FROM users WHERE id = ? AND role = ?',
      [teacher_id, 'teacher']
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Create request
    const requestResult = await db.raw(
      `INSERT INTO lesson_requests (student_id, teacher_id, requested_date, requested_time, message, status)
       VALUES (?, ?, ?, ?, ?, 'pending')
       RETURNING *`,
      [userId, teacher_id, requested_date || null, requested_time || null, message || null]
    );

    const request = requestResult.rows[0];

    // Create notification for teacher
    await db.raw(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES (?, 'lesson_request', 'New Lesson Request', ?, ?, 'lesson_request')`,
      [
        teacher_id,
        `You have a new lesson request from ${req.user.name || req.user.first_name}`,
        request.id
      ]
    );

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create lesson request' });
  }
});

// Get requests for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = '';
    let params = [];

    if (req.user.role === 'student') {
      query = `
        SELECT 
          lr.*,
          u.id as teacher_id,
          u.name as teacher_name,
          u.first_name as teacher_first_name,
          u.last_name as teacher_last_name,
          u.avatar as teacher_avatar,
          u.city as teacher_city
        FROM lesson_requests lr
        JOIN users u ON lr.teacher_id = u.id
        WHERE lr.student_id = ?
      `;
      params = [userId];
    } else if (req.user.role === 'teacher') {
      query = `
        SELECT 
          lr.*,
          u.id as student_id,
          u.name as student_name,
          u.first_name as student_first_name,
          u.last_name as student_last_name,
          u.avatar as student_avatar,
          u.age as student_age
        FROM lesson_requests lr
        JOIN users u ON lr.student_id = u.id
        WHERE lr.teacher_id = ?
      `;
      params = [userId];
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }

    if (status) {
      query += ' AND lr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY lr.created_at DESC';

    const result = await db.raw(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Update request status (teacher confirms/rejects)
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update request status' });
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be confirmed or rejected' });
    }

    // Get request
    const requestResult = await db.raw(
      'SELECT * FROM lesson_requests WHERE id = ? AND teacher_id = ?',
      [id, userId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Update request status
    await db.raw(
      'UPDATE lesson_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    // Get student info for notification
    const studentResult = await db.raw(
      'SELECT id, name, first_name FROM users WHERE id = ?',
      [request.student_id]
    );
    const student = studentResult.rows[0];

    if (status === 'confirmed') {
      // Create chat (check if exists first)
      const existingChat = await db.raw(
        'SELECT id FROM chats WHERE student_id = ? AND teacher_id = ? AND lesson_request_id = ?',
        [request.student_id, userId, id]
      );

      if (existingChat.rows.length === 0) {
        await db.raw(
          `INSERT INTO chats (student_id, teacher_id, lesson_request_id)
           VALUES (?, ?, ?)`,
          [request.student_id, userId, id]
        );
      }

      // Create notification for student
      await db.raw(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (?, 'lesson_confirmed', 'Lesson Confirmed', ?, ?, 'lesson_request')`,
        [
          request.student_id,
          `Your lesson request has been confirmed by ${req.user.name || req.user.first_name}`,
          id
        ]
      );
    } else {
      // Create notification for student
      await db.raw(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
         VALUES (?, 'lesson_rejected', 'Lesson Request Rejected', ?, ?, 'lesson_request')`,
        [
          request.student_id,
          `Your lesson request has been rejected by ${req.user.name || req.user.first_name}. You can choose another teacher.`,
          id
        ]
      );
    }

    // Get updated request
    const updatedResult = await db.raw(
      'SELECT * FROM lesson_requests WHERE id = ?',
      [id]
    );

    res.json(updatedResult.rows[0]);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

// Get request by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.raw(
      `SELECT 
        lr.*,
        teacher.id as teacher_id,
        teacher.name as teacher_name,
        teacher.first_name as teacher_first_name,
        teacher.last_name as teacher_last_name,
        teacher.avatar as teacher_avatar,
        student.id as student_id,
        student.name as student_name,
        student.first_name as student_first_name,
        student.last_name as student_last_name,
        student.avatar as student_avatar
       FROM lesson_requests lr
       JOIN users teacher ON lr.teacher_id = teacher.id
       JOIN users student ON lr.student_id = student.id
       WHERE lr.id = ? AND (lr.student_id = ? OR lr.teacher_id = ?)`,
      [id, userId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

module.exports = router;

