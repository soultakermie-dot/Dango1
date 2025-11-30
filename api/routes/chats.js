const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get all chats for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    let query = '';
    if (req.user.role === 'student') {
      query = `
        SELECT 
          c.id,
          c.lesson_request_id,
          c.created_at,
          c.updated_at,
          u.id as teacher_id,
          u.name as teacher_name,
          u.first_name as teacher_first_name,
          u.last_name as teacher_last_name,
          u.avatar as teacher_avatar,
          (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) as unread_count,
          (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
        FROM chats c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.student_id = ?
        ORDER BY c.updated_at DESC
      `;
    } else {
      query = `
        SELECT 
          c.id,
          c.lesson_request_id,
          c.created_at,
          c.updated_at,
          u.id as student_id,
          u.name as student_name,
          u.first_name as student_first_name,
          u.last_name as student_last_name,
          u.avatar as student_avatar,
          (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) as unread_count,
          (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
        FROM chats c
        JOIN users u ON c.student_id = u.id
        WHERE c.teacher_id = ?
        ORDER BY c.updated_at DESC
      `;
    }

    const result = await db.raw(query, [userId, userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get chat by ID with messages
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get chat
    const chatResult = await db.raw(
      'SELECT * FROM chats WHERE id = ? AND (student_id = ? OR teacher_id = ?)',
      [id, userId, userId]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatResult.rows[0];

    // Get other user info
    const otherUserId = req.user.role === 'student' ? chat.teacher_id : chat.student_id;
    const userResult = await db.raw(
      'SELECT id, name, first_name, last_name, avatar FROM users WHERE id = ?',
      [otherUserId]
    );
    chat.other_user = userResult.rows[0];

    // Get messages
    const messagesResult = await db.raw(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [id]
    );
    chat.messages = messagesResult.rows;

    // Mark messages as read
    await db.raw(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE chat_id = ? AND sender_id != ? AND read_at IS NULL',
      [id, userId]
    );

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

module.exports = router;

