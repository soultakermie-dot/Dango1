const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chat_id, content } = req.body;

    if (!chat_id || !content) {
      return res.status(400).json({ error: 'Chat ID and content are required' });
    }

    // Verify user has access to this chat
    const chatResult = await db.raw(
      'SELECT * FROM chats WHERE id = ? AND (student_id = ? OR teacher_id = ?)',
      [chat_id, userId, userId]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = chatResult.rows[0];

    // Create message
    const messageResult = await db.raw(
      `INSERT INTO messages (chat_id, sender_id, content)
       VALUES (?, ?, ?)
       RETURNING *`,
      [chat_id, userId, content]
    );

    const message = messageResult.rows[0];

    // Update chat updated_at
    await db.raw(
      'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [chat_id]
    );

    // Create notification for recipient
    const recipientId = req.user.role === 'student' ? chat.teacher_id : chat.student_id;
    const senderName = req.user.name || `${req.user.first_name} ${req.user.last_name}`;

    await db.raw(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type)
       VALUES (?, 'message', 'New Message', ?, ?, 'chat')`,
      [
        recipientId,
        `You have a new message from ${senderName}`,
        chat_id
      ]
    );

    // Get sender info
    const senderResult = await db.raw(
      'SELECT name, first_name, last_name FROM users WHERE id = ?',
      [userId]
    );
    message.sender_name = senderResult.rows[0]?.name;
    message.sender_first_name = senderResult.rows[0]?.first_name;
    message.sender_last_name = senderResult.rows[0]?.last_name;

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for a chat
router.get('/chat/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this chat
    const chatResult = await db.raw(
      'SELECT * FROM chats WHERE id = ? AND (student_id = ? OR teacher_id = ?)',
      [chatId, userId, userId]
    );

    if (chatResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const result = await db.raw(
      `SELECT 
        m.*,
        u.name as sender_name,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [chatId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;

