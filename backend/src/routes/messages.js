const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /messages - Retrieve all messages
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, content, created_at FROM messages ORDER BY created_at DESC LIMIT 50'
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /messages - Create a new message
router.post('/', async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required and cannot be empty',
      });
    }
    
    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Content must be less than 500 characters',
      });
    }
    
    const result = await pool.query(
      'INSERT INTO messages (content) VALUES ($1) RETURNING id, content, created_at',
      [content.trim()]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// GET /messages/:id - Retrieve a specific message
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, content, created_at FROM messages WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;