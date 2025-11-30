const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all teachers with their subjects and filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      search, 
      subject, 
      city, 
      min_price, 
      max_price, 
      online_offline_format,
      available_date,
      available_day 
    } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.first_name,
        u.last_name,
        u.bio,
        u.avatar,
        u.role,
        u.city,
        u.price_per_lesson,
        u.online_offline_format,
        u.experience,
        u.education,
        u.specialization,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', s2.id,
                'name', s2.name
              )
            )
            FROM (
              SELECT DISTINCT s2.id, s2.name
              FROM teacher_subjects ts2
              JOIN subjects s2 ON ts2.subject_id = s2.id
              WHERE ts2.teacher_id = u.id
            ) s2
          ),
          '[]'
        ) as subjects,
        COALESCE(
          ROUND(AVG(r.rating)::numeric, 2),
          0
        ) as rating,
        COUNT(DISTINCT r.id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.id = r.teacher_id
      WHERE u.role = 'teacher'
    `;

    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(u.name ILIKE ? OR u.first_name ILIKE ? OR u.last_name ILIKE ? OR u.bio ILIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (subject) {
      conditions.push(`u.id IN (
        SELECT teacher_id FROM teacher_subjects WHERE subject_id = ?
      )`);
      params.push(subject);
    }

    if (city) {
      conditions.push(`u.city ILIKE ?`);
      params.push(`%${city}%`);
    }

    if (min_price) {
      conditions.push(`u.price_per_lesson >= ?`);
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push(`u.price_per_lesson <= ?`);
      params.push(parseFloat(max_price));
    }

    if (online_offline_format) {
      conditions.push(`(u.online_offline_format = ? OR u.online_offline_format = 'both')`);
      params.push(online_offline_format);
    }

    if (available_date) {
      conditions.push(`u.id IN (
        SELECT DISTINCT teacher_id 
        FROM teacher_availability 
        WHERE date = ?::date AND is_available = true
      )`);
      params.push(available_date);
    }

    if (available_day !== undefined) {
      conditions.push(`u.id IN (
        SELECT DISTINCT teacher_id 
        FROM teacher_available_days 
        WHERE day_of_week = ?
      )`);
      params.push(parseInt(available_day));
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` GROUP BY u.id, u.name, u.first_name, u.last_name, u.bio, u.avatar, u.role, 
               u.city, u.price_per_lesson, u.online_offline_format, u.experience, 
               u.education, u.specialization 
               ORDER BY rating DESC, u.name`;

    const result = await db.raw(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get teacher by ID with subjects, reviews, and availability
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.raw(
      `SELECT 
        u.id,
        u.name,
        u.first_name,
        u.last_name,
        u.bio,
        u.avatar,
        u.role,
        u.city,
        u.price_per_lesson,
        u.online_offline_format,
        u.experience,
        u.education,
        u.specialization,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', s2.id,
                'name', s2.name
              )
            )
            FROM (
              SELECT DISTINCT s2.id, s2.name
              FROM teacher_subjects ts2
              JOIN subjects s2 ON ts2.subject_id = s2.id
              WHERE ts2.teacher_id = u.id
            ) s2
          ),
          '[]'
        ) as subjects,
        COALESCE(
          ROUND(AVG(r.rating)::numeric, 2),
          0
        ) as rating,
        COUNT(DISTINCT r.id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.id = r.teacher_id
      WHERE u.id = ? AND u.role = 'teacher'
      GROUP BY u.id, u.name, u.first_name, u.last_name, u.bio, u.avatar, u.role,
               u.city, u.price_per_lesson, u.online_offline_format, u.experience,
               u.education, u.specialization`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = result.rows[0];

    // Get availability
    const availabilityResult = await db.raw(
      `SELECT id, date, start_time, end_time, is_available 
       FROM teacher_availability 
       WHERE teacher_id = ? AND date >= CURRENT_DATE
       ORDER BY date, start_time`,
      [id]
    );
    teacher.availability = availabilityResult.rows;

    // Get weekly available days
    const availableDaysResult = await db.raw(
      `SELECT id, day_of_week, start_time, end_time
       FROM teacher_available_days
       WHERE teacher_id = ?
       ORDER BY day_of_week, start_time`,
      [id]
    );
    teacher.available_days = availableDaysResult.rows;

    // Get reviews with student info
    const reviewsResult = await db.raw(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id as student_id,
        u.name as student_name,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.avatar as student_avatar
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.teacher_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );
    teacher.reviews = reviewsResult.rows;

    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Get all subjects
router.get('/subjects/all', async (req, res) => {
  try {
    const result = await db.raw('SELECT id, name FROM subjects ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

module.exports = router;

